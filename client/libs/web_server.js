const express = require('express');
const cors = require('cors');
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const bodyParser = require('body-parser')
const os = require('os'); 

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

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
    res.send(await global.managers.adb.connectDevice(req.body.serial));
});

app.get("/api/device_disconnect", async (req, res) => {
    res.send(await global.managers.adb.disconnectDevice());
});

app.get("/api/auto_connect", async (req, res) => {
    res.send(await global.managers.adb.autoConnect(req.ip));
});

app.get("/api/device_data", (req, res) => {
    res.send(global.managers.adb.getDeviceData());
});

app.get("/api/package_image", (req, res) => {
    let package_image = global.managers.metadata.getImage(req.query.p);
    if (package_image) {
        res.end(package_image, "binary");
    }
    else {
        res.redirect("/images/default_thumb.png");
    }
});

app.get("/api/drive_list", async (req, res) => {
    res.send(await global.managers.file.getDriveList());
});

app.post("/api/file_list", (req, res) => {
    res.send(global.managers.file.getFileList(req.body.path));
});

app.post("/api/install_package", async (req, res) => {
    res.send(await global.managers.adb.installPackage(req));
});

app.post("/api/uninstall_package", async (req, res) => {
    res.send(await global.managers.adb.uninstallPackage(req.body.package));
});

app.post("/api/backup_app", async (req, res) => {
    res.send(await global.managers.adb.backupApp(req.body.package));
});

app.post("/api/backup_data", async (req, res) => {
    res.send(await global.managers.adb.backupData(req.body.package));
});

app.get("/api/queue", async (req, res) => {
    res.send(global.managers.queue.get());
});

app.post("/api/queue", async (req, res) => {
    res.send(global.managers.queue.add(req.body.type, req.body.params));
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