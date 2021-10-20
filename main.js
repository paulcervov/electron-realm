const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})

app.on('quit', () => {
    app.quit()
})


ipcMain.on("toMain", (event, data) => {
    console.log('To main, data: %s', JSON.stringify(data));

    win.webContents.send('fromMain', 'Response');
});
