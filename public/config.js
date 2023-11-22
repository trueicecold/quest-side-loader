const path = require('path');
const {
    EOL,
    platform,
    arch,
    homedir,
    tmpdir,
} = require('os');

let config = {
    endOfLine:EOL,
    platform:platform(), // process.platform
    arch:arch(),
    homedir:homedir().replace(/\\/g, '/'),
    tmpdir:tmpdir().replace(/\\/g, '/'),
    mountFolder: path.join(tmpdir(), 'mnt').replace(/\\/g, '/'),
    qslHome:path.join(homedir(), 'qsl').replace(/\\/g, '/'),

    adbDevice:false,
    mounted:false,
    updateAvailable:false,
    currentConfiguration:{},
    rcloneSections:[],
    installedApps:[],
    hash_alg:'sha256',
    locale:'en-US'
}