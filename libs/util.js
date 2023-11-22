const delay = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const humanFileSize = (size) => {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

module.exports = {
    delay,
    humanFileSize
}