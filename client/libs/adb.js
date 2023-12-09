const { Adb, DeviceClient } = require('@devicefarmer/adbkit');
const Bluebird = require('bluebird');
const execSync = require('node:child_process').execSync;
const exec = require('node:child_process').exec;

let adbClient;

const fs = require("fs");
const path = require("path");

const util = require("../libs/util");

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

const execPromise = async (command, options = {}, modifyQueue = false) => {
    return new Promise((resolve, reject) => {
        if (modifyQueue) {
            global.managers.queue.getCurrent().data.command = command;
        }
        exec(command, options, (err, stdout, stderr) => {
            if (err) {
                resolve(err);
            }
            else {
                resolve(stdout);
            }
        });
    });
}

const fileExists = async (path) => {
    let existsResponse = await shell("ls \"" + path + "\" 1>&1 2> /dev/null");
    return existsResponse;
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

const getPackagePrettyName = (packageName) => {
    if (global.managers.metadata.getEntry(packageName))
        return global.managers.metadata.getEntry(packageName).name;
    else
        return packageName;
}

const getInstalledPackages = async () => {
    if (global.adbDevice) {
        let installedPackagesObject = {}
        global.installedPackages = await global.adbDevice.getPackages("-3 -f --show-versioncode");
        global.installedPackages = global.installedPackages.map(async (app) => {
            app = app.replace(/(.+)=(.+)\sversionCode:(.+)/ig, "$1\n$2\n$3").split("\n");
            if (global.blacklist_apps.indexOf(app[1]) == -1) {
                installedPackagesObject[app[1]] = {
                    package_path: app[0],
                    version: app[2],
                    package: app[1],
                    name: getPackagePrettyName(app[1]),
                    image: "/api/package_image?p=" + app[1]
                };
            }
        });
        global.installedPackages = installedPackagesObject;
    }
}

const pushFile = async (local_path, remote_path) => {
    const pushTransfer = await adbDevice.push(local_path, remote_path);
    const localFileSize = fs.statSync(local_path).size;

    global.managers.queue.getCurrent().data.transferred = 0;
    global.managers.queue.getCurrent().data.total = localFileSize;

    await new Bluebird((resolve, reject) => {
        global.managers.queue.getCurrent().data.transferred = 0;
        pushTransfer.on('progress', (stats) => {
            global.managers.queue.getCurrent().data.transferred = stats.bytesTransferred;
        });
        pushTransfer.on('end', () => {
            global.managers.queue.getCurrent().data.transferred = localFileSize;
            resolve();
        });
        pushTransfer.on('error', (err) => {
            reject(err);
        });
    });
}

const pullFile = async (remote_path, local_path) => {
    const pullTransfer = await adbDevice.pull(remote_path);

    await new Bluebird((resolve, reject) => {
        pullTransfer.on('end', () => {
            resolve();
        });
        pullTransfer.on('progress', () => {
        });
        pullTransfer.on('error', (err) => {
            reject(err);
        });
        pullTransfer.pipe(fs.createWriteStream(local_path));
    });
}

const backupApp = async (package_name) => {
    if (global.adbDevice) {
        let realPackage = global.installedPackages[package_name];
        let backupFolder = path.join(global.qslBackup, realPackage.name + "-v" + realPackage.version + "-" + realPackage.package + "-app");
        let remoteObbFolder = global.obbPath + realPackage.package;
        if (realPackage) {
            if (!fs.existsSync(backupFolder)) {
                fs.mkdirSync(backupFolder);
            }
            await pullFile(realPackage.package_path, path.join(backupFolder, realPackage.package + ".apk"));
            let obbFound = await fileExists(remoteObbFolder);
            if (obbFound) {
                execSync(global.qslToolsHome + path.sep + global.binName + " pull " + remoteObbFolder + "/. \"" + path.join(backupFolder, realPackage.package + "\""));
            }
            return {
                status: 1
            }
        }
        else {
            return {
                status: 0,
                error: "Package not found"
            }
        }
    }
    else {
        return {
            status: 0,
            error: "Device not connected"
        }
    }
}

const backupData = async (package_name) => {
    if (global.adbDevice) {
        try {
            let realPackage = global.installedPackages[package_name];
            let backupFolder = path.join(global.qslBackup, realPackage.name + "-v" + realPackage.version + "-" + realPackage.package + "-data");
            let remoteDataFolder = global.dataPath + realPackage.package;
            if (realPackage) {
                if (!fs.existsSync(backupFolder)) {
                    fs.mkdirSync(backupFolder);
                }
                let dataFound = await fileExists(remoteDataFolder);
                if (dataFound) {
                    execSync(global.qslToolsHome + path.sep + global.binName + " pull " + remoteDataFolder + "/. \"" + path.join(backupFolder, realPackage.package + "\""));
                }
                return {
                    status: 1
                }
            }
            else {
                return {
                    status: 0,
                    error: "Package not found"
                }
            }
        }
        catch (e) {
            return {
                status: 0,
                error: e.message
            }
        }
    }
    else {
        return {
            status: 0,
            error: "Device not connected"
        }
    }
}

let transferStart;
const installPackage = async (package_path, has_obb = false, has_install = false) => {
    let packageFolder = package_path.substr(0, package_path.lastIndexOf("/"));
    let packageName;
    
    has_obb = has_obb == "true" ? true : false;
    has_install = has_install == "true" ? true : false;
    
    if (global.adbDevice) {
        transferStart = Date.now();
        
        return new Promise(async (resolve, reject) => {
            try {
                if (!has_install) { // Regular install

                    packageName = package_path.split("/").pop().replace(".apk", "");
                    global.managers.queue.getCurrent().data.package = packageName;
                    global.managers.queue.getCurrent().data.app_name = getPackagePrettyName(packageName);

                    //copy apk to temp folder
                    global.managers.queue.getCurrent().data.state = "copying_apk";
                    await pushFile(package_path, global.tmpApkPath);
                    
                    global.managers.queue.getCurrent().data.state = "uninstalling_apk";
                    await global.adbDevice.uninstall(packageName);

                    global.managers.queue.getCurrent().data.state = "installing_apk";
                    await global.adbDevice.installRemote(global.tmpApkPath);

                    if (has_obb) {
                        global.managers.queue.getCurrent().data.state = "removing_obb";
                        await removeOBBFolder(packageName);
                        await createOBBFolder(packageName);
                        
                        const recursiveFolders = await global.managers.file.getRecursiveFolders(package_path.substr(0, package_path.lastIndexOf(".")));
                        const files = recursiveFolders.filter(item => !item.directory);
                        const directories = recursiveFolders.filter(item => item.directory);
                    
                        await createOBBFolders(directories, packageName);
                        
                        await util.delay(2000);

                        global.managers.queue.getCurrent().data.state = "copying_obb";
                        global.managers.queue.getCurrent().data.fileTotal = files.length;
                        global.managers.queue.getCurrent().data.fileIndex = 1;

                        //await copyOBBFiles(files, packageName);

                        for (let file = 0; file < files.length; file++) {
                            await pushFile(package_path.substr(0, package_path.lastIndexOf(".")) + files[file].path, global.obbPath + packageName + files[file].path);
                            global.managers.queue.getCurrent().data.fileIndex++;
                        };

                        resolve({
                            status: 1
                        });
                    }
                    else {
                        resolve({
                            status: 1
                        });
                    }
                }
                else { // install.txt run
                    global.managers.queue.getCurrent().data.state = "running_install";
                    let install_lines = fs.readFileSync(package_path, 'utf8');
                    install_lines = install_lines.trim();
                    install_lines = install_lines.split("\n");
                    for (let line_index = 0; line_index < install_lines.length; line_index++) {
                        line = install_lines[line_index].trim();
                        try {
                            //Detect folder push in install.txt and create folders (Quest 3 fix)
                            if (line.toLowerCase().indexOf("adb install") == 0) {
                                packageName = line.split(/\s/g).pop().trim().replace(/"/g, '').replace(".apk", "");;
                                global.managers.queue.getCurrent().data.package = packageName;
                                global.managers.queue.getCurrent().data.app_name = getPackagePrettyName(packageName);
                            }

                            if (line.toLowerCase().indexOf("adb push") == 0) {
                                let folderToPush = line.split(/\s/g)[2];

                                let folderToPushStat = fs.statSync(path.join(packageFolder, folderToPush));
                                if (folderToPushStat.isDirectory()) {
                                    await shell("mkdir " + line.split(/\s/g)[3] + "/" + folderToPush);
                                    let recursiveFolders = await global.managers.file.getRecursiveFolders(path.join(packageFolder, folderToPush));
                                    const directories = recursiveFolders.filter(item => item.directory);

                                    for (let directory = 0; directory < directories.length; directory++) {
                                        await shell("mkdir " + line.split(/\s/g)[3] + "/" + folderToPush + directories[directory].path);
                                    }
                                }
                            }
                        }
                        catch (e) {
                        }
                    }

                    Promise.all(install_lines.map(async (line) => {
                        return execPromise(global.qslToolsHome + path.sep + line, { cwd: packageFolder }, true);
                    })).then(() => {
                        resolve({
                            status: 1
                        });
                    });
                }
            }
            catch (e) {
                resolve({
                    status: 0,
                    state: global.managers.queue.getCurrent().data.state,
                    error: "Error installing package: " + e.message
                });
            }
            finally {
                shell("rm " + global.tmpApkPath);
            }
        });
    }
    else {
        return {
            status: 0,
            state: global.managers.queue.getCurrent().data.state,
            error: "No device connected"
        };
    }
}

const removeOBBFolder = async (packageName) => {
    await shell("rm -rf " + global.obbPath + packageName);
}

const createOBBFolder = async (packageName) => {
    await shell("mkdir " + global.obbPath + packageName);
}

const removeDataFolder = async (packageName) => {
    await shell("rm -rf " + global.dataPath + packageName);
}

const createOBBFolders = async (directories, packageName) => {
    //recursive create folders before copying files, due to permissions error on quest 3
    directories.forEach(async (item) => {
        if (item.directory) {
            await shell("mkdir " + global.obbPath + packageName + item.path);
        }
    });
}

const uninstallPackage = async (packageName) => {
    if (global.adbDevice) {
        try {
            if (package && package.trim() != "") {
                await global.adbDevice.uninstall(packageName);
                await removeOBBFolder(packageName);
                await removeDataFolder(packageName);
            }
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
    else {
        return {
            status: 0,
            error: "No device connected"
        }
    }
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
        bin: './qsl-tools/' + global.binName
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
    uninstallPackage,
    backupApp,
    backupData
}