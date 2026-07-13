// Hide the page immediately — synchronous, before any async work.
// This eliminates the race window where the page renders before the redirect fires.
document.documentElement.style.setProperty('visibility', 'hidden', 'important');

// Safety restore: if the storage check somehow hangs, don't leave the page blank.
const restoreTimer = setTimeout(() => {
    document.documentElement.style.visibility = '';
}, 1500);

async function evaluate() {
    const hostname = location.hostname.replace(/^www\./, '');
    if (!hostname) return false;

    const { blockedSites = [], schedule } =
        await browser.storage.local.get(['blockedSites', 'schedule']);

    if (!blockedSites.length || !schedule?.enabled) return false;
    if (!blockedSites.some(s => hostname === s || hostname.endsWith('.' + s))) return false;

    const now = new Date();
    if (!schedule.days?.includes(now.getDay())) return false;

    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = (schedule.startTime ?? '09:00').split(':').map(Number);
    const [eh, em] = (schedule.endTime ?? '17:00').split(':').map(Number);
    return cur >= sh * 60 + sm && cur < eh * 60 + em;
}

// Initial check on page load.
(async () => {
    try {
        if (await evaluate()) {
            clearTimeout(restoreTimer);
            location.replace(browser.runtime.getURL('blocked.html'));
            return;
        }
    } catch (_) {}
    clearTimeout(restoreTimer);
    document.documentElement.style.visibility = '';
})();

// Periodic re-check: catches schedule activating while browsing,
// or SPA navigations that don't trigger a full page load.
setInterval(async () => {
    try {
        if (await evaluate()) location.replace(browser.runtime.getURL('blocked.html'));
    } catch (_) {}
}, 30_000);
