// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


// 启动
const package = require("./package.json");
const http = require('http');
const { now } = require("jquery");
const fs = require('fs')
const { BrowserWindow } = require('@electron/remote');
const { Console } = require("console");
const dialog = require('@electron/remote').dialog
const os = require('os')
const path = require('path')
const shell = require('shelljs');
const { electron, contextIsolated } = require("process");
const { read } = require("fs/promises");
const { ipcMain } = require('electron')
const xss = require('xss')
const { useTemplate } = require('./templates.js')
const log = require('electron-log')
const { isUUID } = require('validator')
//var uuidreg = /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi

// 主进程 IPC 通信 包装
function toMainTask(command, argsjson){
    const { ipcRenderer } = require('electron')
    var x = {"command": command, "argsjson": argsjson}
    ipcRenderer.send('asynchronous-message', JSON.stringify(x))
}

// 内建函数
//
//  日期时间格式化函数
//  dateobj: Date对象
//  format: 格式（字符串）
//          %Y  四位数的年份表示（000-9999）
//          %m  月份（01-12）
//          %d  月内中的一天（0-31）
//          %a  本地简化星期名称
//          %H  24小时制小时数
//          %I  12小时制小时数
//          %M  分钟数
//          %S  秒
//          %p  本地A.M.或P.M.的等价符
//  DOW: 星期名称格式
//  Pf: 上午(A.M.)或下午(P.M.)的时间格式
//  Z: 十位补齐（当整数小于零字符串补齐0）
function FormatDate(dateobj = new Date(), format = "%Y-%m-%d %a", DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], Pf = ["A.M.", "P.M."], Z=true){
    //  年
    var Y = dateobj.getFullYear().toString()
    //  月
    var m = (dateobj.getMonth() + 1).toString()
    if(dateobj.getMonth() + 1 < 10 && Z)m = '0' + m
    //  日
    var d = dateobj.getDate().toString()
    if(dateobj.getDate() < 10 && Z)d = '0' + d
    //  周
    var a = DOW[dateobj.getDay()]
    //  小时
    var H = dateobj.getHours()
    var p = (H > 12)
    var I;
    p?I = H - 12:I = H;
    H = H.toString()
    if(dateobj.getHours() < 10 && Z)H = '0' + H.toString()
    I = I.toString()
    if(dateobj.getHours()%12 < 10 && Z)I = '0' + I.toString()
    p?p = "P.M.":p = "A.M."
    //  分钟
    M = dateobj.getMinutes().toString()
    if(dateobj.getMinutes() < 10 && Z)M = '0' + M
    //秒
    S = dateobj.getSeconds().toString()
    if(dateobj.getSeconds() < 10 && Z)S = '0' + S
    format = format.replace('%Y', Y)
    format = format.replace('%m', m)
    format = format.replace('%d', d)
    format = format.replace('%a', a)
    format = format.replace('%H', H)
    format = format.replace('%I', I)
    format = format.replace('%M', M)
    format = format.replace('%S', S)
    format = format.replace('%p', p)
    return format
}

//  去除HTML标签
//  https://blog.csdn.net/xuzengqiang2/article/details/41979733
function delHtmlTag(str){
    return str.replace(/<[^>]+>/g,"");//去掉所有的html标记
} 

//      通知：对象
function Notice(title, content, publisher, level, pubDate, uuid, description = delHtmlTag(content)){
    this.title = xss(title); /* 标题 */
    this.content = xss(content); /* 正文 */
    this.description = delHtmlTag(description); /* 描述 */ 
    this.publisher = xss(publisher); /* 发布者 */
    this.pubDate = pubDate; /* 发布时间（Date对象） */
    this.uuid = xss(uuid); /* （远端服务器）UUID */
    /* 优先级
        说明

        级别                通知    响铃    弹窗

        A （紧急 重要）       1      1      1
        B （不紧急 重要）     1      1      0
        C （紧急 不重要）     1      0      0
        D （不紧急 不重要）   0      0      0
    */
    this.level = xss(level); /* 优先级 */
    // ---------------------------------------- //
    this.id = noticeBar.length /* （本机）ID */
    this.update = false /* （本机）更新标识 */
    this.delete = false /* （本机）删除标识 */


    if(isUUID(this.uuid) && new Date().getTime() < this.pubDate){
        if(isUUID(this.uuid) == false){
            log.error("Appending Notice: UUID syntax error. Maybe the server is NOT TRUSTWORTHY")
            
            //  Multi-Language require
            dialog.showMessageBox({title: "不正常的通知对象", message: `刚刚收到的通知(UUID: ${uuid}, 标题: ${title})的UUID是非法的。\n安全起见，此通知不会被展示。`, type: "error"})
        }
        if(new Date().getTime() <= this.pubDate){
            log.error('Appending Notice: Timestamp fatal error. The publish date is later than current. It means that your local time is incorrect , or the server is from the future . ')
            dialog.showMessageBox({title: "不正常的通知对象", message: `刚刚收到的通知(UUID: ${uuid}, 标题: ${title})发布时间晚于当前时间。\n这意味着本机的时间可能不正确，或者，这则通知来自未来。\n安全起见，此通知不会被展示。`, type: "error"})
        }
        log.warn('Appending Notice: This notice will not append to the list. Please ensure that the server is TRUSTABLE, or contact the Network Administrator.')
        dialog.showMessageBox({title: "不正常的通知对象", message: `请联系通知服务器管理员。`, type: "warning"})
    }

}

Notice.prototype = {
    read: false,
    // 阅读器
    Read: async function(){
        var readerTemplate = useTemplate('readerTemplate.template',[
            {key: 'title', value: this.title},
            {key: 'content', value: this.content},
            {key: 'pubDate', value: FormatDate(this.pubDate, '%Y-%m-%d %H:%M') + ''},
            {key: 'publisher', value: this.publisher},
            {key: 'level', value: this.level}
        ])

        let filename = path.join(usrdir.rendercache, `${Math.round(Math.random() * 131072)}.tmp.html`)
        if(!(readAlready.list.includes(this.uuid)))readAlready.list.push(this.uuid)
        this.read = true

        new Promise(function(resolve, reject){
            fs.writeFileSync(filename, readerTemplate, { flag: 'w+' })
            resolve()
        }).then(function(){
            toMainTask('reader', JSON.stringify({filepath: filename}))
        }).catch(function(err){
            log.error(`Creating Temporary File: ${err}`);
        }).finally(function(){
            readAlready.save2fs()
            // DOM 
            $(`[uuid='${this.uuid}']`).removeClass('unread')
        })

    }
}

//      从模板生成.card .notify片段
//          notice: Notice对象
//          eleNum: 元素下标
function GenNoticeCard(notice){
    var unreadClassAttr = "unread"
    if(notice.read)unreadClassAttr = ""
    return useTemplate('notifTemplate.template', [
        {key: "uuid", value: notice.uuid}, 
        {key: "title", value: notice.title},
        {key: "description", value: notice.description}, 
        {key: "pubDate", value: FormatDate(notice.pubDate, '%Y-%m-%d %H:%M')},
        {key: "id", value: notice.id}, 
        {key: "unread", value: unreadClassAttr},
        {key: "publisher", value: notice.publisher}
    ])

    
}

//      通知栏刷新：函数
function FreshNoticeBar(){
    $('.notice').remove()
    // 同步readAlready
    readAlready.sync()
    // 去除delete=true的通知
    noticeBar.forEach(function(value, index){
        if(value.delete)delete noticeBar[index]
    })

    // 去空
    noticeBar = noticeBar.filter(function(n){
        if((typeof(n) == 'object' && n != null))return true;
    })

    // 去重
    for(var i = 0, len = noticeBar.length; i < len; i++) {
        if(typeof(noticeBar[i]) != "object") {
            delete(noticeBar[i])
            noticeBar.splice(i,1);
            i = i - 1;
        }
    }
    
    //  根据时间进行排序
    let min = 0
    for(var p = 0; p < noticeBar.length; p++){
        min = p
        for(var q = p+1; q < noticeBar.length; q++)if(noticeBar[q].pubDate.getTime() < noticeBar[min].pubDate.getTime())min = q
        let tmp = noticeBar[p]
        noticeBar[p] = noticeBar[min]
        noticeBar[min] = tmp
    }
    noticeBar = noticeBar.reverse()
    for(var a = 0; a < noticeBar.length; a++)noticeBar[a].id = a

    // 通知
    setTimeout(function () {
        var hasNew = false
        noticeBar.forEach(function (currentValue, index) {
            $('#main-list').append(GenNoticeCard(currentValue, index));
            //console.log(currentValue, index)
            // Multi-Language Support Required
            if(currentValue.read != true || currentValue.update){

                var title = "新通知"
                var body = `发布者: ${currentValue.publisher}\n通知级别: ${currentValue.level}\n描述: ${currentValue.description}`
                if(currentValue.update){
                    title = "通知变动"
                    body += `\n更新时间: ${FormatDate(currentValue.pubDate)}`
                    if(currentValue.update)currentValue.update = false
                    //  补充unread
                    currentValue.read = false
                    
                }

                // snackbar
                if(!hasNew && hasNew != undefined){
                    hasNew = true
                    SnackBar({message: title, position: 'tr', status: 'info'})
                    hasNew = undefined
                }

                // 发送通知
                // playAudio 播放通知音频（null为不播放，字符串为文件名）
                function addNotification(playAudio = null, forceIgnoreNoDisturb = false){
                    // 免打扰过滤
                    if(!LocalSettings.settings.noDisturb.enable || forceIgnoreNoDisturb){
                        new Notification(
                            title,
                            {
                                body: body,
                                icon: "favicon.ico",
                                silent: true
                            }
                        ).onclick = function(){
                            currentValue.Read()
                        }
                        if(playAudio != null)new Audio(playAudio).play()
                        log.info(`Sent Notification: ${currentValue.uuid} `)
                    }else log.warn('Sending Notification: Banned by no-disturb in settings')
                }
                switch(currentValue.level){
                    case 'C':
                        addNotification()
                        break;
                    case 'B':
                        addNotification('audios/CQ.mp3')
                        break;
                    case 'A': 
                        addNotification('audios/CQ.mp3', true)
                        currentValue.Read()
                        $('#main-list li [id="' + currentValue.id +'"]').removeClass('unread')
                        break;
                }
            }
            $('#main-list li .card').slideDown()
        });
    }, 100)
}

// 服务器路由：
//  /query/:token/LatestUpdateDate -> (json)最新发布时间 <UNIX时间戳>
//  /query/:token/NoticesList -> (json)适用于本机的所有通知列表

//  抓取数据
function GetDataFromRemote(){
    
    // 取消先前设定的 下一次自动刷新的 延迟
    clearTimeout(localNoticeCache.autoRefresh)
 
    //  读取readAlready 
    readAlready.loadFfs()

    // 函数执行记录
    //  =1 完成获取最新更新时间
    //  =2 完成获取数据
    var step = 0;

    // 设置导航栏remote-status框
    // type: err/warn/ok/''
    // content: 内容字符串（限制为10字符）
    
    function setRemoteStatusBandage(type, content){
        // 移除 #remote-status 原有的类并插入相应的CSS类
        $('#remote-status-display').removeClass('err')
        $('#remote-status-display').removeClass('warn')
        $('#remote-status-display').removeClass('ok')
        $('#remote-status-display').addClass(type)

        $('#remote-status-display .rs-descr').html('')

        // font-awesome
        var icon = new String()
        //  图标说明
        //  ok -> 正常
        //  warn -> 服务端异常
        //  err -> 本地客户端异常及网络异常
        switch(type){
            case 'err':
                icon = 'fa fw fa-times-circle'
                break;
            case 'warn':
                icon = 'fa fw fa-warning'
                break;
            case 'ok':
                icon = 'fa fw fa-check'
                break;
            default:
                icon = 'fa fw fa-spin fa-circle-o-notch'
        }

        $('.rs-ico').html(`<i class="${ icon }"></i>`)
        $('.rs-descr').html(content)

    }

    // 对话框生成
    // （需要切换为 导航栏状态显示）
    function ConnErr(xhr, status, error){

        // Multi-Language Support Required

        // 链路层错误
        // readyState != 4 默认
        var statN = "无法连接"
        var type = "err"
        var descr = "请检查网络"

        // 常见HTTP错误 400 403 404 50x
        if(xhr.readyState == 4){
            descr = `HTTP ${xhr.status}\n`
            if(xhr.status == 400){
                statN = "无效请求"
                descr += "服务器取法处理该请求"
            }
            else if(xhr.status == 403){
                statN = "鉴权失败"
                descr += "请检查服务器URL与Token"
            }
            else if(xhr.status == 404){
                statN = "无此页面"
            }
            else if(parseInt(xhr.status / 100) == 5){
                statN = `服务端错误${xhr.status}`
                type = "warn"
                descr += "请联系服务器管理员"
            }else if(xhr.status / 100 == 2){
                if(status == "parsererror"){
                    statN = "解析错误"
                    type = "warn"
                    descr = "请联系服务器管理员"
                }else{
                    statN = status
                    descr = "未知错误"
                }
            }else{
                statN = `错误${xhr.status}`
                descr = "未知错误"
            }
        }

        setRemoteStatusBandage(type, statN)

        log.error(`Connection Failed: ErrorText: ${status}, StatusCode: ${xhr.status}, Step: ${step}`)
        log.warn('Reconnect after 2 minutes')

        localNoticeCache.LSTAT.status = statN
        localNoticeCache.LSTAT.type = type
        localNoticeCache.LSTAT.descr = descr

        SnackBar({message: `${statN}<br>${descr}`, position: 'tr', status: 'error'})


        // 连接错误、失败 的 自动刷新 （延迟2分钟）
        localNoticeCache.autoRefresh = setTimeout(function(){
            GetDataFromRemote()
        }, 120000)
    }

    // 防止重复操作
    if(!localNoticeCache.GetDataLock){
        //log.info('Fetching: Latest Update Time')
        localNoticeCache.GetDataLock = true
        // 获取 最新更新时间 以确定是否需要更新数据
        localNoticeCache.LUT_XHR = $.ajax({
            type: 'GET',
            url: LocalSettings.settings.connections.serverURL + '/query/' + LocalSettings.settings.connections.token + '/LatestUpdateDate',
            dataType: 'json',
            error: (xhr, status, error)=>{ConnErr(xhr, status, error)},
            success:function(data){
                //log.info('Fetched: Latest Update Time')
                if(localNoticeCache.LatestUpdateTime <= data.LatestUpdateDate){
                    localNoticeCache.LatestUpdateTime = data.LatestUpdateDate
                    fetchNoticeData()
                    step++;
                }
            },
            complete: function(){
                localNoticeCache.GetDataLock = false
            }
        })

    }


    function fetchNoticeData(){

        //log.info('Fetching: Notice Data')
        localNoticeCache.LDT_XHR =  $.ajax({
            type: 'GET',
            url: LocalSettings.settings.connections.serverURL + '/query/' + LocalSettings.settings.connections.token + '/NoticesList',
            dataType: 'json',
            error:  (xhr, status, error)=>{ConnErr(xhr, status, error)},
            success:async function(data){

                // Multi-Language Support Required
                setRemoteStatusBandage('ok', '在线')

                // 如果有更新的数据，则存入内存并将新的通知对象加入noticeBar数组
                if(JSON.stringify(localNoticeCache.LatestData) != JSON.stringify(data)){
                    localNoticeCache.LatestData = data

                    //  本地去除服务端删除的通知
                    noticeBar.forEach(function(value, index){
                        value.delete = true
                        for(var a = 0; a < data.Notices.length; a++)if(value.uuid == data.Notices[a].uuid)value.delete = false
                        if(value.delete)log.info(`Appending Notices: ${value.uuid} will be removed`)
                    })

                    // 逐条加入
                    localNoticeCache.LatestData.Notices.forEach(function(value, index){
                        // 去重
                        var isOld = false
                        for(var a = 0; a < noticeBar.length; a++){

                            if(noticeBar[a].uuid == value.uuid){
                                if(noticeBar[a].title != value.title || 
                                    noticeBar[a].content != value.content || 
                                    noticeBar[a].publisher != value.publisher ||
                                    noticeBar[a].level != value.level 
                                ){
                                    noticeBar[a].read = false
                                    noticeBar[a].title = value.title
                                    noticeBar[a].content = value.content
                                    noticeBar[a].publisher = value.publisher
                                    noticeBar[a].level = value.level 
                                    noticeBar[a].pubDate = new Date(parseInt(value.pubDate))
                                    noticeBar[a].update = true
                                    for(var c = 0; c < readAlready.length; c++){
                                        if(readAlready.list[c] == noticeBar[a].uuid)readAlready.list[c] = null
                                        readAlready.list.sync()
                                    }
                                }
                                
                                isOld = true;
                                break;
                            }
                        }

                        if(!isOld){
                            var description = ""
                            if(value.description == undefined)description = xss(delHtmlTag(value.content).slice(0, 30))
                            else description = value.description
                            noticeBar.push(new Notice(xss(value.title), xss(value.content), xss(value.publisher), xss(value.level), new Date(parseInt(value.pubDate)),  xss(value.uuid), xss(description)))
                        }


                    })
                    FreshNoticeBar()
                    step++
                    
                }

                step++

                // Multi-Language Support Required
                localNoticeCache.LSTAT.status = "在线"
                localNoticeCache.LSTAT.type = "ok"
                localNoticeCache.LSTAT.descr = "与服务器建立连接"

                // noDisturb 处理
                if(LocalSettings.settings.noDisturb.enable != localNoticeCache.noDisturb){
                    if(!LocalSettings.settings.noDisturb.enable && localNoticeCache.noDisturb)FreshNoticeBar()
                    localNoticeCache.noDisturb = LocalSettings.settings.noDisturb.enable
                }
                // 设定 下一次自动刷新
                localNoticeCache.autoRefresh = setTimeout(function(){
                    GetDataFromRemote()
                }, 15000)
            },
            
        })
    }
}


//  初始化

//  日志 绑定console
try{
    Object.assign(console, log.functions);
}catch(err){
    log.error(`Initing Log: ${err}`)
}

//  shell 命令执行
try{
    shell.config.execPath = shell.which('node').toString()
}catch(err){
    log.error(`Initing Shelljs: ${err}`)
}

//  用户目录
var usrdir = {
    rundir: __dirname,
    home: process.env.USERPROFILE || process.env.HOME,
}
usrdir.usrdir = path.join(usrdir.home, '.ayase')
if(!fs.existsSync(usrdir.usrdir)){
    log.warn(`Initing User Directory: Does not exist`)
    try{
        fs.mkdirSync(usrdir.usrdir)
    }catch(err){
        log.error(`Creating User Directory: ${err}`)
    }
}
usrdir.rendercache = path.join(usrdir.usrdir, 'rendercache')
usrdir.settings = path.join(usrdir.usrdir, 'settings')
usrdir.templates = path.join(usrdir.rundir, 'templates')

// 设置项

try{
    const settings = require('./settings.js')
    var LocalSettings = new settings.LocalSettings(usrdir.settings)
    LocalSettings.loadFfs()
}catch(err){
    log.error(`Initing Settings Profile: ${err}`)
}

// 本地数据缓存及XHL
var localNoticeCache = {
    LatestUpdateTime: 0,    /*本地保存的 服务端 最新更新时间 JSON*/
    LatestData: {},         /*本地保存的 最新数据（通知列表）*/
    GetDataLock: false,     /*刷新操作 锁定*/
    // 获取最新更新时间用的XHL
    LUT_XHR: new XMLHttpRequest(),
    // 获取数据用的XHL
    LDT_XHR: new XMLHttpRequest(),
    // 用于显示连接的详细状态
    LSTAT: {
        type: null,
        status: null,
        descr: null
    },
    /* 
        用于保留上一次更新时LocalSettings.settings中noDisturb的值，
        在该值不等于settings中的值时执行FreshNoticeBar()，
        以在勿扰模式关闭后推送被屏蔽的通知
     */
    noDisturb: LocalSettings.settings.noDisturb.enable
}

//  通知

//      通知侧边栏：数组
//      数组元素为Notice对象
var noticeBar = []

//  已读通知UUID数组及路径
//var readAlready = []
var readAlready = {
    dir: usrdir.rendercache,
    list: [],
    //      写入
    save2fs: function(){
        try{
            if(!fs.existsSync(this.dir)){
                log.warn(`Writing readAlredy Cache: ${this.dir} does not exist`)
                try{
                    fs.mkdirSync(this.dir)
                }catch(err){
                    log.error(`Creating rendercache Directory: ${err}`)
                }
            }else{
                for(var a = 0; a < this.list.length; a++){
                    try{
                        shell.touch(path.join(this.dir, `${this.list[a]}.readAlready`))
                        log.info(`Wrote readAlready Cache.`)
                    }catch(err){
                        log.error(`Writing readAlredy Cache: ${err}`)
                    }
                }
            }
        }catch(err){
            log.error(`Writing readAlredy Cache: ${err}`)
        }        
    },
    //      readAlready 从文件系统读取
    loadFfs: function(){
        if(!fs.existsSync(this.dir)){
            log.warn(`Loading readAlredy Cache: ${this.dir} does not exist`)
            fs.mkdirSync(this.dir)
            this.save2fs()
        }else{
            try{
                let tmp = shell.ls(path.join(this.dir))
                this.list.length = 0
                for(var a = 0; a < tmp.length; a++){
                    let x = tmp[a].split('.')
                    if(x[1] == 'readAlready'){
                        if(isUUID(x[0])){
                            this.list.push(x[0])
                        }
                        else{
                            try{
                                shell.rm(path.join(this.dir, tmp[a]))
                                log.warn(`Loading Cache readAlready: Detected an invalid object ${x[0]}, removing`)
                            }catch(err){
                                var title = 'Loading Cache readAlredy'
                                var content = title + ': '+err
                                log.error(content)
                                dialog.error({title: "title", content: content})
                            }
                        }
                    }
                }
                this.sync()
            }catch(err){
                if(err){
                    var title = 'Loading Cache readAlredy'
                    var content = title + ': '+err
                    log.error(content)
                    dialog.showErrorBox({title: "title", content: content})
                }
            }
        }
    }, 
    //      同步reaadAlready与noticeBar
    sync: function(){
        try{
            var saveInneed = false            
            //  去重、去空
            for(var c = 0, lenc = this.list.length; c < lenc; c++){
                for(var d = 0, lend = this.list.length; d < lend; d++){
                    if(c != d && this.list[c] == this.list[d]){
                            delete(this.list[d])
                    }
                }
            }
            this.list = this.list.filter(function(u){
                return u && u.trim()
            })
            //  应用至noticeBar数组
            for(var a = 0; a < noticeBar.length; a++){
                if(this.list.includes(noticeBar[a].uuid))noticeBar[a].read = true
            }
            if(saveInneed)this.save2fs()
        }catch(err){
            log.error(`Syncing readAlready Cache: ${err}`)
        }
    }
}
//  通知：前端模板
const notifTemplate = require('./templates.js').notifTemplate

//  抓取通知列表
GetDataFromRemote()

