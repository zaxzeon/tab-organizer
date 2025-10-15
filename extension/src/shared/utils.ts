export function isVivaldi(): boolean {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const hasVivaldiObj = typeof (globalThis as any).vivaldi !== 'undefined';
    return ua.includes('Vivaldi') || hasVivaldiObj;
}

const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'you', 'your', 'from', 'are', 'this', 'that', 'have', 'was', 'but', 'not', 'all', 'any', 'can', 'her', 'his', 'she', 'him', 'they', 'them', 'our', 'out', 'use', 'how', 'why', 'when', 'what', 'who', 'where', 'will', 'would', 'there', 'their', 'about', 'into', 'more', 'than', 'less'
]);

export function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

export function extractDomain(url: string): string {
    try {
        const u = new URL(url);
        return (u.hostname || '').replace(/^www\./, '');
    } catch {
        return '';
    }
}

export function jaccard(a: string[], b: string[]): number {
    const setB = new Set(b);
    let inter = 0;
    const union = new Set<string>();
    for (const t of a) {
        union.add(t);
        if (setB.has(t)) inter++;
    }
    for (const t of b) union.add(t);
    return union.size === 0 ? 0 : inter / union.size;
}

export function pickGroupName(texts: string[]): string {
    const freq = new Map<string, number>();
    for (const t of texts) {
        for (const tok of tokenize(t)) freq.set(tok, (freq.get(tok) || 0) + 1);
    }
    let best = '', bestN = 0;
    for (const [k, v] of freq) {
        if (v > bestN) { best = k; bestN = v; }
    }
    if (!best) return 'Group';
    return best.charAt(0).toUpperCase() + best.slice(1) + ' Group';
}

