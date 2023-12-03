# QSL (Quest Side Loader)

Quest side loader is an alternative to other meta quest sideloaders like sidenoder, rookie and sidequest.
It's 

## Features

 - Single exe, no installers (although it will download adb if not present)
- Run the sideloader through the browser, meaning you can run the sideloader using your pc, android device, or even from the quest itself! This is done by running a webserver that provides the entire UI interface, and an HTTP API to communicate between the client (pc browser/quest) using ajax calls. This means you can sideload apks from your pc while not being physically near your pc.
- Wireless ADB support
- OBB fix for Quest 3
- install.txt support with Quest 3 fixes!
- Manage installed packages like Uninstall, backup app+obb and backup data (restore not yet supported)
- Windows only for now, linux and mac coming soon

## Coming Soon
- Option to queue actions with an "Pending Actions" screen
- New UI with Dark mode
- Linux and Mac support

## Debug and Build
1. Clone the repo to your pc
2. Run `npm i` to install dependencies
3. Run `node index.js` to run the server
4. After downloading dependencies, choose the correct URL to open the WebUI

## Package
Packing QSL to an executable relies on the pkg package by vercel, so you'd need to install it first:
`npm install -g pkg`
After that, run `npm run package` to create an executable in the `dist` folder.