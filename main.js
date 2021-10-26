const Electron = require('electron');
const { autoUpdater } = require('electron-updater');
const Realm = require('realm');
const path = require('path');
const {APP_ENV, REALM_APP_ID} = require('./app.config');

process.chdir(Electron.app.getPath('userData'));

async function createBrowserWindow() {
    let browserWindow = new Electron.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    await browserWindow.loadFile('index.html');

    if(APP_ENV === 'development') {
        browserWindow.webContents.openDevTools();
    }

    browserWindow.on('closed', () => {
        browserWindow = null;
    })

    browserWindow.webContents.send('version', Electron.app.getVersion());

    return browserWindow;
}

async function createRealmConnection() {

    const realmApp = new Realm.App({id: REALM_APP_ID});

    const Cat = {
        name: "Cat",
        properties: {
            _id: "objectId",
            name: "string",
            age: "int",
        },
        primaryKey: '_id',
    };

    await realmApp.logIn(Realm.Credentials.anonymous());
    const realmConnection = await Realm.open({
        schema: [Cat],
        sync: {
            user: realmApp.currentUser,
            partitionValue: "myPartition",
            newRealmFileBehavior: {
                type: 'openImmediately'
            },
            existingRealmFileBehavior: {
                type: 'openImmediately'
            },
        },
    });

    return realmConnection;
}

async function initElectronUpdater(browserWindow) {
    autoUpdater.on('checking-for-update', () => {
        const message = 'Checking for update...';
        browserWindow.webContents.send('updates', message);
    })
    autoUpdater.on('update-available', () => {
        const message = 'Update available.';
        browserWindow.webContents.send('updates', message);
    })
    autoUpdater.on('update-not-available', () => {
        const message = 'Update not available.';
        browserWindow.webContents.send('updates', message);
    })
    autoUpdater.on('error', (err) => {
        const message = `Error in auto-updater: ${err}`;
        browserWindow.webContents.send('updates', message);
        console.log(message);
    })
    autoUpdater.on('download-progress', ({percent, transferred}) => {
        const message = `Downloaded ${percent}%`;
        browserWindow.webContents.send('updates', message);
        console.log(message);
    })
    autoUpdater.on('update-downloaded', (info) => {
        const message = 'Update downloaded. Restart app for install update.';
        browserWindow.webContents.send('updates', message);
        console.log(message);
    });

    await autoUpdater.checkForUpdatesAndNotify();
}

Promise.all([
        Electron.app.whenReady(),
        createRealmConnection()
    ]
).then(async ([_, realmConnection]) => {

    const cats = realmConnection.objects('Cat');

    Electron.ipcMain.handle('cats', (event) => {
        const items = cats.map(({name, age, _id}) => ({name, age, id: _id.toString()}));
        return {items};
    });

    const browserWindow = await createBrowserWindow();

    Electron.app.on('window-all-closed', () => {
        realmConnection.close();
        Electron.app.quit()
    })

    Electron.app.on('quit', () => {
        realmConnection.close();
        Electron.app.quit()
    });

    await initElectronUpdater(browserWindow);

}).catch((err) => {
    console.error(err)
});
