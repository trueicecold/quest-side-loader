const adb = require("../libs/adb");

const init = async () => {
    adb.init();
}

const autoConnect = async (ip) => {
    ip = ip.replace("::ffff:", "");
    return await adb.autoConnect(ip);
}

const connectDevice = async (serial) => {
    return await adb.connectDeviceBySerial(serial);
}

const disconnectDevice = async () => {
    return await adb.disconnectDevice();
}

const getDeviceData = () => {
    return {
        connected: (global.adbDevice != null),
        connected_device: global.adbDevice ? global.adbDevice.serial : "",
        devices: global.devices,
        battery: global.battery,
        installed_packages: global.installedPackages,
        memory: global.memory,
        firmware: global.firmware,
        storage: global.storage
    }
}

const installPackage = async (req) => {
    return await adb.installPackage(req.body.path, req.body.obb, req.body.install);
}

const uninstallPackage = async (package) => {
    return await adb.uninstallPackage(package);
}

const getInstallProgress = async () => {
    return await adb.getInstallProgress();
}   

module.exports = {
    init,
    autoConnect,
    connectDevice,
    disconnectDevice,
    getDeviceData,
    installPackage,
    getInstallProgress,
    uninstallPackage
}