/**
 * 主要针对移动端测试同步命令  一个设备操作同时测试多个设备
 * @param  {[type]} parmas [description]
 * @return {[type]}        [description]
 */

var plugin = {},
    path = require('path'),
    utils = require('../../../lib/utils'),
    acceptExtname,
    origin, protocol;

plugin.excute = function (parmas){
    
    if(utils.inArray(parmas.ext, acceptExtname)){
        console.log('[synctest loading]');
        var syncCommandTop = utils.readFile(path.join(__dirname, './lib/synccomm_top.min.js'));

        syncCommandTop = utils.simpleTemplate(syncCommandTop, origin);
            // syncCommandBottom = utils.readFile(path.join(__dirname, './lib/synccomm_bottom.min.js'));
        parmas.cnt = parmas.cnt.replace(/<head>/, '<head>\n<meta charset="UTF-8">\n<script>' + syncCommandTop + '</script>');
        // cnt = cnt.replace(/<\/body>/, '<script>' + syncCommandBottom + '</script>\n</body>');

        return parmas.cnt;
    }
}

plugin.init = function(config){
    var serverConfig = config.__serverConfig;
    acceptExtname = config.exts || ['html', 'htm'];
    origin = (config.vpn || serverConfig.hostname) + ":" + serverConfig.port;
    protocol = serverConfig.protocol
}

module.exports = plugin;