const fs = require('fs');
global.srcDir = __dirname;
global.rootDir = fs.realpathSync(__dirname + '/../') + '/';
global.cacheDir = rootDir + 'cache/';
global.cacheFile =  rootDir + 'cache.json';
global.langDir = rootDir + 'lang/';
global.updatesCacheFile = cacheDir + 'updates.json';
global.notificationChannelsCache = cacheDir + 'notification_channels.json';
global.applePayWatcherCache = cacheDir + 'apple_pay_watcher.json';

[cacheFile, updatesCacheFile, notificationChannelsCache, applePayWatcherCache].forEach(it => {
    if(!fs.existsSync(it)){
        fs.writeFileSync(it, '');
    }
});