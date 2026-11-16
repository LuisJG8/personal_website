import { GaltonBoard, type BoardState } from './lib/board';
/** Embed only the 3D board; interaction lives on the canvas itself. */
export function mountGaltonBoard(root: HTMLElement): () => void {
    const host = root.querySelector<HTMLDivElement>('[data-galton-canvas]');
    if (!host)
        throw new Error('Missing 3D board mount.');
    let board: GaltonBoard | undefined;
    const listeners = new AbortController();
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
        root.dataset.galtonReady = 'true';
    }
    catch (error) {
        console.error('Could not start the embedded Galton board.', error);
        host.textContent = 'The 3D board needs WebGL. Please enable hardware acceleration in your browser.';
    }
    return () => {
        listeners.abort();
        board?.dispose();
    };
}
