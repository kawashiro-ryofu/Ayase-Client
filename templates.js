const fs = require('fs')
const log = require('electron-log')
const { dialog } = require('electron')

//      阅读器模板
const readerTemplate = '<!DOCTYPE html>\n'+
'<head>\n'+
'    <meta charset="utf-8">\n'+
'    <link href="./styles.css" rel="stylesheet">\n'+
'    <link href=\'node_modules/font-awesome/css/font-awesome.min.css\' rel="stylesheet">\n'+
'    <title>{{ title }} - Ayase</title>\n'+
'</head>\n'+
'<body>\n'+
'    <style>\n'+
'        body{\n'+
'            overflow-y: auto;\n'+
'            overflow-x: inherit;\n'+
'        }\n'+
'        #main-wrapper{\n'+
'            display: block;\n'+
'            padding-top: 30px;\n'+
'            padding-left: 25vh;\n'+
'            padding-right: 25vh;\n'+
'            padding-bottom: 100px;\n'+
'            user-select: text\n'+
'        }  \n'+
'        @media only screen and (max-width: 750px) {\n'+
'            #main-wrapper{\n'+
'                display: block;\n'+
'                padding-top: 30px;\n'+
'                padding-left: 5vh;\n'+
'                padding-right: 5vh;\n'+
'                padding-bottom: 100px;\n'+
'            }  \n'+
'        }\n'+
'    </style>\n'+
'    <div id="main-wrapper">\n'+
'        <div id="read_title">\n'+
'            <h1>{{ title }}</h1>\n'+
'        </div>\n'+
'        <div id="read_notic_info" class="notic_info">\n'+
'            <span class="read_notic_pubDate"><i class="fa fa-calendar-o" aria-hidden="true"></i> {{ pubDate }}</span> \n'+
'            <span class="read_notic_publisher"><i class="fa fa-user" aria-hidden="true"></i> {{ publisher }}</span>\n'+
'            <span class="read_notic_level"><i class="fa fa-dot-circle-o" aria-hidden="true"></i> {{ level }}</span>\n'+
'        </div>\n'+
'        <hr>\n'+
'        <div id="read_notic_content">{{ content }}</div>\n'+
'    </div>\n'+
'</body>\n'

// 文件模板读取
function useTemplate(file, replacements = new Array){
  // replacements:
  //  e.g. replacements = [{key: 'target', value: 'replacement text'}]
  try{
    file = path.join(__dirname, 'templates', file)
    var text = fs.readFileSync(file, {encoding: 'utf-8', flag: 'r'})

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
  readerTemplate,
  useTemplate
}