let sites = [];
let schedule = {};

async function init() {
    const status = await browser.runtime.sendMessage({ type: 'getStatus' });
    sites = status.blockedSites;
    schedule = status.schedule;

    renderStatus(status.active);
    renderSites();
    renderSchedule();
    await initMessages();

    document.getElementById('addBtn').addEventListener('click', addSite);
    document.getElementById('siteInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') addSite();
    });

    document.getElementById('scheduleEnabled').addEventListener('change', e => {
        schedule.enabled = e.target.checked;
        document.getElementById('scheduleDetails').classList.toggle('disabled', !schedule.enabled);
        persist();
    });

    document.querySelectorAll('.day-label input').forEach(cb => {
        cb.addEventListener('change', () => {
            schedule.days = Array.from(
                document.querySelectorAll('.day-label input:checked')
            ).map(c => Number(c.value));
            persist();
        });
    });

    document.getElementById('startTime').addEventListener('change', e => {
        schedule.startTime = e.target.value;
        persist();
    });

    document.getElementById('endTime').addEventListener('change', e => {
        schedule.endTime = e.target.value;
        persist();
    });
}

function renderStatus(active) {
    const pill = document.getElementById('statusPill');
    pill.textContent = active ? 'Focus active' : 'Not active';
    pill.classList.toggle('active', active);
}

function renderSites() {
    const list = document.getElementById('siteList');
    list.innerHTML = '';

    if (sites.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.textContent = 'No sites added yet';
        list.appendChild(li);
        return;
    }

    sites.forEach((site, i) => {
        const li = document.createElement('li');
        li.className = 'site-item';

        const name = document.createElement('span');
        name.className = 'site-name';
        name.textContent = site;

        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = '×';
        btn.title = 'Remove';
        btn.addEventListener('click', () => {
            sites.splice(i, 1);
            renderSites();
            persist();
        });

        li.appendChild(name);
        li.appendChild(btn);
        list.appendChild(li);
    });
}

function renderSchedule() {
    document.getElementById('scheduleEnabled').checked = schedule.enabled;
    document.getElementById('scheduleDetails').classList.toggle('disabled', !schedule.enabled);

    document.querySelectorAll('.day-label input').forEach(cb => {
        cb.checked = schedule.days.includes(Number(cb.value));
    });

    document.getElementById('startTime').value = schedule.startTime;
    document.getElementById('endTime').value = schedule.endTime;
}

function addSite() {
    const input = document.getElementById('siteInput');
    const raw = input.value.trim();
    if (!raw) return;

    const domain = raw.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .split('?')[0];

    if (!domain || sites.includes(domain)) {
        input.value = '';
        return;
    }

    sites.push(domain);
    input.value = '';
    renderSites();
    persist();
}

async function persist() {
    await browser.storage.local.set({ blockedSites: sites, schedule });
}

async function initMessages() {
    const { blockedMessages = [] } = await browser.storage.local.get('blockedMessages');
    [0, 1, 2].forEach(i => {
        document.getElementById(`msg${i}`).value = blockedMessages[i] ?? '';
    });

    document.getElementById('saveMsgsBtn').addEventListener('click', async () => {
        const messages = [0, 1, 2]
            .map(i => document.getElementById(`msg${i}`).value.trim())
            .filter(Boolean);
        await browser.storage.local.set({ blockedMessages: messages.length ? messages : undefined });
        const confirm = document.getElementById('msgConfirm');
        confirm.textContent = 'Saved ✓';
        setTimeout(() => { confirm.textContent = ''; }, 2000);
    });
}

init();
