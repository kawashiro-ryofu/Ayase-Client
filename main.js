/*
  Ayase-Client
  (C) 2022 kawashiro-ryofu & thr Ayase developers
  Licenced Under MPL2.0
*/

// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
const jquery = require('jquery')
const { ipcMain } = require('electron')
const { dialog } = require('electron')
const os = require('os')
const process = require('node:process')
const shell = require('shelljs')

require('@electron/remote/main').initialize();

// 通知修复
if (process.platform === 'win32')
{
    app.setAppUserModelId('Ayase');
}

//设置页 锁 防止多开
var settingsLock = false

//渲染器 IPC 接收
ipcMain.on('asynchronous-message', (event, arg) => {
  

  // 渲染进程 IPC调用
  var rendererFunc = {
    // 打开设置界面
    "settings": async function(anchor){
      if(!settingsLock){
        settingsLock = true
        const settingsWindow = new BrowserWindow({
          width: 800,
          height: 600,
          minWidth: 640,
          minHeight: 480,
          icon: 'favicon.ico',
          autoHideMenuBar: true,
          webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true
          },
        })

        await settingsWindow.loadFile('settings.html')
        console.log('Loading Settings')

        settingsWindow.on('closed',()=>{
          settingsLock = false
          console.log('Exited Settings')
        })
      }
    }
  }

  // 解析 渲染器 IPC 接收
  var r = JSON.parse(arg)
  console.log(r)
  if(r.argsjson != undefined) rendererFunc[r.command](JSON.parse(r.argsjson))
  else rendererFunc[r.command]()
  
})


function sideNBar (scrwidth, scrheight) {
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: scrheight,
    x: scrwidth-300,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
      /*devTools: false*/
    },
    frame: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true,
    icon: 'favicon.ico',
 
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.webContents.closeDevTools()
  //mainWindow.setSkipTaskbar(true)
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  require("@electron/remote/main").enable(mainWindow.webContents)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  sideNBar(width, height)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) sideNBar()
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

setInterval(()=>{
  // 删除临时文件
  if(shell.ls('./*.tmp.html').length != 0)shell.rm('./*.tmp.html')
}, 10000)

