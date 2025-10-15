export { };

const thresholdEl = document.getElementById('threshold') as HTMLInputElement | null;
const sleepEl = document.getElementById('sleep') as HTMLInputElement | null;
const domainBoostEl = document.getElementById('domainBoost') as HTMLInputElement | null;
const stopwordsEl = document.getElementById('stopwords') as HTMLTextAreaElement | null;
const saveBtn = document.getElementById('save') as HTMLButtonElement | null;
const statusEl = document.getElementById('status') as HTMLDivElement | null;

async function load() {
    const { tabOrganizerOptions } = await chrome.storage.local.get('tabOrganizerOptions');
    const opts = tabOrganizerOptions || { threshold: 0.5, sleep: true, domainBoost: 1, stopwords: [] as string[] };
    if (thresholdEl) thresholdEl.value = String(opts.threshold);
    if (sleepEl) sleepEl.checked = !!opts.sleep;
    if (domainBoostEl) domainBoostEl.value = String(opts.domainBoost ?? 1);
    if (stopwordsEl) stopwordsEl.value = Array.isArray(opts.stopwords) ? opts.stopwords.join(', ') : '';
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
    if (statusEl) statusEl.textContent = 'Saved';
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 1200);
}

void load();
saveBtn?.addEventListener('click', () => { void save(); });

