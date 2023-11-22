const {
    EOL,
    platform,
    arch,
    homedir,
    tmpdir,
} = require('os');

const fs = require('fs');
const path = require('path');

global.endOfLine = EOL;
global.platform = platform(); // process.platform
global.arch = arch();
global.homedir = homedir().replace(/\\/g, '/');
global.tmpdir = tmpdir().replace(/\\/g, '/');
global.mountFolder = path.join(global.tmpdir, 'mnt').replace(/\\/g, '/');
global.qslHome = path.join(global.homedir, 'qsl').replace(/\\/g, '/');

global.adbDevice = null;
global.battery = {};
global.mounted = false;
global.updateAvailable = false;
global.currentConfiguration = {};
global.rcloneSections = [];
global.installedApps = [];
global.hash_alg = 'sha256';
global.locale = 'en-US';

global.platform = global.platform.replace('32', '').replace('64', '');
if (global.platform == 'darwin') global.platform = 'mac';