var fs = require('fs'),
    chalk = require('chalk'),
    path = require('path'),
    exec = require('child_process').exec;

var cwd = process.cwd(),
    flagWin = /[a-zA-Z]:/.test(cwd);

function getUserDir() {

    if(process.HOME) return process.HOME;

    var regx = flagWin ? '/\w:\\Users\\\w+/' : /\/Users\/\w+/,
        match = cwd.match(/\/Users\/\w+/g);

    return match ? match[0] : '';
}

function log(){
    
    var arr = [].slice.call(arguments, 0);
    arr.unshift(chalk.cyan("servermock log\t"));
    console.log.apply(this, arr);
}

function classof(o) {
    return Object.prototype.toString.call(o).slice(8,-1);
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
                    var tiC = classof(to[i]);

                    isArr ? tiC !== 'Array' && (to[i] = []) : 
                            tiC !== 'Object' && (to[i] = {});

                    iterator.watch(fi, function(){
                        copy(to[i], fi, deep);
                    })
                }else{
                    if(fi !== undefined){
                        to[i] = fi;
                    }
                }
            }
        }
    }

    var re, len = arguments.length, deep, i = 0;

    deep = arguments[i] === true ? (i++, true): false;
    re   = arguments[i++];

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

var command = function(){
    if(flagWin){
        return {
            rm: 'rd',
            mv: 'move',
            mk: 'md'
        }
    }
    return {
            rm: 'rm',
            mv: 'mv',
            mk: 'mk'
        }
}

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
    return fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8').toString() : "";
}

function renderPage(pagepath, data){
    pagepath = path.join(__dirname, pagepath);
    return simpleTemplate(readFile(pagepath), data)
}

function readJson(filepath){
    var json = '', content = '';
    if(fs.existsSync(filepath)){
        try{
            content = readFile(filepath).replace(/[^:]\/\/.*\n/g, '\n');
            json = JSON.parse(content);
            //log("open json file: " + filepath, content);
        } catch(e){
            log(chalk.red("error: json file error:"), filepath, e);
        }
    }
    return json;
}

function inArray(va, arr){
    return arr.indexOf(va) > -1;
}

function timeZero(num){
    return num > 9 ? num : '0' + num;
}

function timeFormat(time){
    return time.getFullYear() + "-" + timeZero(time.getMonth()+1) + "-" + timeZero(time.getDate()) + 
            ' ' + timeZero(time.getHours()) + ':' + timeZero(time.getMinutes()) + ':' + timeZero(time.getSeconds());
}

function mkPath(src){
    var paths = src.split(/[\\\/]/),
        path = src[0] !== '\/' ? (src[0] == '~' ? process.HOME : '') : '\/';

    for(var i = 0, len = paths.length; i < len; i++){
        if(!fs.existsSync(path += paths[i] + '\/')){
            fs.mkdirSync(path);
        }
    }
}

function excute(cmd, cb, msg){
    exec(cmd, function(error, stdout, stderr){
        if(error){
            log(msg && msg, error);
            return;
        }
        cb && cb(stdout, stderr);
    })
}

module.exports = {
    log: log,
    MIME: MIME,
    chalk: chalk,
    cmd: command(),
    mkPath: mkPath,
    extend: extend,
    excute: excute,
    isWin: flagWin,
    inArray: inArray,
    readFile:readFile,
    readJson:readJson,
    getUserDir: getUserDir,
    renderPage: renderPage,
    timeFormat: timeFormat,
    simpleTemplate:simpleTemplate
}