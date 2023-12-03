const express = require('express');
const path = require("path");
const fs = require("fs");
const os = require('os');

const app = express();

app.get("/api/download", async (req, res) => {
    try {
        const filePath = "D:\\Plex\\Movies\\The.Hunger.Games.PACK.1080p.BluRay.x264-Scene\\The.Hunger.Games.1080p.BluRay.X264-BLOW.mkv";
        const data = fs.createReadStream(filePath);
        const disposition = 'attachment; filename="Allegiant.2016.1080p.BluRay.x264.AC3-FuzerHD.mkv"';

        res.setHeader('Content-Length', fs.lstatSync(filePath).size);
        res.setHeader('Content-Type', "application/octet-stream");
        res.setHeader('Content-Disposition', disposition);

        data.pipe(res);
    }
    catch(e) {
    }
});

app.listen(9999, () => {
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