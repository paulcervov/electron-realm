const Electron = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const Realm = require('realm');
const path = require('path');
const {APP_ENV, APP_ID} = require('./app.config');

log.info('App starting...');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

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


    autoUpdater.on('checking-for-update', () => {
        log.info('Checking for update...');
        browserWindow.webContents.send('main', {message: 'Checking for update...'});
    })
    autoUpdater.on('update-available', (info) => {
        log.info('Update available.');
        browserWindow.webContents.send('main', {message: 'Update available.'});
    })
    autoUpdater.on('update-not-available', (info) => {
        log.info('Update not available.');
        browserWindow.webContents.send('main', {message: 'Update not available.'});
    })
    autoUpdater.on('error', (err) => {
        log.info('Error in auto-updater. ' + err);
        browserWindow.webContents.send('main', {message: 'Error in auto-updater. ' + err});
    })
    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        log.info(log_message);
        browserWindow.webContents.send('main', {message: log_message});
    })
    autoUpdater.on('update-downloaded', (info) => {
        log.info('Update downloaded');
        browserWindow.webContents.send('main', {message: 'Update downloaded'});
    });

    browserWindow.webContents.send('main', {message: `App version: ${Electron.app.getVersion()}`});

    /*browserWindow.webContents.send('main', {message: 'Message from main!'});
    Electron.ipcMain.on('main', (event, data) => {
        console.log('Received from renderer, data: %s', JSON.stringify(data));
    });*/

    await autoUpdater.checkForUpdatesAndNotify();

}).catch((err) => {
    console.error(err)
});
