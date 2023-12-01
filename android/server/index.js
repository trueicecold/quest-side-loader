const express = require('express');
const path = require("path");
const fs = require("fs");
const os = require('os');

const app = express();

app.get("/api/download", async (req, res) => {
    const filePath = "D:\\Torrent Downloads\\Elemental.2023.720p.BluRay.HebSubs.x264-PiGNUS\\Elemental.2023.720p.BluRay.HebSubs.x264-PiGNUS.mkv";
    const data = fs.createReadStream(filePath);
    const disposition = 'attachment; filename="Allegiant.2016.1080p.BluRay.x264.AC3-FuzerHD.mkv"';

    res.setHeader('Content-Type', "application/octet-stream");
    res.setHeader('Content-Disposition', disposition);

    data.pipe(res);
});

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