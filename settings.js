// 设置

//  settings
//    connections   连接设置
//      serverURL：服务器URL
//      token：（16位）16进制令牌
//    no-disturb    免打扰
//      enable:     (bool)启用
class LocalSettings{
    constructor(filepath){
        this.file = path.join(filepath, 'settings.ayase.json'),
        this.settings = {
            connections: {
                serverURL: null,
                token: null
            },
            noDisturb:{
                enable: false,
                cron: {
                    on: [],
                    off: []
                }
            },
            general: {
                customTitle: "Ayase",
                custonNotifyRingtonePath: "",
            }
        }
    }
    loadFfs = function(){

        if(!fs.existsSync(this.file)){
            log.error(`Loading Configuration: Profile does not exist`)
            // To Do 配置引导
            //  写入一个初始配置文件
            this.save2fs()
        }else{
            try{
                var f = fs.readFileSync(this.file, {encoding: 'utf-8', flag: 'r'})
                var outdat = JSON.parse(f.toString())

                //  fixBUG: 配置文件隔代兼容问题
                //this.settings = Object.assign(this.settings, outdat.settings)
                this.settings = {
                    connections: {
                        serverURL: outdat.settings.connections.serverURL ?? this.settings.connections.serverURL,
                        token: outdat.settings.connections.token ?? this.settings.connections.token
                    },
                    noDisturb:{
                        enable: outdat.settings.noDisturb.enable ?? this.settings.noDisturb.enable,
                        cron: {
                            on: outdat.settings.noDisturb.cron.on ?? this.settings.noDisturb.cron.on,
                            off: outdat.settings.noDisturb.cron.off ?? this.settings.noDisturb.cron.off
                        }
                    },
                    general: {
                        customTitle: outdat.settings.general.customTitle ?? this.settings.general.customTitle,
                        custonNotifyRingtonePath: outdat.settings.general.custonNotifyRingtonePath ?? this.settings.general.custonNotifyRingtonePath,
                    }
                }
            }catch(err){
                if(err){
                    log.error('Loading Configuration: '+err)
                }
            }
        }
    }
    save2fs = async function(){
        //console.log(this.file)
        if(!fs.existsSync(path.parse(this.file).dir)){
            log.warn(`Writing Configuration: ${path.parse(this.file)} does not exist`)
            fs.mkdirSync(path.parse(this.file).dir)
            this.save2fs()
        }else{
            //  此处感谢来自simonShiki的建议
            fs.writeFile(this.file, 
                JSON.stringify({settings: this.settings}, null, 4),        
                'utf-8',
                function(error){
                    if(error)log.error(`Writing Configuration: ${error}`)
                    else log.info(`Wrote Configuration`)
                }
            )
        }
    }
}

module.exports = {
    LocalSettings
}