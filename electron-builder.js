const {APP_ENV} = require('./app.config');

let config = {
    appId: "com.atplboss.electron-realm",
    productName: "Electron Realm",
    artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
    publish: [
        { provider: "github", private: false, releaseType: "release" }
    ],
    copyright: "ELMSOFTWARE LTD",
    asar: true,
    dmg: {
        background: null,
        window: {
            width: "540",
            height: "380"
        },
    },
    files: [
        "**/*"
    ],
    mac: {
        target: "dmg",
        category: "public.app-category.utilities",
        entitlementsInherit: "./build/entitlements.mac.plist"
    },
    win: {
        target: "nsis"
    },
    linux: {
        target: "deb",
        category: "Utility",
        publish: [
            { provider: "github", private: false, releaseType: "release" }
        ]
    }
};

if(APP_ENV === 'production') {
    config = {...config, afterSign: "./notarize.js",}
}

module.exports = config;
