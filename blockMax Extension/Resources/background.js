const ALARM = 'blockmax-tick';

const DEFAULT_SCHEDULE = {
    enabled: true,
    days: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '17:00'
};

const DEFAULT_MESSAGES = [
    "You've got this. Come back later.",
    "Stay focused. This can wait.",
    "Deep work mode. You're doing great."
];

async function getSettings() {
    const result = await browser.storage.local.get(['blockedSites', 'schedule']);
    return {
        blockedSites: result.blockedSites ?? [],
        schedule: result.schedule ?? DEFAULT_SCHEDULE
    };
}

function isActive(schedule) {
    if (!schedule.enabled) return false;
    const now = new Date();
    if (!schedule.days.includes(now.getDay())) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    return cur >= sh * 60 + sm && cur < eh * 60 + em;
}

async function sync() {
    const { blockedSites, schedule } = await getSettings();
    const active = isActive(schedule) && blockedSites.length > 0;

    browser.action.setIcon({
        path: active ? 'images/toolbar-icon-active.svg' : 'images/toolbar-icon-inactive.svg'
    });
    browser.action.setTitle({
        title: active ? 'blockMax — Focus active' : 'blockMax — Focus inactive'
    });
}

async function ensureMessages() {
    const { blockedMessages } = await browser.storage.local.get('blockedMessages');
    if (!blockedMessages || blockedMessages.length === 0) {
        await browser.storage.local.set({ blockedMessages: DEFAULT_MESSAGES });
    }
}

browser.runtime.onInstalled.addListener(async () => {
    await ensureMessages();
    sync();
    browser.alarms.create(ALARM, { periodInMinutes: 1 });
});

browser.runtime.onStartup.addListener(async () => {
    await ensureMessages();
    sync();
    const alarm = await browser.alarms.get(ALARM);
    if (!alarm) browser.alarms.create(ALARM, { periodInMinutes: 1 });
});

browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === ALARM) sync();
});

// Only react to user-facing keys — prevents a loop if sync() ever writes to storage.
browser.storage.onChanged.addListener((changes) => {
    if ('blockedSites' in changes || 'schedule' in changes) sync();
});

browser.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'getStatus') {
        getSettings().then(({ blockedSites, schedule }) => {
            respond({
                active: isActive(schedule) && blockedSites.length > 0,
                blockedSites,
                schedule
            });
        });
        return true;
    }
});
