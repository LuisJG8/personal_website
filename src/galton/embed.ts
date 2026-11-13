import { GaltonBoard, type BoardState } from './lib/board';
import './zoom-controls.css';
/** Embed only the 3D board; interaction lives on the canvas itself. */
export function mountGaltonBoard(root: HTMLElement): () => void {
    const host = root.querySelector<HTMLDivElement>('[data-galton-canvas]');
    if (!host)
        throw new Error('Missing 3D board mount.');
    let board: GaltonBoard | undefined;
    const listeners = new AbortController();
    const zoomControls = document.createElement('div');
    zoomControls.className = 'galton-zoom-controls';
    zoomControls.setAttribute('role', 'group');
    zoomControls.setAttribute('aria-label', 'Board zoom');
    const label = '3D Galton board. Click or press Enter or Space to flip. Drag or use Left and Right arrow keys to rotate through 360 degrees.';
    function update(state: BoardState) {
        root.dataset.galtonPhase = state.phase;
        const canvas = host!.querySelector('canvas');
        canvas?.setAttribute('aria-disabled', String(['flipping', 'running', 'gathering'].includes(state.phase)));
    }
    try {
        host.replaceChildren();
        board = new GaltonBoard(host, update, () => board?.flip());
        board.showCurve(true);
        const canvas = host.querySelector('canvas')!;
        canvas.tabIndex = 0;
        canvas.setAttribute('role', 'button');
        canvas.setAttribute('aria-label', label);
        canvas.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                board?.flip();
            }
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                board?.rotateView(event.key === 'ArrowLeft' ? -.15 : .15);
            }
        }, { signal: listeners.signal });
        const stage = host.parentElement!;
        stage.classList.add('galton-zoom-stage');
        const zoomIn = document.createElement('button');
        const zoomOut = document.createElement('button');
        for (const [button, label, symbol] of [[zoomIn, 'Zoom in', '+'], [zoomOut, 'Zoom out', '−']] as const) {
            button.type = 'button';
            button.setAttribute('aria-label', label);
            button.title = label;
            button.textContent = symbol;
            zoomControls.append(button);
        }
        const zoom = (factor: number) => {
            const result = board?.zoomBy(factor);
            if (!result)
                return;
            zoomIn.disabled = !result.canZoomIn;
            zoomOut.disabled = !result.canZoomOut;
        };
        zoomIn.addEventListener('click', () => zoom(1.15), { signal: listeners.signal });
        zoomOut.addEventListener('click', () => zoom(1 / 1.15), { signal: listeners.signal });
        stage.append(zoomControls);
        root.dataset.galtonReady = 'true';
    }
    catch (error) {
        console.error('Could not start the embedded Galton board.', error);
        host.textContent = 'The 3D board needs WebGL. Please enable hardware acceleration in your browser.';
    }
    return () => {
        listeners.abort();
        zoomControls.remove();
        board?.dispose();
    };
}
