const Electron = require('electron');
const path = require('path');
const Realm = require('realm');
const { autoUpdater } = require('electron-updater');
const {APP_ENV, APP_ID} = require('./app.config');

process.chdir(Electron.app.getPath('userData'));

async function createBrowserWindow() {
    const browserWindow = new Electron.BrowserWindow({
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

    return browserWindow;
}

async function createRealmConnection() {

    const realmApp = new Realm.App({id: APP_ID});

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

Promise.all([
        Electron.app.whenReady(),
        createRealmConnection()
    ]
).then(async ([_, realmConnection]) => {

    const browserWindow = await createBrowserWindow();

    const cats = realmConnection.objects('Cat');

    Electron.ipcMain.handle("cats.list", (event, data) => {
        const items = cats.map(({name, age, _id}) => ({name, age, id: _id.toString()}));
        return {items};
    });

    Electron.app.on('window-all-closed', () => {
        realmConnection.close();
        Electron.app.quit()
    })

    Electron.app.on('quit', () => {
        realmConnection.close();
        Electron.app.quit()
    });

    /*browserWindow.webContents.send('main', {message: 'Message from main!'});
    Electron.ipcMain.on('main', (event, data) => {
        console.log('Received from renderer, data: %s', JSON.stringify(data));
    });*/



    await autoUpdater.checkForUpdatesAndNotify();

}).catch((err) => {
    console.error(err)
});
