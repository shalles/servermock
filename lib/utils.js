var fs = require('fs'),

    path = require('path');

var cwd = process.cwd(),
    flagWin = /[a-zA-Z]:/.test(cwd);

function getUserDir() {
    var regx = flagWin ? '/\w:\\Users\\\w+/' : /\/Users\/\w+/,
        match = cwd.match(/\/Users\/\w+/g);

    return match ? match[0] : '';
}

function log(){
    console.log("------------------servermock log----------------\n", 
                    Array.prototype.join.call(arguments, '\n'));
}

function extend(){
    var iterator = {
        stack: [],
        reset: function(){
            stack = [];
        },
        watch:function(co, cb){ // co对象或数组 这里不做额外判断
            if(this.stack.indexOf(co) > -1) return;
            this.stack.push(co), cb();
        }
    };

    function classof(o) {
        return Object.prototype.toString.call(o).slice(8,-1);
    }

    function copy(to, from, deep){
        for(var i in from){
            var fi = from[i];
            if(!deep){
                if(fi !== undefined){
                    to[i] = fi;
                }
            }else{
                var classFI = classof(fi), 
                    isArr = classFI === 'Array', 
                    isObj = classFI === 'Object';
                if(isArr || isObj){
                    var ti = to[i],
                        tiC = classof(ti);

                    isArr ? tiC !== 'Array' && (ti = []) : 
                            tiC !== 'Object' && (ti = {});

                    iterator.watch(fi, function(){
                        copy(ti, fi, deep);
                    })
                }else{
                    if(fi !== undefined){
                        to[i] = fi;
                    }
                }
            }
        }
    }
    
    var re, len = arguments.length, deep, i;
    deep = arguments[len-1] === true ? (len--, true): false;
    arguments[0] === true ? (i = 2, re = arguments[1]): (i = 0, re = {});
    for(i; i < len; i++){
        classof(arguments[i]) === 'Object' && copy(re, arguments[i], deep);
    }

    return re;
}

var MIME = {
    "css": "text/css",
    "gif": "image/gif",
    "html": "text/html",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml"
};

function simpleTemplate(str, data) {

    if (!str || !data) return '';

    var type = Object.prototype.toString.call(data),
        strRes = '',
        regex = /\{\{\s*(\w+)\s*\}\}/g;

    switch (type) {
        case '[object Array]':
            for (var i = 0, len = data.length; i < len; i++) {
                strRes += simpleTemplate(str, data[i]);
            }
            break;
        case '[object Object]':
            strRes = str.replace(regex, function ($0, $1) {
                return data[$1];
            });
            break;
        case '[object String]':
            strRes = str.replace(regex, data);
            break;
        default:
            strRes = '';
    }

    return strRes;
}

function readFile(filepath){
    return fs.existsSync(filepath) ? fs.readFileSync(filepath).toString() : "";
}

function renderPage(pagepath, data){
    pagepath = path.join(__dirname, pagepath);
    return simpleTemplate(readFile(pagepath), data)
}

function readJson(filepath){
    var json = '', file = '';
    if(fs.existsSync(filepath)){
        try{
            file = readFile(filepath);
            json = JSON.parse(file);
            log("open json file:" + filepath, file);
        } catch(e){
            log("error: json file--", filepath, e);
        }
    }
    return json;
}

function inArray(va, arr){
    return arr.indexOf(va) > -1;
}

module.exports = {
    log: log,
    extend: extend,
    MIME: MIME,
    inArray: inArray,
    readFile:readFile,
    readJson:readJson,
    getUserDir: getUserDir,
    renderPage: renderPage,
    simpleTemplate:simpleTemplate
}