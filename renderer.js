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

setTimeout(async function(){
    $('#loading').fadeOut()
    $('#main-wrapper').fadeIn()
}, 1000)


// 内建函数

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

//  新窗口
function NewWin(url, args = ""){
    window.open(url, '_blank', 'minHeight=768,minWidth=1024,autoHideMenuBar=true,nodeIntegration=true,icon=favicon.ico' + args)
}

//  去除HTML标签
//  https://blog.csdn.net/xuzengqiang2/article/details/41979733
function delHtmlTag(str){
    return str.replace(/<[^>]+>/g,"");//去掉所有的html标记
} 

//  UUID生成函数
//  https://blog.csdn.net/NancyFyn/article/details/115897864
function UUID() {
    var s = []
    var hexDigits = '0123456789abcdef'
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    }
    s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-'
  
    var uuid = s.join('')
    return uuid
  }

//  通知

//      通知栏：数组
//      数组元素为Notice对象
var noticeBar = []

//      通知：对象
function Notice(title, content, publisher, level, pubDate, uuid, description = delHtmlTag(content)){
    this.title = title; /* 标题 */
    this.content = content; /* 正文 */
    this.description = description; /* 描述 */ 
    this.publisher = publisher; /* 发布者 */
    this.pubDate = pubDate; /* 发布时间（Date对象） */
    this.uuid = uuid; /* （远端服务器）UUID */
    this.level = level; /* 优先级 */
    this.id = noticeBar.length /* （本机）ID */
    noticeBar[this.id] = this
    //FreshNoticeBar()
}
Notice.prototype = {
    read: false,
    // 阅读器
    Read: function(){
        var readerTemplate = require('./templates.js').readerTemplate

        readerTemplate = readerTemplate.replaceAll('{{ title }}', this.title)
        readerTemplate = readerTemplate.replaceAll('{{ content }}', this.content)
        readerTemplate = readerTemplate.replaceAll('{{ pubDate }}', FormatDate(this.pubDate, '%Y-%m-%d %H:%M') + '')
        readerTemplate = readerTemplate.replaceAll('{{ publisher }}', this.publisher)
        readerTemplate = readerTemplate.replaceAll('{{ level }}', this.level)

        let filename = Math.round(Math.random() * 131072) + '.tmp.html'
        this.read = true
        fs.writeFile(filename, readerTemplate, { flag: 'w+' }, async function(err){
            if (err) throw err;

            NewWin(filename)
            setTimeout(function(){fs.rm(filename, undefined, (err)=>undefined)},200)
            
        })

    }

}


//      通知：前端模板
const notifTemplate = require('./templates.js').notifTemplate

//      从模板生成.card .notify片段
//          notice: Notice对象
//          eleNum: 元素下标
function GenNoticeCard(notice){
    var temporyTemplate = notifTemplate;
    
    temporyTemplate = temporyTemplate.replaceAll('{{ uuid }}', notice.uuid)
    temporyTemplate = temporyTemplate.replaceAll('{{ title }}', notice.title)
    temporyTemplate = temporyTemplate.replaceAll('{{ description }}', notice.description)
    temporyTemplate = temporyTemplate.replaceAll('{{ pubDate }}', FormatDate(notice.pubDate, '%Y-%m-%d %H:%M'))
    temporyTemplate = temporyTemplate.replaceAll('{{ publisher }}', notice.publisher)
    temporyTemplate = temporyTemplate.replaceAll('{{ id }}', notice.id)
    var unreadClassAttr = "unread"
    if(notice.read)unreadClassAttr = ""
    temporyTemplate = temporyTemplate.replaceAll('{{ unread }}', unreadClassAttr)

    return temporyTemplate
}

//      通知栏刷新：函数
function FreshNoticeBar(){

    $('.notice').remove()

    let temporyNoticeBar = []
    for(var a = noticeBar.length; a >= 0; a--){
        temporyNoticeBar[noticeBar.length - a] = noticeBar[a]
    }

    //      去除非object数据（如"undefined"）
    //      （参考https://blog.csdn.net/qq_33769914/article/details/82380957）
    for(var i = 0; i < noticeBar.length; i++) {
        if(typeof(noticeBar[i]) != "object") {
            delete(noticeBar[i])
            noticeBar.splice(i,1);
            i = i - 1;
        }
    }

    for(var i = 0; i < temporyNoticeBar.length; i++) {
        if(typeof(temporyNoticeBar[i]) != "object") {
            delete(temporyNoticeBar[i])
            temporyNoticeBar.splice(i,1);
            i = i - 1;
        }
    }
    
    setTimeout(function () {
        temporyNoticeBar.forEach(function (currentValue, index) {
            $('#main-list').append(GenNoticeCard(currentValue, index));
            $('#main-list li .card').slideDown()
            if(currentValue.level == "A" && currentValue.read == false){
                currentValue.Read()
                $('#main-list li [id="' + currentValue.id +'"]').removeClass('unread')
            }
        });
    }, 100)


}

// 时钟
setInterval(
    function(){
        var Now = new Date();
        var D = FormatDate(Now);
        var T = FormatDate(Now, "%H:%M")

        $('#clock .c_time').html(T)
        $('#clock .c_date').html(D)
},500)


//  #main-wrapper自动回归顶部
scrollbackflag = false
document.getElementById('main-list').onscroll = function(){
    if(!scrollbackflag){
        scrollbackflag = true
        idnwhat2name = setTimeout(function(){
                //以clock锚点为基准
                document.getElementById('clock').scrollIntoView({ behavior: 'smooth' });
                scrollbackflag = false
        } ,10000)
    }
}

// 主进程 IPC 通信 包装
function toMainTask(command, argsjson){
    const { ipcRenderer } = require('electron')
    var x = {"command": command, "argsjson": argsjson}

    ipcRenderer.send('asynchronous-message', JSON.stringify(x))
}

// （主进程）调出设置
function settings(){
    toMainTask('settings')
}

// （临时）设置
//  serverURL：服务器URL
//  token：（16位）16进制令牌
var LocalSettings = {
    serverURL: 'http://127.0.0.1:8888/',
    token: "40234AC45CFEADDE"
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
    autoRefresh: undefined
}

// 服务器路由：
//  /:token/LatestUpdateDate -> (json)最新发布时间 <UNIX时间戳>
//  /:token/NoticesList -> (json)适用于本机的所有通知列表


async function GetDataFromRemote(){
    // 取消先前设定的 下一次自动刷新的 延迟
    clearTimeout(localNoticeCache.autoRefresh)

    // 对话框生成
    // （需要切换为 导航栏状态显示）
    function ConnErr(xhr, status, error){
        var errmsg = "{{ ErrName }} \nStatus: {{ Status }}"
        var statN = "Connection Error"
        if(status == 'error')statN = xhr.statusText
        else statN = status
        errmsg = errmsg.replace("{{ ErrName }}", statN)
        errmsg = errmsg.replaceAll("{{ Status }}", xhr.status)
        dialog.showErrorBox(statN, errmsg)

        // 连接错误、失败 的 自动刷新 （延迟10分钟）
        localNoticeCache.autoRefresh = setTimeout(function(){
            GetDataFromRemote()
        }, 600000)
    }

    // 防止重复操作
    if(!localNoticeCache.GetDataLock){
        localNoticeCache.GetDataLock = true

        // 获取 最新更新时间 以确定是否需要更新数据
        localNoticeCache.LUT_XHR = $.ajax({
            type: 'GET',
            url: LocalSettings.serverURL + '/' + LocalSettings.token + '/LatestUpdateDate',
            dataType: 'json',
            error: (xhr, status, error)=>{ConnErr(xhr, status, error)},
            success:function(data){
                if(localNoticeCache.LatestUpdateTime <= data.LatestUpdateDate){
                    localNoticeCache.LatestUpdateTime = data.LatestUpdateDate
                    fetchNoticeData()
                }
            },
            complete: function(){
                localNoticeCache.GetDataLock = false
            }
        })

    }


    function fetchNoticeData(){
        localNoticeCache.LDT_XHR =  $.ajax({
            type: 'GET',
            url: LocalSettings.serverURL + '/' + LocalSettings.token + '/NoticesList',
            dataType: 'json',
            error:  (xhr, status, error)=>{ConnErr(xhr, status, error)},
            success:async function(data){
                // 如果有更新的数据，则存入内存并将新的通知对象加入noticeBar数组
                //  **后期需要一个readAlready数组来保存已经阅读的通知的UUID**
                if(JSON.stringify(localNoticeCache.LatestData) != JSON.stringify(data)){
                    localNoticeCache.LatestData = data
                    // 逐条加入
                    localNoticeCache.LatestData.Notices.forEach(function(value, index){
                        var description = ""
                        if(value.description == undefined)description = delHtmlTag(value.content).slice(0, 30)
                        else description = value.description
                        new Notice(value.title, value.content, value.publisher, value.level, new Date(parseInt(value.pubDate)),  value.uuid, description)
                    })
                    FreshNoticeBar()
                }
                
                // 设定 下一次自动刷新
                localNoticeCache.autoRefresh = setTimeout(function(){
                    GetDataFromRemote()
                }, 10000)
            },
            
        })
    }
}

GetDataFromRemote()
