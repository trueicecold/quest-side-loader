const fs = require("fs-extra");
const path = require("path");
const Bluebird = require('bluebird');
const nodeDiskInfo = require("node-disk-info");
const https = require("https");
const http = require("http");
var crypto = require('crypto');

let metaZipFile;

const checkDependencies = async (dependencies) => {
    if (!fs.existsSync(global.qslBackup)) {
        fs.mkdirSync(global.qslBackup);
    }

    let dependenciesExist = true;
    for (let i = 0; i < dependencies.length; i++) {
        let dependency = dependencies[i];
        if (dependenciesExist) {
            let fileName = dependency.substr(dependency.lastIndexOf("/") + 1);
            if (!fs.existsSync(global.qslToolsHome)) {
                fs.mkdirSync(global.qslToolsHome);
            }
            if (!fs.existsSync(global.qslToolsHome + "/" + fileName)) {
                dependenciesExist = false;
                console.log("Missing " + fileName + ", Downloading...");
                try {
                    dependenciesExist = await downloadFile(dependency, global.qslToolsHome + "/" + fileName);
                }
                catch (e) {
                    dependenciesExist = false;
                }
            }
        }
    }
    return dependenciesExist;
}

const checkMeta = async (meta_url, meta_hash) => {
    let metaDownload = true;
    if (!fs.existsSync(global.qslDataHome)) {
        fs.mkdirSync(global.qslDataHome);
    }
    if (!fs.existsSync(global.qslDataHome + "/meta.zip")) {
        console.log("Missing meta file, downloading...");
        metaDownload = true;
    }
    else {
        if (fs.existsSync(global.qslDataHome + "/meta.hash_local")) {
            const meta_local = fs.readFileSync(global.qslDataHome + "/meta.hash_local", "utf-8");
            await downloadFile(meta_hash, global.qslDataHome + "/meta.hash");
            const meta_remote = fs.readFileSync(global.qslDataHome + "/meta.hash", "utf-8");
            if (meta_local == meta_remote) {
                metaDownload = false;
                //console.log(metaZipFile.getData())
            }
        }
        else {
            console.log("Missing local hash, Downloading...");
            metaDownload = true;
        }
    }
    if (metaDownload) {
        await downloadFile(meta_url, global.qslDataHome + "/meta.zip");
        writeLocalMetaHash();
    }
    return true;
}

const writeLocalMetaHash = () => {
    //Creating a readstream to read the file
    var myReadStream = fs.createReadStream(global.qslDataHome + '/meta.zip');
    var rContents = '' // to hold the read contents;
    myReadStream.on('data', function (chunk) {
        rContents += chunk;
    });
    myReadStream.on('error', function (err) {
        console.log(err);
    });
    myReadStream.on('end', function () {
        //Calling the getHash() function to get the hash
        var content = getHash(rContents);
        fs.writeFileSync(global.qslDataHome + "/meta.hash_local", content);
    });
}

const getHash = (content) => {
    var hash = crypto.createHash('md5');
    //passing the data to be hashed
    data = hash.update(content, 'utf-8');
    //Creating the hash in the required format
    gen_hash = data.digest('hex');
    return gen_hash;
}

const downloadFile = (url, destination) => {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(destination);

        const protClass = (url.indexOf("http://") > -1) ? http : https;
        const request = protClass.get(url, (response) => {
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
        path: path.normalize(dir_path),
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

const getFileFromZip = (path) => {
}

module.exports = {
    checkDependencies,
    checkMeta,
    getFileList,
    getRecursiveFolders,
    getDriveList
}