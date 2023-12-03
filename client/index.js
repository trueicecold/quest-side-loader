require("./global");

const fileManager = require("./managers/file");
const adbManager = require("./managers/adb");
const webServerManager = require("./managers/web_server");
const metadataManager = require("./managers/metadata");

process.on("unhandledRejection", function (reason, promise) {
    console.log("BLUEBIRDDDDD");
    console.log(reason);
});

const dependencies = {
    "win32": [
        "https://raw.githubusercontent.com/trueicecold/quest-side-loader/main/client/tools/adb/win32/adb.exe",
        "https://raw.githubusercontent.com/trueicecold/quest-side-loader/main/client/tools/adb/win32/AdbWinApi.dll",
        "https://raw.githubusercontent.com/trueicecold/quest-side-loader/main/client/tools/adb/win32/AdbWinUsbApi.dll",
        "https://raw.githubusercontent.com/trueicecold/quest-side-loader/main/client/tools/7zip/win32/7za.exe",
    ],
    "linux": [
        "https://raw.githubusercontent.com/trueicecold/quest-side-loader/main/client/tools/adb/linux/adb",
        "https://raw.githubusercontent.com/trueicecold/quest-side-loader/main/client/tools/7zip/linux/7za",
    ]
};

const meta_url = "https://raw.githubusercontent.com/trueicecold/quest-side-loader-meta/main/meta.zip";
const meta_hash = "https://raw.githubusercontent.com/trueicecold/quest-side-loader-meta/main/meta.hash";

const init = async () => {
    const dependenciesResponse = await fileManager.checkDependencies(dependencies[process.platform]);
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