function extend(){
    function classof(o) {
        // if (o === null) return "Null";
        // if (o === undefined) return "Undefined";
        return Object.prototype.toString.call(o).slice(8,-1);
    }
    function copy(to, from, deep){
        for(var i in from){
            var fi = from[i];
            if(deep && (!fi.nodeType || fi !== window)){
                var classFI = classof(fi), 
                    isArr = classFI === 'Array', 
                    isObj = classFI === 'Object';
                if(isArr || isObj){
                    isArr && (to[i] = []);
                    isObj && (to[i] = {});

                    copy(to[i], from[i], deep);
                }
            }
            if(from[i] !== undefined){
                to[i] = from[i];
            }
        }
    }

    var re = {}, len = arguments.length, deep;
    deep = arguments[len-1] === true ? (len--, true): false
    for(var i = 0; i < len; i++){
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

module.exports = {
    extend: extend,
    MIME: MIME

}