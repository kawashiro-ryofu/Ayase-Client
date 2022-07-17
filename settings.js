// 设置

//  settings
//    connections   连接设置
//      serverURL：服务器URL
//      token：（16位）16进制令牌
//    no-disturb    免打扰
//      enable:     (bool)启用

var LocalSettings = {
    // 设置对象
    settings: {
        connections: {
            serverURL: null,
            token: null
        },
        noDisturb:{
            enable: false
        },
        general: {
            customTitle: "Ayase"
        }
    },
    // 配置文件位置
    file: path.join(__dirname, 'settings', "settings.ayase.json"),
    // 从配置文件中读取
    loadFfs: function(){
        if(!fs.existsSync(this.file)){
            log.error(`Loading Configuration: Profile does not exist`)
            // To Do 配置引导
        }else{
            try{
                var f = fs.readFileSync(this.file, {encoding: 'utf-8', flag: 'r'})
                var outdat = JSON.parse(f.toString())
                this.settings = outdat.settings
                log.info(`Loaded Configuration`)
            }catch(err){
                if(err){
                    log.error('Loading Configuration: '+err)
                }
            }
        }
    },
    save2fs: async function(){
            console.log(this.file)
            if(!fs.existsSync(path.parse(this.file).dir)){
                log.warn(`Writing Configuration: ${path.parse(this.file)} does not exist`)
                fs.mkdirSync(path.parse(this.file).dir)
                this.save2fs()
            }else{
                //  此处感谢Simon的建议，尽管未得到采纳
                fs.writeFile(this.file, 
                    JSON.stringify({settings: this.settings}),        
                    'utf-8',
                    function(error){
                        if(error)log.error(`Writing Configuration: ${error}`)
                        else log.info(`Wrote Configuration: ${LocalSettings.file}`)
                    }
                )
            }
        }
}

module.exports = {
    LocalSettings
}