const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    'electron',
    {
        sendToMain: (data) => {
            ipcRenderer.send('toMain', data);
        },
        receiveFromMain: (fn) => {
            ipcRenderer.on('fromMain', (event, ...args) => fn(...args));
        }
    }
)

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})
