const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    'main',
    {
        send: (data) => {
            ipcRenderer.send('main', data)
        },
        receive: (fn) => {
            ipcRenderer.on('main', (event, ...args) => fn(...args))
        }
    }
);

contextBridge.exposeInMainWorld(
    'api',
    {
        cats: {
            list: (data) => ipcRenderer.invoke('cats.list', data),
        }
    }
);
