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
const log = require('electron-log')
const package = require('./package.json')

// 日志·版权信息
// <!> 日志规则：仅英文（防止读取日志时出现文字编码问题）
log.info(`Ayase-Client v${package.version}`)
log.info(`(C) ${ new Date().getFullYear()} kawashiro-ryofu & the Ayase Developers`)
log.info(`Licenced Under Mozilla Public License Version 2.0`)

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
        log.info('Started Settings Window')

        settingsWindow.on('closed',()=>{
          settingsLock = false
          log.info('Closed Settings Window')
        })
      }
    }
  }

  // 解析 渲染器 IPC 接收
  var r = JSON.parse(arg)
  log.info(`Received IPC ${ r }`)
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
  log.info(`Loaded Sidebar Window`)
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
    log.info('Ready')
    if (BrowserWindow.getAllWindows().length === 0) sideNBar()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
  log.info('Quitted')
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

setTimeout(function(){
  setInterval(()=>{
    // 删除临时文件

    shell.ls().forEach(function(currentValue, index){
      if(/\d.tmp.html/.test(currentValue) == true)shell.rm('./*.tmp.html')
    })

  }, 10000)
}, 10000)