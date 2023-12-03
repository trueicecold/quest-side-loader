const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

let zipFile;
let zipEntries;

const init = () => {
    zipFile = new AdmZip('./qsl-data/meta.zip', "");
    zipEntries = zipFile.getEntries();
    for (var i = 0; i < zipEntries.length; i++) {
        if (zipEntries[i].entryName == "VRP-GameList.txt") {
            let items = zipEntries[i].getData(global.metaKey).toString();
            items = items.trim();
            items = items.split("\n");
            items.splice(0,1);
            items.forEach((item) => {
                item = item.split(";");
                global.metadata[item[2].toLowerCase()] = {
                    name: item[0],
                    release_name: item[1],
                    package: item[2],
                    version: item[3],
                    size: item[4]
                } 
            });
        }

        if (zipEntries[i].entryName == ".meta/nouns/blacklist.txt") {
            global.blacklist_apps = zipEntries[i].getData(global.metaKey).toString().toLowerCase().trim();
            global.blacklist_apps = global.blacklist_apps.split("\n");
        }
    }
}

const getEntry = (package) => {
    return global.metadata[package.toLowerCase()] || {
        name: package,
        package: package
    }
}

const getImage = (package) => {
    let entry = zipFile.getEntry(".meta/thumbnails/" + package + ".jpg");
    if (entry) {
        return entry.getData(global.metaKey);
    }
    else {
        return null;
    }
}

module.exports = {
    init,
    getEntry,
    getImage
}