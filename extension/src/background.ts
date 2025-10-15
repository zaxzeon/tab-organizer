import { extractDomain, tokenize, jaccard, pickGroupName, isVivaldi } from './shared/utils';
import { loadWasm } from './shared/wasm';

type TabInfo = { id: number, title: string, url: string };

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if (req?.action === 'organizeTabs') {
        organizeTabs().then(sendResponse).catch(err => sendResponse({ error: String(err) }));
        return true;
    }
});

chrome.commands.onCommand.addListener((cmd) => {
    if (cmd === 'organize-tabs') void organizeTabs();
});

async function organizeTabs(): Promise<{ groups: number }> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const list: TabInfo[] = tabs.filter(t => typeof t.id === 'number').map(t => ({
        id: t.id as number,
        title: t.title || '',
        url: t.url || ''
    }));
    if (list.length < 2) return { groups: 0 };

    // Prepare raw strings; feature tokens will be built after reading options.
    const rawStrings = list.map(t => `${t.title} ${extractDomain(t.url)}`);

    const { tabOrganizerOptions } = await chrome.storage.local.get('tabOrganizerOptions');
    const threshold = Math.max(0, Math.min(1, Number(tabOrganizerOptions?.threshold ?? 0.5)));
    const domainBoost = Math.max(1, Math.floor(Number(tabOrganizerOptions?.domainBoost ?? 1)));
    const stopwords = Array.isArray(tabOrganizerOptions?.stopwords) ? tabOrganizerOptions.stopwords as string[] : [];
    const stopSet = new Set<string>(stopwords.map(s => String(s).toLowerCase().trim()).filter(Boolean));

    const features = list.map((t, idx) => {
        let tokens = tokenize(rawStrings[idx]).filter(tok => !stopSet.has(tok));
        if (domainBoost > 1) {
            const dom = extractDomain(t.url);
            if (dom) {
                const dTokens = tokenize(dom);
                for (let n = 0; n < domainBoost - 1; n++) tokens.push(...dTokens);
            }
        }
        return { id: t.id, tokens, raw: rawStrings[idx] };
    });

    let clusters: Array<typeof features> = [];
    if (features.length >= 120) {
        try {
            const wasm = await loadWasm();
            const t0 = performance.now();
            // Build options payload for WASM path
            const optionsJson = JSON.stringify({ stopwords, domainBoost });
            let parsed: Array<{ tabIds: number[]; name: string }> | null = null;
            try {
                const out = wasm.GroupTabs(JSON.stringify(list), threshold, optionsJson);
                const tmp = JSON.parse(out);
                if (Array.isArray(tmp)) {
                    parsed = tmp.filter((c: any) => Array.isArray(c?.tabIds) && typeof c?.name === 'string');
                }
            } catch {
                parsed = null;
            }
            if (parsed && parsed.length > 0) {
                clusters = parsed.map(c => features.filter(f => c.tabIds.includes(f.id)));
            } else {
                clusters = [];
            }
            const t1 = performance.now();
            console.log(`[TabOrganizer] clustering path=wasm n=${features.length} durMs=${Math.round(t1 - t0)}`);
        } catch {
            // fall back to Jaccard
            clusters = [];
        }
    }

    if (clusters.length === 0) {
        const t0 = performance.now();
        const sims: Record<number, Record<number, number>> = {};
        for (let i = 0; i < features.length; i++) {
            sims[features[i].id] = {};
            for (let j = i + 1; j < features.length; j++) {
                const s = jaccard(features[i].tokens, features[j].tokens);
                sims[features[i].id][features[j].id] = s;
                sims[features[j].id] ||= {};
                sims[features[j].id][features[i].id] = s;
            }
        }
        const assigned = new Set<number>();
        for (const f of features) {
            if (assigned.has(f.id)) continue;
            const c: typeof features = [f];
            assigned.add(f.id);
            for (const g of features) {
                if (g.id === f.id || assigned.has(g.id)) continue;
                if ((sims[f.id]?.[g.id] || 0) >= threshold) {
                    c.push(g);
                    assigned.add(g.id);
                }
            }
            clusters.push(c);
        }
        const t1 = performance.now();
        console.log(`[TabOrganizer] clustering path=js n=${features.length} durMs=${Math.round(t1 - t0)}`);
    }

    let groupCount = 0;
    const stored: Array<{ tabIds: number[], name: string }> = [];
    for (const cluster of clusters) {
        if (cluster.length <= 1) continue;
        const tabIds = cluster.map(x => x.id);
        const gid = await chrome.tabs.group({ tabIds });
        const name = pickGroupName(cluster.map(x => x.raw));
        await chrome.tabGroups.update(gid, { title: name, color: 'blue' });
        const inGroup = await chrome.tabs.query({ groupId: gid });
        const sleep = tabOrganizerOptions?.sleep ?? true;
        if (sleep) {
            for (const t of inGroup) {
                if (!t.active && typeof t.id === 'number') {
                    try { await chrome.tabs.discard(t.id); } catch { /* ignore */ }
                }
            }
        }
        stored.push({ tabIds, name });
        groupCount++;
    }

    try { await chrome.storage.local.set({ tabOrganizerClusters: stored, tabOrganizerLastRun: { n: features.length, groups: groupCount, ts: Date.now() } }); } catch { /* noop */ }

    // Hook: detection only (mod will act when present)
    if (isVivaldi()) {
        // Future: notify mod or attempt stacks via vivaldi API if available
    }

    return { groups: groupCount };
}

