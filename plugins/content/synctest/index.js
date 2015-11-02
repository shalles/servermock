/**
 * 主要针对移动端测试同步命令  一个设备操作同时测试多个设备
 * @param  {[type]} parmas [description]
 * @return {[type]}        [description]
 */
function syncTest(parmas){
    var st = parmas.config.websocket.synctest;

    if(!st.open) return;

    var path = require('path'),
        utils = require('../../../lib/utils');

    var acceptExtname = st.exts || ['html', 'htm'],
        origin = (st.vpn || parmas.config.hostname) + ":" + parmas.config.port,
        cnt = parmas.cnt,
        ext = parmas.ext;

    if(utils.inArray(ext, acceptExtname)){
        console.log('[synctest loading]');
        var syncCommandTop = utils.readFile(path.join(__dirname, './lib/synccomm_top.min.js'));

        syncCommandTop = utils.simpleTemplate(syncCommandTop, origin);
            // syncCommandBottom = utils.readFile(path.join(__dirname, './lib/synccomm_bottom.min.js'));
        cnt = cnt.replace(/<head>/, '<head>\n<meta charset="UTF-8">\n<script>' + syncCommandTop + '</script>');
        // cnt = cnt.replace(/<\/body>/, '<script>' + syncCommandBottom + '</script>\n</body>');

        return cnt;
    }

}

module.exports = syncTest;