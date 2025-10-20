import * as fs from 'fs';
import * as path from 'path';
import utils from '../../lib/utils';

/**
 * 插件命令处理函数
 * @param params 命令行参数
 */
function pluginCommand(params: string[]): void {
  const pluginsDir = path.join(__dirname, '../../../plugins');
  
  // 解析命令
  const command = params[0];
  const pluginName = params[1];
  
  switch (command) {
    case 'list':
      // 列出所有插件
      listPlugins(pluginsDir);
      break;
    case 'install':
      // 安装插件
      if (!pluginName) {
        utils.log(utils.chalk.red('请指定插件名称'));
        return;
      }
      installPlugin(pluginName);
      break;
    case 'uninstall':
      // 卸载插件
      if (!pluginName) {
        utils.log(utils.chalk.red('请指定插件名称'));
        return;
      }
      uninstallPlugin(pluginName);
      break;
    case 'enable':
    case 'disable':
      // 启用/禁用插件
      if (!pluginName) {
        utils.log(utils.chalk.red('请指定插件名称'));
        return;
      }
      togglePluginStatus(pluginName, command === 'enable');
      break;
    default:
      // 显示帮助
      showPluginHelp();
      break;
  }
}

// 列出所有插件
function listPlugins(pluginsDir: string): void {
  try {
    const types = fs.readdirSync(pluginsDir).filter(dir => {
      return fs.statSync(path.join(pluginsDir, dir)).isDirectory();
    });
    
    if (types.length === 0) {
      utils.log(utils.chalk.yellow('没有找到任何插件'));
      return;
    }
    
    utils.log(utils.chalk.green('可用插件列表:'));
    
    for (const type of types) {
      utils.log(`\n${type} 类型:`);
      const typeDir = path.join(pluginsDir, type);
      
      try {
        const plugins = fs.readdirSync(typeDir).filter(plugin => {
          return fs.statSync(path.join(typeDir, plugin)).isDirectory();
        });
        
        if (plugins.length === 0) {
          utils.log('  - 无');
        } else {
          for (const plugin of plugins) {
            utils.log(`  - ${plugin}`);
          }
        }
      } catch (err) {
        utils.log(utils.chalk.red(`读取 ${type} 目录失败: ${err}`));
      }
    }
  } catch (err) {
    utils.log(utils.chalk.red(`读取插件目录失败: ${err}`));
  }
}

// 安装插件
function installPlugin(pluginName: string): void {
  utils.log(utils.chalk.yellow(`安装插件 ${pluginName}...`));
  utils.log(utils.chalk.red('插件安装功能暂未实现'));
}

// 卸载插件
function uninstallPlugin(pluginName: string): void {
  utils.log(utils.chalk.yellow(`卸载插件 ${pluginName}...`));
  utils.log(utils.chalk.red('插件卸载功能暂未实现'));
}

// 切换插件状态
function togglePluginStatus(pluginName: string, enable: boolean): void {
  const configPath = path.join(process.cwd(), 'sm.config');
  const config = utils.readJson(configPath);
  
  if (!config) {
    utils.log(utils.chalk.red('未找到配置文件 sm.config'));
    return;
  }
  
  config.plugins = Array.isArray(config.plugins) ? config.plugins : [];
  let plugin = utils.findObjectInArray(config.plugins, 'name', pluginName);
  
  if (!plugin) {
    plugin = { name: pluginName, open: enable };
    config.plugins.push(plugin);
  } else {
    plugin.open = enable;
  }
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    utils.log(utils.chalk.green(`插件 ${pluginName} 已${enable ? '启用' : '禁用'}`));
  } catch (err) {
    utils.log(utils.chalk.red(`更新配置文件失败: ${err}`));
  }
}

// 显示插件命令帮助
function showPluginHelp(): void {
  utils.log(
    '插件命令用法:',
    '\n  sm plugin list               - 列出所有可用插件',
    '\n  sm plugin install <name>     - 安装插件',
    '\n  sm plugin uninstall <name>   - 卸载插件',
    '\n  sm plugin enable <name>      - 启用插件',
    '\n  sm plugin disable <name>     - 禁用插件'
  );
}

export default pluginCommand;