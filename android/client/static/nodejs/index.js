const Downloader = require('nodejs-file-downloader');
const { channel } = require('bridge');

channel.addListener('download', async message => {
    await downloadFile();
    channel.send('download-finished');
});

const downloadFile = async () => {
    const downloader = new Downloader({
        url: "http://10.100.102.206:9595/api/download",
        directory: "./downloads/movie", //Sub directories will also be automatically created if they do not exist.
        onProgress: function (percentage, chunk, remainingSize) {
            //Gets called with each chunk.
            console.log("% ", percentage);
            console.log("Current chunk of data: ", chunk);
            console.log("Remaining bytes: ", remainingSize);
        },
    });

    try {
        await downloader.download();
    } catch (error) {
        console.log(error);
    }
}