/** Ideal Galton model: n independent Bernoulli(1/2) deflections.
 * K ~ Binomial(n, 1/2); E[K] = n/2, Var[K] = n/4.
 * Ball destinations are sampled independently, never forced into a target histogram.
 */
export const ROWS = 16;
export const SPACING = 0.43;
export function samplePath(rows = ROWS, random: () => number = Math.random): number[] {
    const path = [0];
    for (let i = 0; i < rows; i++)
        path.push(path[i] + (random() < 0.5 ? 0 : 1));
    return path;
}
export function binomialProbabilities(n = ROWS): number[] {
    const p = [2 ** -n];
    for (let k = 0; k < n; k++)
        p.push(p[k] * (n - k) / (k + 1));
    return p;
}
export function moments(counts: number[]) {
    const total = counts.reduce((a, b) => a + b, 0);
    if (!total)
        return { mean: 0, deviation: 0 };
    const mean = counts.reduce((sum, count, k) => sum + count * k, 0) / total;
    const variance = counts.reduce((sum, count, k) => sum + count * (k - mean) ** 2, 0) / total;
    return { mean, deviation: Math.sqrt(variance) };
}
