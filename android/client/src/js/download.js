import { NodeJS } from 'capacitor-nodejs';
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
}