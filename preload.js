const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    'app',
    {
        version: (fn) => ipcRenderer.on('version', (event, ...args) => fn(...args)),
        updates: (fn) => ipcRenderer.on('updates', (event, ...args) => fn(...args)),
        cats: (data) => ipcRenderer.invoke('cats', data)
    }
);
