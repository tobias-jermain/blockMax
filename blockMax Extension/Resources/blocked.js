const DEFAULTS = [
    "You've got this. Come back later.",
    "Stay focused. This can wait.",
    "Deep work mode. You're doing great."
];

(async () => {
    let msgs = DEFAULTS;
    try {
        const { blockedMessages } = await browser.storage.local.get('blockedMessages');
        if (Array.isArray(blockedMessages) && blockedMessages.length) {
            msgs = blockedMessages;
        }
    } catch (_) {}

    const el = document.getElementById('focus-message');
    if (el) el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
})();
