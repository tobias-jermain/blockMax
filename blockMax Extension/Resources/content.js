(async () => {
    try {
        const hostname = location.hostname.replace(/^www\./, '');
        if (!hostname) return;

        const { blockedSites = [], schedule } =
            await browser.storage.local.get(['blockedSites', 'schedule']);

        if (!blockedSites.length || !schedule?.enabled) return;

        const isBlocked = blockedSites.some(
            site => hostname === site || hostname.endsWith('.' + site)
        );
        if (!isBlocked) return;

        const now = new Date();
        if (!schedule.days?.includes(now.getDay())) return;

        const cur = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = (schedule.startTime ?? '09:00').split(':').map(Number);
        const [eh, em] = (schedule.endTime ?? '17:00').split(':').map(Number);

        if (cur >= sh * 60 + sm && cur < eh * 60 + em) {
            location.replace(browser.runtime.getURL('blocked.html'));
        }
    } catch (_) {
        // Unavailable on restricted pages (browser UI, extension pages, etc.)
    }
})();
