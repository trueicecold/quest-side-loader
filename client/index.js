require("./global");

const fileManager = require("./managers/file");
const adbManager = require("./managers/adb");
const webServerManager = require("./managers/web_server");
const metadataManager = require("./managers/metadata");

process.on("unhandledRejection", function (reason, promise) {
    console.log("BLUEBIRDDDDD");
    console.log(reason);
});

const dependencies = [
    "https://raw.githubusercontent.com/awake558/adb-win/master/SDK_Platform-Tools_for_Windows/platform-tools_r34.0.5-windows/adb.exe",
    "https://raw.githubusercontent.com/awake558/adb-win/master/SDK_Platform-Tools_for_Windows/platform-tools_r34.0.5-windows/AdbWinApi.dll",
    "https://raw.githubusercontent.com/awake558/adb-win/master/SDK_Platform-Tools_for_Windows/platform-tools_r34.0.5-windows/AdbWinUsbApi.dll"
];

const meta_url = "http://159.65.219.115/meta.zip";
const meta_hash = "http://159.65.219.115/meta.hash";

const init = async () => {
    const dependenciesResponse = await fileManager.checkDependencies(dependencies);
    const metaResponse = await fileManager.checkMeta(meta_url, meta_hash);
    
    if (!dependenciesResponse) {
        console.log("Error downloading dependencies");
        process.exit();
    }

    if (!metaResponse) {
        console.log("Error downloading meta file");
        process.exit();
    }

    webServerManager.init();
    adbManager.init();
    metadataManager.init();
}

init();