//      侧边栏卡片模板（Notice）
const notifTemplate = '<li>\
<div class="card notice {{ unread }}" uuid="{{ uuid }}" id="{{ id }}" style="display:none">\
  <div class="notic_title"><i class="fa fa-bell" aria-hidden="true"></i> {{ title }}</div>\
  <div class="notic_descr">{{ description }}</div>\
  <div class="notic_info">\
    <i class="fa fa-calendar-o" aria-hidden="true"></i><div>{{ pubDate }}</div><br>\
    <i class="fa fa-user" aria-hidden="true"></i><div>{{ publisher }}</div>\
  </div>\
  <div class="notic_view">\
    <div><i class="fa fa-arrow-left" aria-hidden="true"></i></div>\
  </div>\
  <script>\
    $(\'[id="{{ id }}"]\').on("click", function(){\
        $(\'[id="{{ id }}"] .notic_view\').fadeIn();\
        setTimeout(function(){$(\'[id="{{ id }}"] .notic_view\').fadeOut()}, 3000);\
        noticeBar[{{ id }}].Read();\
        $(\'[id="{{ id }}"]\').removeClass(\'unread\')\
    })\
  </script>\
</div>\
</li>'

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


module.exports = {
    notifTemplate,
    readerTemplate
}