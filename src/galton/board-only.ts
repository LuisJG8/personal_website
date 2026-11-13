import { mountGaltonBoard } from './embed';
import './board-only.css';
const root = document.getElementById('root');
if (root) {
    const board = document.createElement('div');
    board.dataset.galtonEmbed = '';
    const canvasHost = document.createElement('div');
    canvasHost.dataset.galtonCanvas = '';
    canvasHost.className = 'galton-embed-canvas';
    board.append(canvasHost);
    root.append(board);
    const dispose = mountGaltonBoard(board);
    window.addEventListener('pagehide', (event) => { if (!event.persisted)
        dispose(); });
}
