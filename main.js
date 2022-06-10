/*
  TeleScreen alpha 20220603
  (C) 2022 kawashiro-ryofu
  Licenced Under MPL2.0
*/

// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
const jquery = require('jquery')
const { ipcMain } = require('electron')
const { dialog } = require('electron')

function createWindow (scrwidth, scrheight) {
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: scrheight,
    x: scrwidth-300,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true
    },
    frame: false,
    /*minWidth: 300,
    minHeight: 900,
    maxWidth: 300,
    maxHeight: 900,*/
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()
  //mainWindow.setSkipTaskbar(true)
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  createWindow(width, height)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// 渲染器操作函数
renderFuncs = {
  // MsgBox对话框
  //  icon: 图标(str)
  "MsgBox": dialog.showMessageBoxSync
}

// 与渲染层的IPC通信
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.reply('asynchronous-reply', 'pong')
})
ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'pong'
})
