/*
  Ayase-Client
  (C) 2022 kawashiro-ryofu & thr Ayase developers
  Licenced Under MPL2.0
*/

// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
//const jquery = require('jquery')

const { dialog } = require('electron')
const os = require('os')
const process = require('node:process')
const shell = require('shelljs')
const log = require('electron-log')
const package = require('./package.json')
const { error } = require('console')
const { ipcMain } = require('electron')

// 日志·版权信息
// <!> 日志规则：仅英文（防止读取日志时出现文字编码问题）
log.info(`Ayase-Client v${package.version}`)
log.info(`(C) ${ new Date().getFullYear()} kawashiro-ryofu & the Ayase Developers`)
log.info(`Licenced Under Mozilla Public License Version 2.0`)

try{
  Object.assign(console, log.functions);
}catch(err){
  log.error(`Initing Log: ${err}`)
}

try{
  shell.config.execPath = shell.which('node').toString()
}catch(err){
  log.error(`Initing Shelljs: ${err}`)
}


require('@electron/remote/main').initialize();

// Win32通知修复
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

    // 打开<del>设置界面</del>  配置文件
    //  to-do 设置界面
    settings: function(){


    /*async function(){
      if(!settingsLock){
        settingsLock = true
        const settingsWindow = new BrowserWindow({
          width: 800,
          height: 600,
          minWidth: 640,
          minHeight: 480,
          icon: 'favicon.ico',
          backgroundColor: '#000000',
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
        })*/
        
    },
    // 阅读器
    reader: function(args){
      // args:
      //  e.g. {filepath: "/path/of/page/which/render/export/"}
      const readerWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 640,
        minHeight: 480,
        icon: 'favicon.ico',
        autoHideMenuBar: true,
        backgroundColor: '#000000',
        webPreferences: {
          /*preload: path.join(__dirname, 'preload.js'),*/
          contextIsolation: false,
          nodeIntegration: true,
          devTools: false
        },
      })
      try{
        readerWindow.loadFile(args.filepath)
        readerWindow.on('closed', ()=>{
          shell.rm(args.filepath)
        })
      }catch(err){
        log.error(`Reader: ${err}`)
      }
    },
    run: function(args){
      // args:
      //  cmd 要运行的程序、网页、命令
      try{
        switch(process.platform){
          case "darwin":
            shell.exec(`open ${ args.cmd }`)
            break;
          case "win32":
            shell.exec(`start ${ args.cmd }`)
            break;
          default:
            shell.exec(`xdg-open ${ args.cmd }`)
        }
      }catch(err){
        log.error(`Calling Shell: ${err}`)
      }
    }
  }

  // 解析 渲染器 IPC 接收
  var r = JSON.parse(arg)

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
    minHeight: scrheight,
    minWidth: 300,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
      /*devTools: true*/
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
  mainWindow.webContents.openDevTools()

  require("@electron/remote/main").enable(mainWindow.webContents)

  // 崩溃处理
  mainWindow.webContents.on('crash', function(){
    // 
    const options = {
      type: 'error',
      title: '进程崩溃了',
      message: '这个进程已经崩溃.',
      buttons: ['重载', '退出'],
    };    
    dialog.showMessageBox(options)
   
    //
  })
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
  log.info('Quit')
})

app.on('will-quit', function(){
  log.info('Quit')
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/*
setTimeout(function(){
  setInterval(()=>{
    // 删除临时文件

    shell.ls().forEach(function(currentValue, index){
      if(/\d.tmp.html/.test(currentValue) == true)shell.rm('./*.tmp.html')
    })

  }, 10000)
}, 10000)*/

process.on('uncaughtException', async function(error){
  var title = 'Unexpected Error Occurred'
  var content = title + `: ${error.toString()}`
  log.error(content)
  dialog.showErrorBox({
    title: title,
    content: content
  })
})

// 全局异常处理测试
/*
setTimeout(()=>{
  throw 'Error Test';
},10000)
*/