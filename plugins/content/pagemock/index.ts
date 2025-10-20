import * as fs from 'fs';
import * as vm from 'vm';
import * as path from 'path';
import * as mockjs from 'mockjs';
import php from './lib/php';
import vmjs from './lib/vm';

// 导入类型定义
export interface Utils {
  extend: (...args: any[]) => any;
  log: (...args: any[]) => void;
  chalk: {
    green: (text: string) => string;
    red: (text: string) => string;
    yellow: (text: string) => string;
  };
  MIME: Record<string, string>;
  readJson: (path: string) => any;
  inArray: (item: any, array: any[]) => boolean;
}

export interface PluginConfig {
  __utils: Utils;
  basepath?: string;
  acceptExts?: string[];
  mockrc?: string;
}

export interface Params {
  ext: string;
  filepath: string;
  cnt: string;
}

interface Plugin {
  excute: (params: Params) => string | void;
  getMockJsonData: (jsonpath: string) => any;
  init: (config: PluginConfig) => void;
  _basepath?: string;
  _acceptExts?: string[];
}

const plugin: Plugin = {} as Plugin;
let utils: Utils;

plugin.excute = function(params: Params) {
  if (plugin._acceptExts && utils.inArray(params.ext, plugin._acceptExts)) {
    const jsonpath = plugin._basepath 
      ? path.join(plugin._basepath, path.basename(params.filepath).slice(0, -params.ext.length))
      : params.filepath.slice(0, -params.ext.length);
    
    const jsonData = plugin.getMockJsonData(jsonpath);

    if (jsonData) {
      utils.log(utils.chalk.green("page mock start with extname: ") + utils.chalk.yellow(params.ext));
      switch(params.ext) {
        case 'vm':
          // 类型断言确保vmjs有render方法
          return (vmjs as any).render(params.cnt, jsonData);
        case 'jsp':
          break;
        case 'php':
        case 'html':
        default:
          const sandbox = utils.extend(php, jsonData, true);
          const regx = /<\?(?:(?:php\s+echo)|=)\s*(.+);*\s*\?>/g;

          return params.cnt.replace(regx, function($0, $1) {
            let re;

            $1 = $1.replace(/"\s*(\.)\s*(\$[\w\d_]+)\s*(?:(\.)\s*")*/g, function($0: string, $1: string, $2: string, $3: string) {
              return '" + ' + $2 + ($3 ? ' + "': '');
            });

            const match = $1.match(/\$[\w_]+/g) || [];
            for (const mi of match) {
              if (sandbox[mi] === undefined) {
                sandbox[mi] = '';
              }
            }
            
            try {
              re = vm.runInNewContext($1, sandbox);
            } catch (err) {
              utils.log(err);
            }
            return re;
          });
      }
    }
  }
};

plugin.getMockJsonData = function(jsonpath: string) {
  try {
    return utils.readJson(jsonpath + 'json') || 
           mockjs.mock(utils.readJson(jsonpath + 'mjson') || {});
  } catch (err) {
    utils.log(utils.chalk.red(`plugin-pagemock parse mockdata file ${utils.chalk.yellow(jsonpath)}.json or .mjson failed`), err);
  }
  return null;
};

function initMockRandom(mockrcpath: string) {
  const resolvedPath = path.isAbsolute(mockrcpath) 
    ? mockrcpath 
    : path.resolve(plugin._basepath || '', mockrcpath);
    
  utils.log(utils.chalk.green("plugin-pagemock mockrcpath:\n"), resolvedPath);

  const mockRandom = fs.existsSync(resolvedPath) 
    ? JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) 
    : {};

  for (const i in mockRandom) {
    if (mockRandom.hasOwnProperty(i)) {
      const randomData: any = {};
      const name = i.toLowerCase();
      const list = name + 's';
      
      (function(key, listKey, nameKey) {
        randomData[listKey] = mockRandom[key];
        randomData[nameKey] = function(data: any) {
          return this.pick(this[listKey]);
        };

        mockjs.Random.extend(randomData);
        utils.log(utils.chalk.green("plugin-pagemock Random add:\n"), randomData);
      })(i, list, name);
    }
  }
}

plugin.init = function(config: PluginConfig) {
  utils = config.__utils;
  plugin._basepath = config.basepath && path.resolve(process.cwd(), config.basepath);
  plugin._acceptExts = config.acceptExts || ['php', 'html', 'vm', 'jsp'];

  if (config.mockrc) {
    initMockRandom(config.mockrc);
  }
};

export default plugin;