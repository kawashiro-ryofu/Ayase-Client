const path = require('path')
const fs = require('fs')

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

module.exports = {
	usrdir
}