const { Adb, DeviceClient } = require('@devicefarmer/adbkit');
const Bluebird = require('bluebird');

let adbClient;

const fs = require("fs");
const path = require("path");

const fileManager = require("../managers/file");
const util = require("../libs/util");

const tmp_apk = "/data/local/tmp/install.apk";

const shell = async (command, readResponse = true) => {
    try {
        if (global.adbDevice) {
            let shellResponse = await global.adbDevice.shell(command);
            if (readResponse) {
                shellResponse = await Adb.util.readAll(shellResponse);
                shellResponse = shellResponse.toString().trim();
                if (shellResponse.substr(-1) == "\n") {
                    shellResponse = shellResponse.substr(0, -1);
                }
                return shellResponse;
            }
            return "";
        }
        return "";
    }
    catch(e) {
        console.log(e);
        return "";
    }
}

const autoConnect = async (ip) => {
    try {
        const device = await adbClient.connect(ip);
        await connectDevice(device.id);
        return {
            status: 1
        };
    }
    catch(e) {
        return {
            status: 0
        }
    }
}

const searchDevices = async () => {
    const devices = await adbClient.listDevices();
    const supportedDevices = await Bluebird.filter(devices, async (device) => {
        if (device.type == "device") {
            const features = await adbClient.getDevice(device.id).getFeatures();
            return true;
            return features['oculus.hardware.standalone_vr'] != null;
        }
    });
    
    // Connected device was disconnected
    if (global.adbDevice != null && supportedDevices.filter(device => device.id == global.adbDevice.serial).length == 0) {
        global.adbDevice = null;
    }
    
    // No devices connected
    if (supportedDevices.length == 0) {
        global.adbDevice = null;
    }
    global.devices = supportedDevices;
}

const connectDevice = async (device) => {
    try {
        global.adbDevice = new DeviceClient(adbClient, device);
        return {
            status: 1
        }
    }
    catch(e) {
        return {
            status: 0,
            error: e.message
        }
    }
}

const connectDeviceBySerial = async (serial) => {
    return new Promise(async (resolve, reject) => {
        let connectTimer = setTimeout(() => {
            resolve({
                status: 0,
                error: "Connection timed out"
            });
        }, 5000);
        try {
            await adbClient.connect(serial, undefined);
            clearTimeout(connectTimer);
            resolve({
                status: 1
            });
        }
        catch (e) {
            clearTimeout(connectTimer);
            resolve({
                status: 0,
                error: e.message
            });
        }
    });
}

const disconnectDevice = async (device) => {
    if (global.adbDevice) {
        try {
            await adbClient.disconnect(global.adbDevice.serial.split(":")[0], global.adbDevice.serial.split(":")[1]);
            return {
                status: 1
            }
        }
        catch (e) {
            return {
                status: 0,
                error: e.message
            }
        }
    }
}

const getPackagePrettyName = async (packageName) => {
    return packageName;
}

const getInstalledPackages = async () => {
    if (global.adbDevice) {
        let installedPackagedObject = {}
        global.installedPackaged = await global.adbDevice.getPackages("-3 --show-versioncode");
        global.installedPackaged = global.installedPackaged.map(async (app) => {
            app = app.replace(" versionCode:", ":");
            if (app.indexOf("com.oculus") == -1 && app.indexOf("com.facebook") == -1 && app.indexOf("com.whatsapp") == -1) {
                installedPackagedObject[app.split(":")[0]] = {
                    version: app.split(":")[1],
                    name: await getPackagePrettyName(app.split(":")[0]),
                    has_image: fs.existsSync(path.join(__dirname, '..', 'public', 'remote_assets', 'iconpack_quest', app.split(":")[0] + '.jpg'))
                };
            }
            return app.replace(" versionCode:", ":");
        });
        global.installedPackaged = installedPackagedObject;
    }
}

const pushFile = async (local_path, remote_path) => {
    const pushTransfer = await adbDevice.push(local_path, remote_path);
    const localFileSize = fs.statSync(local_path).size;

    installDetails.transferred = 0;
    installDetails.total = localFileSize;

    await new Bluebird((resolve, reject) => {
        onPushProgress(0);
        pushTransfer.on('progress', (stats) => {
            onPushProgress(stats.bytesTransferred);
        });
        pushTransfer.on('end', () => {
            onPushProgress(localFileSize);
            resolve();
        });
        pushTransfer.on('error', (err) => {
            reject(err);
        });
    });
}

let transferStart;
let installDetails = {
};
const installPackage = async (package_path, has_obb = false) => {
    has_obb = has_obb == "true" ? true : false;
    installDetails = {
        state: "starting"
    }
    
    if (global.adbDevice) {
        transferStart = Date.now();
        
        return new Promise(async (resolve, reject) => {
            try {
                //copy apk to temp folder
                installDetails.state = "copying_apk";
                await pushFile(package_path, tmp_apk);
                
                installDetails.state = "uninstalling_apk";
                await global.adbDevice.uninstall(package_path.split("/").pop().replace(".apk", ""));

                installDetails.state = "installing_apk";
                await global.adbDevice.installRemote(tmp_apk);

                if (has_obb) {
                    installDetails.state = "removing_obb";
                    await shell("rm -rf /sdcard/Android/obb/" + package_path.split("/").pop().replace(".apk", ""));

                    await shell("mkdir /sdcard/Android/obb/" + package_path.split("/").pop().replace(".apk", ""));
                    const recursiveFolders = await fileManager.getRecursiveFolders(package_path.substr(0, package_path.lastIndexOf(".")));
                    const fileCount = recursiveFolders.filter(item => !item.directory).length;
                   
                    //recursive create folders before copying files, due to permissions error on quest 3
                    recursiveFolders.forEach(async (item) => {
                        if (item.directory) {
                            await shell("mkdir /sdcard/Android/obb/" + package_path.split("/").pop().replace(".apk", "") + item.path);
                        }
                    });
                    
                    await util.delay(2000);

                    installDetails.state = "copying_obb";
                    installDetails.fileTotal = fileCount;
                    installDetails.fileIndex = 1;

                    Bluebird.each(recursiveFolders, async (item) => {
                        if (!item.directory) {
                            await pushFile(package_path.substr(0, package_path.lastIndexOf(".")) + item.path, "/sdcard/Android/obb/" + package_path.split("/").pop().replace(".apk", "") + item.path);
                            installDetails.fileIndex++;
                            if (installDetails.fileIndex == fileCount) {
                                installDetails.state = "done";
                                resolve({
                                    status: 1
                                });
                            }
                        }
                    });
                }
                else {
                    installDetails.state = "done";
                    resolve({
                        status: 1
                    });
                }
            }
            catch (e) {
                resolve({
                    status: 0,
                    error: "Error installing package: " + e.message
                });
            }
            finally {
                shell("rm " + tmp_apk);
            }
        });
    }
    else {
        return {
            status: 0,
            error: "No device connected"
        };
    }
}

const onPushProgress = (transferred) => {

    installDetails.transferred = transferred;
}

const getInstallProgress = async () => {
    return installDetails;
}

const getBatteryInfo = async () => {
    if (global.adbDevice) {
        let batteryShell = await shell('dumpsys battery');
        let batteryData = {};
        batteryShell = batteryShell.split("\n").map(line => {
            line = line.split(":")
            if (line.length == 2) {
                line[0] = line[0].trim().replace(/\s/ig, "");
                line[1] = line[1].trim();
                line[1] = line[1] == 'true' ? true : (line[1] == 'false' ? false : line[1]);
                batteryData[line[0]] = line[1];
            }
        });
        global.battery = batteryData;
        global.battery.charging = global.battery.ACpowered || global.battery.USBpowered || global.battery.Wirelesspowered;
    }
}

const getStorageInfo = async () => {
    if (global.adbDevice) {
        let storageShell = await shell('df -h | grep "/storage/emulated"');
        global.storage = storageShell;
        const storageRE = new RegExp('([0-9(.{1})]+[a-zA-Z%])', 'g');
        const storage = storageShell.match(storageRE);

        if (storage.length == 3) {
            global.storage = {
                size: storage[0],
                used: storage[1],
                free: 0,
                percent: storage[2],
            };
        }

        global.storage = {
            size: storage[0],
            used: storage[1],
            free: storage[2],
            percent: storage[3],
        };
    }
}

const getMemoryInfo = async () => {
    if (global.adbDevice) {
        let memoryShell = await shell('cat /proc/meminfo');
        let memoryData = {};
        memoryShell = memoryShell.split("\n").map(line => {
            line = line.split(":")
            line[0] = line[0].trim().replace(/\s/ig, "");
            line[1] = line[1].replace('kB', '');
            line[1] = line[1].trim();
            line[1] = parseInt(line[1]) * 1024;
            memoryData[line[0]] = line[1];
        });
        global.memory = {
            total: memoryData.MemTotal,
            available: memoryData.MemAvailable
        };
    }
}

const getFirmwareInfo = async () => {
    if (global.adbDevice) {
        let firmwareShell = await shell('getprop ro.build.branch');
        global.firmware = firmwareShell.replace('releases-oculus-', '');
    }
}

const sendWakeup = async () => {
    if (global.adbDevice) {
        await shell("input keyevent 26");
        await util.delay(2000);
        await shell("input keyevent 224");
    }
}

const init = () => {
    adbClient = Adb.createClient({
        bin: './qsl-tools/adb.exe'
    });

    readDeviceData();
    //sendWakeup();
    setInterval(async () => {
        readDeviceData();
    }, 5000);
    //setInterval(sendWakeup, 30000);
}

const readDeviceData = async () => {
    await searchDevices();
    if (global.devices.length > 0) {
        try {
            await connectDevice(global.devices[0].id);
            await getInstalledPackages();
            await getBatteryInfo();
            await getMemoryInfo();
            await getFirmwareInfo();
            await getStorageInfo();
        }
        catch(e) {
            console.log(e);
        }
    }
}

module.exports = {
    init,
    shell,
    autoConnect,
    searchDevices,
    connectDevice,
    connectDeviceBySerial,
    disconnectDevice,
    installPackage,
    getInstallProgress
}