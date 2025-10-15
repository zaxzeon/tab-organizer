export type OrganizerOptions = {
    threshold: number;
    sleep: boolean;
    domainBoost: number;
    stopwords: string[];
};

export function normalizeOptions(input: any): OrganizerOptions {
    const thresholdRaw = Number(input?.threshold);
    const threshold = Number.isFinite(thresholdRaw)
        ? Math.max(0, Math.min(1, thresholdRaw))
        : 0.5;
    const sleep = Boolean(input?.sleep ?? true);
    const domainBoostRaw = Number(input?.domainBoost);
    const domainBoost = Number.isFinite(domainBoostRaw) && domainBoostRaw >= 1
        ? Math.floor(domainBoostRaw)
        : 1;
    const stopwords = Array.isArray(input?.stopwords)
        ? (input.stopwords as unknown[]).map(String).map(s => s.trim().toLowerCase()).filter(Boolean)
        : [];
    return { threshold, sleep, domainBoost, stopwords };
}

