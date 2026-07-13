function show(enabled, useSettingsInsteadOfPreferences) {
    if (useSettingsInsteadOfPreferences) {
        document.querySelector('.state-unknown').innerText = "You can turn on blockMax's extension in the Extensions section of Safari Settings.";
        document.querySelector('.open-preferences').innerText = "Open Safari Extension Settings…";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

document.querySelector('.open-preferences').addEventListener('click', () => {
    webkit.messageHandlers.controller.postMessage("open-preferences");
});
