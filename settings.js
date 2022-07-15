// 设置

//  settings
//    connections   连接设置
//      serverURL：服务器URL
//      token：（16位）16进制令牌
//    no-disturb    免打扰
//      enable:     (bool)启用

var LocalSettings = {
    // 设置对象
    settings: null,
    // 配置文件
    dir: __dirname,
    file: "settings.ayase.json",
    // 从配置文件中读取
    loadFfs: function(){
        if(!fs.existsSync(this.dir)){
            log.warn(`Loading Configuration: Profile does not exist`)
            fs.mkdirSync(this.dir)
            // To Do 配置引导
        }
        else if(!fs.existsSync(this.file)){
            log.warn(`Loading Configuration: Profile does not exist`)
            // To Do 配置引导
        }
        else{
            try{
                var f = fs.readFileSync(this.file, {encoding: 'utf-8', flag: 'r'})
                log.info(`Loaded Configuration`)
                var outdat = JSON.parse(f.toString())
                this.settings = outdat.settings

                if(this.settings.general.customTitle.length <= 0 || this.settings.general.customTitle != null)$('h1.title').html(xss(this.settings.general.customTitle))
            }catch(err){
                if(err){
                    log.error('Loading Configuration: '+err)
                }
            }
            
        }
    },
    save2fs: function(){
            if(!fs.existsSync(this.dir)){
                log.warn(`Writing Configuration: ${this.dir} does not exist`)
                fs.mkdirSync(this.dir)
                this.save2fs()
            }else{
                fs.writeFile(this.file, 
                    JSON.stringify(this.settings),        
                    'utf-8',
                    function(error, f = this.file){
                        if(error)log.error(`Writing Configuration: ${error}`)
                        else log.info(`Wrote Configuration: ${f}`)
                    }
                )
            }
        }
}

module.exports = {
    LocalSettings
}