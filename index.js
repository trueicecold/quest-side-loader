require("./libs/global");

const fileManager = require("./managers/file");
const adbManager = require("./managers/adb");
const webServerManager = require("./managers/web_server");


const dependencies = [
    "https://raw.githubusercontent.com/awake558/adb-win/master/SDK_Platform-Tools_for_Windows/platform-tools_r34.0.5-windows/adb.exe",
    "https://raw.githubusercontent.com/awake558/adb-win/master/SDK_Platform-Tools_for_Windows/platform-tools_r34.0.5-windows/AdbWinApi.dll",
    "https://raw.githubusercontent.com/awake558/adb-win/master/SDK_Platform-Tools_for_Windows/platform-tools_r34.0.5-windows/AdbWinUsbApi.dll"
];

const init = async () => {
    const dependenciesResponse = await fileManager.checkDependencies(dependencies);
    if (dependenciesResponse) {
        webServerManager.init();
        adbManager.init();
    }
    else {
        console.log("Error downloading dependencies");
        process.exit();
    }
}

init();