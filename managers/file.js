const fs = require("fs-extra");
const path = require("path");
const Bluebird = require('bluebird');
const nodeDiskInfo = require("node-disk-info");
const https = require("https");

const checkDependencies = async (dependencies) => {
    let dependenciesExist = true;
    for (let i = 0; i < dependencies.length; i++) {
        let dependency = dependencies[i];
        if (dependenciesExist) {
            let fileName = dependency.substr(dependency.lastIndexOf("/") + 1);
            if (!fs.existsSync("./qsl-tools")) {
                fs.mkdirSync("./qsl-tools");
            }
            if (!fs.existsSync("./qsl-tools/" + fileName)) {
                dependenciesExist = false;
                console.log("Missing " + fileName + ", Downloading...");
                try {
                    dependenciesExist = await downloadFile(dependency, "./qsl-tools/" + fileName);
                }
                catch (e) {
                    dependenciesExist = false;
                }
            }
        }
    }
    return dependenciesExist;
}

const downloadFile = (url, destination) => {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(destination);

        const request = https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true); // File downloaded successfully
                });
            } else {
                file.close();
                fs.unlink(destination, () => {
                    console.log("Error downloading (" + url + ") - Status code: " + response.statusCode);
                    resolve(false); // Failed to download file
                });
            }
        });

        request.on('error', (err) => {
            console.log("Error downloading (" + url + ") - Status code: " + response.statusCode);
            file.close();
            fs.unlink(destination, () => {
                resolve(false); // Failed to download file
            });
        });
    });
}

const getDriveList = async () => {
    let drives = nodeDiskInfo.getDiskInfoSync();
    drives = drives.map(drive => {
        return drive.mounted + "\\";
    });
    return drives;
}

const getFileList = (dir_path) => {
    let files_json = {
        files: [],
        directories: []
    };
    let files = fs.readdirSync(dir_path);
    files.forEach(file => {
        try {
            // get the details of the file 
            let fileDetails = fs.lstatSync(path.resolve(dir_path, file));
            // check if the file is directory 
            if (fileDetails.isDirectory()) {
                files_json.directories.push({
                    name: file,
                    last_modified: fileDetails.mtime
                });
            } else {
                files_json.has_install = files_json.has_install || file.toLowerCase() == "install.txt";
                files_json.files.push({
                    name: file,
                    size: fileDetails.size,
                    last_modified: fileDetails.mtime
                });
            }
        }
        catch(e) {
        }
    });
    return files_json;
}

const getRecursiveFolders = async (dir_path, folder_path = "", folders = []) => {
    let files = fs.readdirSync(dir_path);
    await Bluebird.each(files, async (file) => {
        try {
            // get the details of the file 
            let fileDetails = fs.lstatSync(path.resolve(dir_path, file));
            // check if the file is directory 
            if (fileDetails.isDirectory()) {
                folders.push({
                    directory: true,
                    path: folder_path + "/" + file
                });
                folder_path = folder_path + "/" + file;
                getRecursiveFolders(path.resolve(dir_path, file), folder_path, folders);
            }
            else {
                folders.push({
                    directory: false,
                    folder: folder_path,
                    path: folder_path + "/" + file
                });
            }
        }
        catch(e) {
            console.log(e.message);
        }
    });
    return folders;
}

module.exports = {
    checkDependencies,
    getFileList,
    getRecursiveFolders,
    getDriveList
}