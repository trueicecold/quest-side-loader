import { Directory, Filesystem } from '@capacitor/filesystem';

let startTime;
window.download = async () => {
    startTime = new Date().getTime();
    Filesystem.addListener("progress", (progress) => {
        document.querySelector("#progress").innerHTML = humanFileSize(progress.bytes);
    });
    Filesystem.downloadFile({
        method: "GET",
        path: "test123/movie.mkv",
        directory: Directory.Data,
        url: "http://10.100.102.6:9999/api/download",
        progress: true,
        recursive: true
    }).then((res) => {
        alert("Done in " + (new Date().getTime() - startTime) + "ms");
    }).catch((err) => {
        alert("Error: " + err);
    });
};

window.humanFileSize = (size) => {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

/*import { NodeJS } from 'capacitor-nodejs';
alert(NodeJS);
// Listens to "msg-from-nodejs" from the Node.js process.
NodeJS.addListener('msg-from-nodejs', event => {
    document.body.innerHTML = `
    <p>
      <b>Message from Capacitor</b><br>
      First argument: ${event.args[0]}<br>
      Second argument: ${event.args[1]}
    </p>
  `;
    console.log(event);
});

// Waits for the Node.js process to initialize.
NodeJS.whenReady().then(() => {
    // Sends a message to the Node.js process.
    alert("Done");
});

NodeJS.addListener('download-finished', event => {
    alert("Done in " + (new Date().getTime() - startTime) + "ms");
});

let startTime = new Date().getTime();
window.download = async () => {
    alert("START");
    startTime = new Date().getTime();
    NodeJS.send({
        eventName: 'download'
    });
}*/