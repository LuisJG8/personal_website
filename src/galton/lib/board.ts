import * as THREE from 'three';
import badgeUrl from '../assets/galton-badge.png';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ROWS, SPACING, samplePath } from './probability';
export type Phase = 'ready' | 'flipping' | 'running' | 'complete' | 'gathering';
export type BoardState = {
    phase: Phase;
    landed: number;
    counts: number[];
    inverted: boolean;
};
type Ball = {
    path: number[];
    bin: number;
    release: number;
    landed: boolean;
    target: THREE.Vector3;
    start: THREE.Vector3;
};
const TOP = 2.85, DY = .235, FLOOR = -5.42, RADIUS = .036;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export class GaltonBoard {
    private renderer: THREE.WebGLRenderer;
    private scene = new THREE.Scene();
    private camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    private chamber = new THREE.Group();
    private machine = new THREE.Group();
    private ballsMesh!: THREE.InstancedMesh;
    private balls: Ball[] = [];
    private counts = Array(ROWS + 1).fill(0) as number[];
    private matrix = new THREE.Object3D();
    private observer: ResizeObserver;
    private frame = 0;
    private time = 0;
    private previous = 0;
    private phase: Phase = 'ready';
    private inverted = true;
    private rotationStart = Math.PI;
    private rotationEnd = Math.PI;
    private flipTime = 0;
    private count = 800;
    private rate = 65;
    private speed = 1;
    private paused = false;
    private onState: (state: BoardState) => void;
    private targets: THREE.Vector3[] = [];
    private curve = new THREE.Group();
    private disposed = false;
    private lastNotify = 0;
    private angle = .10;
    private dragX = 0;
    private dragStartX = 0;
    private dragging = false;
    private moved = false;
    constructor(private host: HTMLElement, onState: (state: BoardState) => void, private onFlip: () => void) {
        this.onState = onState;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0xf3f2ed, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        host.appendChild(this.renderer.domElement);
        this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D Galton board. Click the rotating chamber to flip; drag to rotate the view through 360 degrees.');
        this.renderer.domElement.setAttribute('role', 'img');
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa6a49c, 3));
        const light = new THREE.DirectionalLight(0xfff8e7, 5);
        light.position.set(-7, 12, 10);
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        Object.assign(light.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 45 });
        light.shadow.bias = -.0005;
        this.scene.add(light);
        const rim = new THREE.DirectionalLight(0xdceaff, 3);
        rim.position.set(7, 5, -4);
        this.scene.add(rim);
        this.scene.add(this.machine);
        this.machine.rotation.y = this.angle;
        this.machine.add(this.chamber);
        this.chamber.rotation.x = Math.PI;
        this.buildMachine();
        this.buildBalls();
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .13 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -9.65;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(host);
        this.resize();
        this.renderer.domElement.addEventListener('pointerdown', this.pointerDown);
        this.renderer.domElement.addEventListener('pointermove', this.pointerMove);
        this.renderer.domElement.addEventListener('pointerup', this.pointerUp);
        this.renderer.domElement.addEventListener('pointercancel', this.pointerCancel);
        this.notify();
        this.frame = requestAnimationFrame(this.animate);
    }
    private box(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, r = .06) {
        const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }
    private tube(parent: THREE.Object3D, points: THREE.Vector3[], radius: number, mat: THREE.Material) {
        const curve = new THREE.CatmullRomCurve3(points);
        const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, points.length * 8), radius, 6, false), mat);
        parent.add(m);
        return m;
    }
    private buildMachine() {
        const black = new THREE.MeshStandardMaterial({ color: 0x242727, roughness: .33, metalness: .45 });
        const silver = new THREE.MeshStandardMaterial({ color: 0xc6d5d9, metalness: .72, roughness: .2 });
        const glass = new THREE.MeshPhysicalMaterial({ color: 0xb9cde7, metalness: 0, roughness: .12, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
        const edge = new THREE.MeshPhysicalMaterial({ color: 0xd4e7ed, metalness: .28, roughness: .15, transparent: true, opacity: .7 });
        this.box(this.machine, 9.5, 3.0, 3.4, 0, -8.1, 0, black, .18);
        const badgeTexture = new THREE.TextureLoader().load(badgeUrl);
        badgeTexture.colorSpace = THREE.SRGBColorSpace;
        const badge = new THREE.Mesh(new THREE.CircleGeometry(.7, 48), new THREE.MeshBasicMaterial({ map: badgeTexture }));
        badge.position.set(0, -8.1, 1.71);
        this.machine.add(badge);
        this.box(this.machine, 8.9, .25, 3.0, 0, -6.48, 0, black, .1);
        for (const x of [-4.48, 4.48]) {
            this.box(this.machine, .62, 6.75, 1.5, x, -3.12, 0, black, .1);
            const axle = new THREE.Mesh(new THREE.CylinderGeometry(.21, .21, .65, 24), silver);
            axle.rotation.z = Math.PI / 2;
            axle.position.set(x, 0, 0);
            this.machine.add(axle);
            this.box(this.machine, 1.5, .1, 2.7, x * .85, -9.59, 0, black, .04);
        }
        // The base and uprights are siblings of the rotating chamber, so they never flip.
        this.box(this.chamber, 8.45, 11.7, .22, 0, 0, -.26, glass, .22);
        this.box(this.chamber, 8.45, 11.7, .12, 0, 0, .29, glass, .22);
        const outline = [[-3.95, -5.75], [-4.16, -5.5], [-4.16, 5.5], [-3.95, 5.75], [3.95, 5.75], [4.16, 5.5], [4.16, -5.5], [3.95, -5.75], [-3.95, -5.75]].map(([x, y]) => new THREE.Vector3(x, y, 0));
        this.tube(this.chamber, outline, .065, edge);
        for (const z of [-.24, .28])
            this.tube(this.chamber, outline.map(p => new THREE.Vector3(p.x, p.y, z)), .022, silver);
        for (const x of [-4.08, 4.08])
            for (const y of [-5.15, -2.6, 2.6, 5.15])
                this.box(this.chamber, .16, .23, .58, x, y, 0, edge, .035);
        // Hopper and funnel walls match the rotating apparatus in the recording.
        this.tube(this.chamber, [[-1.23, 5.15], [-1.05, 4.8], [-.55, 4.08], [0, 3.7], [.55, 4.08], [1.05, 4.8], [1.23, 5.15]].map(([x, y]) => new THREE.Vector3(x, y, .03)), .055, edge);
        this.tube(this.chamber, [[-1.23, 5.15], [0, 5.25], [1.23, 5.15]].map(([x, y]) => new THREE.Vector3(x, y, .03)), .05, edge);
        for (const side of [-1, 1])
            this.tube(this.chamber, [[0, 3.7], [side * 1.8, 2.9], [side * 2.6, 1.8], [side * 3.92, -1.05]].map(([x, y]) => new THREE.Vector3(x, y, .03)), .045, edge);
        const pegGeo = new THREE.CylinderGeometry(.047, .047, .39, 12);
        pegGeo.rotateX(Math.PI / 2);
        const pegs = new THREE.InstancedMesh(pegGeo, silver, ROWS * (ROWS + 1) / 2);
        let id = 0;
        for (let row = 0; row < ROWS; row++)
            for (let k = 0; k <= row; k++) {
                this.matrix.position.set((k - row / 2) * SPACING, TOP - row * DY, .02);
                this.matrix.updateMatrix();
                pegs.setMatrixAt(id++, this.matrix.matrix);
            }
        this.chamber.add(pegs);
        for (let k = 0; k <= ROWS + 1; k++)
            this.box(this.chamber, .025, 4.25, .39, (k - (ROWS + 1) / 2) * SPACING, -3.3, .015, edge, .008);
        this.box(this.chamber, 7.45, .075, .42, 0, -5.51, 0, edge, .025);
        // Gold theoretical normal curve is a 3D guide, never used to place balls.
        const gold = new THREE.MeshBasicMaterial({ color: 0xd9a018, transparent: true, opacity: .9 });
        // Normal expected count / 5 balls per shelf * .064 world units per shelf.
        const normalPeak = (800 / (Math.sqrt(ROWS) / 2 * Math.sqrt(2 * Math.PI))) / 5 * .064;
        const pts = [];
        for (let i = 0; i <= 100; i++) {
            const x = (i / 100 - .5) * 7.2;
            pts.push(new THREE.Vector3(x, normalPeak * Math.exp(-.5 * (x / (Math.sqrt(ROWS) / 2 * SPACING)) ** 2), .34));
        }
        this.tube(this.curve, pts, .025, gold);
        this.curve.position.y = FLOOR + .08;
        this.chamber.add(this.curve);
    }
    private reservoir(i: number) {
        // Four shallow layers of close-packed steel balls inside the hopper.
        const layer = Math.floor(i / 210);
        let j = i % 210, row = 0;
        while (j >= row + 1) {
            j -= row + 1;
            row++;
        }
        return new THREE.Vector3((j - row / 2) * .071, 3.77 + row * .070, -.17 + layer * .073);
    }
    private buildBalls() {
        this.curve.scale.y = this.count / 800;
        if (this.ballsMesh) {
            this.chamber.remove(this.ballsMesh);
            this.ballsMesh.geometry.dispose();
            (this.ballsMesh.material as THREE.Material).dispose();
        }
        this.ballsMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(RADIUS, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc7d1ce, metalness: .9, roughness: .22 }), this.count);
        this.ballsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.ballsMesh.frustumCulled = false;
        this.chamber.add(this.ballsMesh);
        this.balls = Array.from({ length: this.count }, (_, i) => ({ path: [], bin: 0, release: i / this.rate, landed: false, target: this.reservoir(i), start: this.reservoir(i) }));
        this.targets = this.balls.map((_, i) => this.reservoir(i));
        this.updateBalls();
    }
    private prepareRun() {
        this.time = 0;
        this.counts.fill(0);
        const reserved = Array(ROWS + 1).fill(0);
        for (let i = 0; i < this.count; i++) {
            const b = this.balls[i], path = samplePath(), bin = path[ROWS], slot = reserved[bin]++;
            b.path = path;
            b.bin = bin;
            b.release = i / this.rate;
            b.landed = false;
            b.start = this.targets[i].clone();
            // Slot packing happens only within the independently sampled destination.
            const column = slot % 5, row = Math.floor(slot / 5);
            b.target = new THREE.Vector3((bin - ROWS / 2) * SPACING + (column - 2) * .073 + (row % 2) * .012, FLOOR + RADIUS + row * .064, .03);
        }
    }
    flip() {
        if (['flipping', 'running', 'gathering'].includes(this.phase))
            return;
        this.paused = false;
        this.flipTime = 0;
        this.rotationStart = this.chamber.rotation.x;
        this.rotationEnd = this.rotationStart + Math.PI;
        this.phase = 'flipping';
        this.inverted = !this.inverted;
        if (!this.inverted)
            this.prepareRun();
        else {
            this.balls.forEach((b, i) => b.start = this.targets[i].clone());
            this.time = 0;
        }
        this.notify();
    }
    reset(count = this.count) {
        this.count = count;
        this.phase = 'ready';
        this.inverted = true;
        this.chamber.rotation.x = Math.PI;
        this.rotationStart = Math.PI;
        this.rotationEnd = Math.PI;
        this.time = 0;
        this.counts.fill(0);
        this.paused = false;
        this.buildBalls();
        this.notify();
    }
    setSpeed(speed: number) { this.speed = speed; }
    setPaused(paused: boolean) { this.paused = paused; }
    showCurve(show: boolean) { this.curve.visible = show; }
    resetView() { this.angle = .1; this.machine.rotation.y = this.angle; }
    rotateView(delta: number) { this.angle = THREE.MathUtils.euclideanModulo(this.angle + delta, Math.PI * 2); this.machine.rotation.y = this.angle; }
    zoomBy(factor: number) {
        this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom * factor, .65, 1.8);
        this.camera.updateProjectionMatrix();
        return { canZoomIn: this.camera.zoom < 1.8, canZoomOut: this.camera.zoom > .65 };
    }
    private positionAt(b: Ball, t: number): THREE.Vector3 {
        if (t < 0)
            return b.start;
        const entry = .42, step = .105, fall = .7;
        if (t < entry) {
            const q = t / entry;
            return new THREE.Vector3(b.start.x * (1 - q), b.start.y + (TOP + RADIUS + .05 - b.start.y) * q * q, b.start.z * (1 - q) + .03 * q);
        }
        const flight = t - entry;
        if (flight < ROWS * step) {
            const row = Math.min(ROWS - 1, Math.floor(flight / step)), q = (flight - row * step) / step;
            const x0 = (b.path[row] - row / 2) * SPACING, x1 = (b.path[row + 1] - (row + 1) / 2) * SPACING;
            return new THREE.Vector3(THREE.MathUtils.lerp(x0, x1, q), TOP - row * DY + .09 - DY * q - .055 * Math.sin(Math.PI * q), .03);
        }
        const q = clamp((flight - ROWS * step) / fall), y = TOP - ROWS * DY + .09;
        return new THREE.Vector3(THREE.MathUtils.lerp((b.bin - ROWS / 2) * SPACING, b.target.x, q), THREE.MathUtils.lerp(y, b.target.y, q * q), .03);
    }
    private updateBalls() {
        for (let i = 0; i < this.count; i++) {
            const b = this.balls[i];
            let p = this.targets[i];
            if (this.phase === 'running') {
                const t = this.time - b.release;
                p = this.positionAt(b, t);
                if (t >= .42 + ROWS * .105 + .7) {
                    p = b.target;
                    if (!b.landed) {
                        b.landed = true;
                        this.counts[b.bin]++;
                    }
                }
            }
            else if (this.phase === 'gathering') {
                const target = this.reservoir(i), q = clamp((this.time - (i % 17) * .008) / 1.2), ease = q * q * (3 - 2 * q);
                p = b.start.clone().lerp(target, ease);
            }
            else if (this.phase === 'ready')
                p = this.reservoir(i);
            this.targets[i] = p;
            this.matrix.position.copy(p);
            this.matrix.rotation.set(0, 0, 0);
            this.matrix.scale.setScalar(1);
            this.matrix.updateMatrix();
            this.ballsMesh.setMatrixAt(i, this.matrix.matrix);
        }
        this.ballsMesh.instanceMatrix.needsUpdate = true;
    }
    private notify() { this.onState({ phase: this.phase, landed: this.counts.reduce((a, b) => a + b, 0), counts: [...this.counts], inverted: this.inverted }); }
    private animate = (now: number) => {
        if (this.disposed)
            return;
        const dt = Math.min((now - (this.previous || now)) / 1000, .05);
        this.previous = now;
        if (this.phase === 'flipping') {
            this.flipTime += dt;
            const q = clamp(this.flipTime / 1.35);
            this.chamber.rotation.x = THREE.MathUtils.lerp(this.rotationStart, this.rotationEnd, q * q * (3 - 2 * q));
            if (q === 1) {
                this.phase = this.inverted ? 'gathering' : 'running';
                this.time = 0;
                this.notify();
            }
        }
        else if ((this.phase === 'running' || this.phase === 'gathering') && !this.paused) {
            this.time += dt * this.speed;
            this.updateBalls();
            if (this.phase === 'running' && this.counts.reduce((a, b) => a + b, 0) === this.count) {
                this.phase = 'complete';
                this.notify();
            }
            else if (this.phase === 'gathering' && this.time > 1.5) {
                this.phase = 'ready';
                this.counts.fill(0);
                this.notify();
            }
            if (now - this.lastNotify > 100) {
                this.notify();
                this.lastNotify = now;
            }
        }
        this.renderer.render(this.scene, this.camera);
        this.frame = requestAnimationFrame(this.animate);
    };
    private resize() { const { width, height } = this.host.getBoundingClientRect(); this.renderer.setSize(width, height); this.camera.aspect = width / height; const distance = this.camera.aspect < .75 ? 39 : 32; this.camera.position.set(1.4, 3, distance); this.camera.lookAt(0, -1.9, 0); this.camera.updateProjectionMatrix(); }
    private pointerDown = (e: PointerEvent) => { this.dragX = e.clientX; this.dragStartX = e.clientX; this.dragging = true; this.moved = false; this.renderer.domElement.setPointerCapture(e.pointerId); };
    private pointerMove = (e: PointerEvent) => { if (this.dragging) {
        const dx = e.clientX - this.dragX;
        if (Math.abs(e.clientX - this.dragStartX) > 3)
            this.moved = true;
        this.angle = THREE.MathUtils.euclideanModulo(this.angle + dx * .004, Math.PI * 2);
        this.machine.rotation.y = this.angle;
        this.dragX = e.clientX;
    } };
    private pointerUp = (e: PointerEvent) => { this.dragging = false; if (!this.moved) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
        const ray = new THREE.Raycaster();
        ray.setFromCamera(pointer, this.camera);
        if (ray.intersectObject(this.chamber, true).length)
            this.onFlip();
    } };
    private pointerCancel = () => { this.dragging = false; };
    dispose() { this.disposed = true; cancelAnimationFrame(this.frame); this.observer.disconnect(); this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown); this.renderer.domElement.removeEventListener('pointermove', this.pointerMove); this.renderer.domElement.removeEventListener('pointerup', this.pointerUp); this.renderer.domElement.removeEventListener('pointercancel', this.pointerCancel); this.scene.traverse(obj => { if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material])
            mat.dispose();
    } }); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
