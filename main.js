const Electron = require('electron');
const path = require('path');
const Realm = require('realm');
require('dotenv').config()

// change PWD to writable folder
if(process.env.APP_ENV === 'build') {
    process.chdir(Electron.app.getPath('userData'));
}

async function createBrowserWindow () {
    const browserWindow = new Electron.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    await browserWindow.loadFile('index.html');
    browserWindow.webContents.openDevTools();

    return browserWindow;
}

async function createRealmConnection() {
    const realmApp = new Realm.App({id: "application-0-ovjao"});
    const user = await realmApp.logIn(Realm.Credentials.anonymous());
    await user.refreshCustomData();

    const Cat = {
        name: "Cat",
        properties: {
            _id: "objectId",
            name: "string",
            age: "int",
        },
        primaryKey: '_id',
    };

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
            }
        },
    });

    return {realmConnection, realmApp};
}


async function bootstrap(){
    await Electron.app.whenReady();

    const browserWindow = await createBrowserWindow();

    const {realmApp, realmConnection} = await createRealmConnection();

    Electron.ipcMain.handle("cats.list", (event, data) => {
        const items = realmConnection.objects('Cat')
            .map(({name, age, _id}) => ({name, age, _id: _id.toString()}));
        return {items};
    });


    Electron.app.on('window-all-closed', () => {
        realmConnection.close();
        Electron.app.quit()
    })

    Electron.app.on('quit', () => {
        realmConnection.close();
        Electron.app.quit()
    })

    /*
    Electron.ipcMain.on('main', (event, data) => {
        console.log('Received from renderer, data: %s', JSON.stringify(data));
    });
    browserWindow?.webContents.send('main', {message: 'Message from main!'});
    */
}

bootstrap()





