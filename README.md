Welcome to my personal website!

## 3D Galton board

The Projects page embeds a live TypeScript/Three.js Galton board at `/projects/#galton-board`. Click the glass chamber to flip it or drag to rotate through 360 degrees. The base stays fixed during chamber flips. A gold normal-distribution outline appears in the collection area when upright. The presentation has no visible counters, statistics, or separate charts.

The board is left-aligned with the project content and fits a 320 × 400 pixel frame, shrinking proportionally on narrow screens. Its yellow stand, transparent stage, larger dark beads, and thicker gold guide keep the miniature legible. Keyboard users can focus the board and use Enter/Space to flip or Left/Right arrows to rotate.

A standalone version is available at `/projects/galton-board/`. The renderer loads only on pages containing the board. Source lives in `src/galton/`.

Each ball samples an independent 50/50 deflection at each of 16 rows. Final bins follow a binomial distribution with mean 8 and standard deviation 2; the gold outline is the normal approximation. Movement uses animated trajectories, not a rigid-body collision solver, and destinations are never forced into a target histogram.

```sh
pnpm install --frozen-lockfile
pnpm run typecheck:galton
pnpm run test:galton
pnpm run build
```
