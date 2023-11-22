const express = require('express');
const cors = require('cors');
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const bodyParser = require('body-parser')
const os = require('os'); 

const adbManager = require("../managers/adb");
const fileManager = require("../managers/file");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
        callback(null, { origin: true });
    }
}));

app.set('view engine', 'ejs');

app.get("/api/own_ip", async (req, res) => {
    res.send({
        ip: req.ip.replace("::ffff:", "")
    });
});

app.post("/api/device_connect", async (req, res) => {
    res.send(await adbManager.connectDevice(req.body.serial));
});

app.get("/api/device_disconnect", async (req, res) => {
    res.send(await adbManager.disconnectDevice());
});

app.get("/api/auto_connect", async (req, res) => {
    res.send(await adbManager.autoConnect(req.ip));
});

app.get("/api/device_data", (req, res) => {
    res.send(adbManager.getDeviceData());
});

app.get("/api/drive_list", async (req, res) => {
    res.send(await fileManager.getDriveList());
});

app.post("/api/file_list", (req, res) => {
    res.send(fileManager.getFileList(req.body.path));
});

app.post("/api/install_package", async (req, res) => {
    res.send(await adbManager.installPackage(req));
});

app.get("/api/install_progress", async (req, res) => {
    res.send(await adbManager.getInstallProgress());
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use("/public", express.static('public', {
    maxAge: 0
}));

app.use("/", async (req, res, next) => {
    res.send(await ejs.renderFile(path.join(__dirname, '..', 'public', 'index.ejs'), { public_path: path.join(__dirname, '..', 'public'), fs: fs, current_page: req.query.v || "index"}));
});

const init = async () => {
    app.listen(9595, () => {
        console.log('QSL is connected.');
        const interfaces = os.networkInterfaces();
        for (var key in interfaces) {
            interfaces[key].map((interface) => {
                if (interface.family == "IPv4") {
                    console.log("Available at http://" + interface.address + ":9595");
                }
            });
        }
    }).on('error', (err) => {
        console.log(err);
    });
}

module.exports = {
    init
}