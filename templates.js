const fs = require('fs')
const log = require('electron-log')
const { dialog } = require('electron')


// 文件模板读取
function useTemplate(file, replacements = new Array){
  // replacements:
  //  e.g. replacements = [{key: 'target', value: 'replacement text for {{ target }}'}]
  //  target 在 .template 中是{{ target }}的格式
  try{
    file = path.join(__dirname, 'templates', file)
    var text = fs.readFileSync(file, {encoding: 'utf-8', flag: 'r'})

    replacements.push({key: '__dirname', value: __dirname})
    replacements.forEach(function(value, index){
      text = text.replaceAll(`{{ ${value.key} }}`, value.value)
    })
    return text
  }catch(err){
    log.error(`Reading Template ${file}: ${err}`)
    return null
  }
}

module.exports = {
  useTemplate
}