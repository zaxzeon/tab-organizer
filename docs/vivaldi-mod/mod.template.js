// Vivaldi Mod Template for Tab Organizer snapshot application
// NOTE: This is a scaffold. Wire `stackTabs(ids)` to your preferred Vivaldi hook.

(function () {
    function createUI() {
        const btn = document.createElement('button');
        btn.textContent = 'Apply Tab Organizer Snapshot';
        btn.style.margin = '4px';
        btn.addEventListener('click', onApplyClick);
        // Choose a stable container in Vivaldi UI where custom buttons can live
        const target = document.body; // replace with a more specific container if desired
        target.appendChild(btn);
    }

    async function onApplyClick() {
        const text = prompt('Paste Tab Organizer snapshot JSON');
        if (!text) return;
        let snapshot;
        try { snapshot = JSON.parse(text); } catch { alert('Invalid JSON'); return; }
        const clusters = Array.isArray(snapshot?.clusters) ? snapshot.clusters : [];
        if (!clusters.length) { alert('No clusters found'); return; }

        const openTabs = await getOpenTabs();
        const mappings = clusters.map(c => ({ name: c.name || 'Group', ids: matchMembers(c.members || [], openTabs) }));
        const summary = mappings.map(m => `${m.name}: ${m.ids.length} tabs`).join('\n');
        if (!confirm(`Apply stacks?\n\n${summary}`)) return;
        for (const m of mappings) {
            await stackTabs(m.ids);
        }
        alert('Applied');
    }

    async function getOpenTabs() {
        // Depending on Vivaldi mod context, you may access internal tab models.
        // As a fallback, attempt the Chrome tabs API if available.
        if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            return tabs.map(t => ({ id: t.id, url: t.url || '', title: t.title || '' }));
        }
        // Otherwise, require manual integration.
        return [];
    }

    function matchMembers(members, openTabs) {
        const ids = [];
        for (const m of members) {
            let id = null;
            const url = String(m?.url || '');
            const title = String(m?.title || '').toLowerCase();
            const exact = openTabs.find(t => t.url === url && url);
            if (exact) id = exact.id;
            else if (title) {
                const byTitle = openTabs.find(t => (t.title || '').toLowerCase().includes(title));
                if (byTitle) id = byTitle.id;
            }
            if (typeof id === 'number') ids.push(id);
        }
        return ids;
    }

    async function stackTabs(ids) {
        // Placeholder: implement using Vivaldi internal APIs or UI scripting.
        // Example (Chrome API grouping as a baseline):
        if (typeof chrome !== 'undefined' && chrome.tabs?.group && ids.length > 1) {
            try { await chrome.tabs.group({ tabIds: ids }); } catch (_) { }
        }
        // For true Vivaldi stacks, wire your preferred method here.
    }

    // Kick off
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createUI);
    else createUI();
})();


