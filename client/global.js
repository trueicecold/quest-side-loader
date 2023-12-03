const path = require("path");
global.qslToolsHome = process.pkg ? path.join(path.dirname(process.argv[0]), 'qsl-tools') : path.join(__dirname, 'qsl-tools');
global.qslDataHome = process.pkg ? path.join(path.dirname(process.argv[0]), 'qsl-data') : path.join(__dirname, 'qsl-data');
global.qslBackup = process.pkg ? path.join(path.dirname(process.argv[0]), 'qsl-backups') : path.join(__dirname, 'qsl-backups');
global.qslImages = process.pkg ? path.join(__dirname, '..', 'public', 'images') : path.join(__dirname, 'public', 'images');
global.tmpApkPath = "/data/local/tmp/install.apk";
global.obbPath = "/sdcard/Android/obb/";
global.dataPath = "/sdcard/Android/data/";
global.metaKey = "gL59VfgPxoHR";
global.metadata = {};
global.blacklist_apps = [];