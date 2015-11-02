var fs = require('fs'),
    php = require('phpjs'),
    path = require('path');


// php = utils.extend(php, {
//     $$regx: /<\?(?:(?:php\s+echo)|=)\s*([^;\n>]|[\w".$\d _-])+;*\s*\?>/g,
//     is_null: function(va){
//         return va === null || va === undefined;
//     },
//     empty: function(va){
//         return !va;
//     }
// }, true);

// function includeFile(filename) {
//     filename = path.join(".", "php", filename);
//     return pagejs.compileFile(filename);
// }

// php.Parse = function(content){

//     var result = '',
//         phpParma = {
//             echo: function(text){
//                 result += text;
//             },
//             _includeFile: includeFile
//         }
//     pagejs.compile(content)(phpParma);

//     return result;
// }

module.exports = php; 