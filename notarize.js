const {ELECTRON_APPLE_ID, ELECTRON_APPLE_ID_PASSWORD} = require('./app.config');
const {notarize} = require('electron-notarize');
const {join} = require('path');

exports.default = async function notarizing({electronPlatformName, appOutDir, packager}) {

    if (electronPlatformName !== 'darwin') {
        return;
    }

    try {
        await notarize({
            appBundleId: 'com.helastel.electron-realm',
            appPath: join(appOutDir, `${packager.appInfo.productFilename}.app`),
            appleId: ELECTRON_APPLE_ID,
            appleIdPassword: ELECTRON_APPLE_ID_PASSWORD,
        });
    } catch (err) {
        console.log('Error notarizing app: ', err);
    }
};
