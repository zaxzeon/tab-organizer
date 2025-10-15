export { };

const btn = document.getElementById('organizeBtn') as HTMLButtonElement | null;
const statusEl = document.getElementById('status') as HTMLDivElement | null;

if (btn) {
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        if (statusEl) statusEl.textContent = 'Organizing tabs...';
        try {
            const res = await chrome.runtime.sendMessage({ action: 'organizeTabs' });
            if (res?.error && statusEl) statusEl.textContent = String(res.error);
            else if (statusEl) statusEl.textContent = `Organized into ${res?.groups ?? 0} groups.`;
        } catch (e) {
            if (statusEl) statusEl.textContent = 'Error organizing tabs';
        } finally {
            btn.disabled = false;
        }
    });
}

