export { };

const thresholdEl = document.getElementById('threshold') as HTMLInputElement | null;
const sleepEl = document.getElementById('sleep') as HTMLInputElement | null;
const domainBoostEl = document.getElementById('domainBoost') as HTMLInputElement | null;
const stopwordsEl = document.getElementById('stopwords') as HTMLTextAreaElement | null;
const saveBtn = document.getElementById('save') as HTMLButtonElement | null;
const vivaldiModEnabledEl = document.getElementById('vivaldiModEnabled') as HTMLInputElement | null;
const vivaldiModSection = document.getElementById('vivaldiModSection') as HTMLDivElement | null;
const vivaldiSnapshotEl = document.getElementById('vivaldiSnapshot') as HTMLTextAreaElement | null;
const copySnapshotBtn = document.getElementById('copySnapshot') as HTMLButtonElement | null;
const downloadSnapshotBtn = document.getElementById('downloadSnapshot') as HTMLButtonElement | null;
const statusEl = document.getElementById('status') as HTMLDivElement | null;

async function load() {
    const { tabOrganizerOptions } = await chrome.storage.local.get('tabOrganizerOptions');
    const opts = tabOrganizerOptions || { threshold: 0.5, sleep: true, domainBoost: 1, stopwords: [] as string[] };
    if (thresholdEl) thresholdEl.value = String(opts.threshold);
    if (sleepEl) sleepEl.checked = !!opts.sleep;
    if (domainBoostEl) domainBoostEl.value = String(opts.domainBoost ?? 1);
    if (stopwordsEl) stopwordsEl.value = Array.isArray(opts.stopwords) ? opts.stopwords.join(', ') : '';

    const { tabOrganizerMod } = await chrome.storage.local.get('tabOrganizerMod');
    const modCfg = tabOrganizerMod || { enabled: false };
    if (vivaldiModEnabledEl) vivaldiModEnabledEl.checked = !!modCfg.enabled;
    if (vivaldiModSection) vivaldiModSection.style.display = modCfg.enabled ? 'block' : 'none';
    await refreshSnapshot();
}

async function save() {
    const threshold = Math.max(0, Math.min(1, Number(thresholdEl?.value || 0.5)));
    const sleep = !!sleepEl?.checked;
    const domainBoost = Math.max(1, Math.floor(Number(domainBoostEl?.value || 1)));
    const stopwords = (stopwordsEl?.value || '')
        .split(/[,\n]/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    await chrome.storage.local.set({ tabOrganizerOptions: { threshold, sleep, domainBoost, stopwords } });
    const enabled = !!vivaldiModEnabledEl?.checked;
    await chrome.storage.local.set({ tabOrganizerMod: { enabled } });
    if (vivaldiModSection) vivaldiModSection.style.display = enabled ? 'block' : 'none';
    if (statusEl) statusEl.textContent = 'Saved';
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 1200);
}

void load();
saveBtn?.addEventListener('click', () => { void save(); });

async function refreshSnapshot() {
    const { tabOrganizerModSnapshot } = await chrome.storage.local.get('tabOrganizerModSnapshot');
    if (vivaldiSnapshotEl) {
        vivaldiSnapshotEl.value = tabOrganizerModSnapshot ? JSON.stringify(tabOrganizerModSnapshot, null, 2) : '';
    }
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.tabOrganizerModSnapshot) void refreshSnapshot();
});

copySnapshotBtn?.addEventListener('click', async () => {
    if (!vivaldiSnapshotEl) return;
    try { await navigator.clipboard.writeText(vivaldiSnapshotEl.value || ''); } catch { /* noop */ }
});

downloadSnapshotBtn?.addEventListener('click', () => {
    if (!vivaldiSnapshotEl) return;
    const blob = new Blob([vivaldiSnapshotEl.value || ''], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tab_organizer_snapshot.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
});

