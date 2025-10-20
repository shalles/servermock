import * as process from 'process';
import utils from '../lib/utils';
import startCommand from './command/start';
import initCommand from './command/init';
import pluginCommand from './command/plugin';

/**
 * 命令行主入口
 */
function cmd(): void {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  const commandArgs = args.slice(1);
  
  // 处理不同的命令
  switch (command) {
    case 'start':
      // 启动服务器
      startCommand(commandArgs);
      break;
    case 'init':
      // 初始化配置
      initCommand(commandArgs);
      break;
    case 'plugin':
      // 插件管理
      pluginCommand(commandArgs);
      break;
    case 'help':
    case '-h':
    case '--help':
      // 显示帮助信息
      showHelp();
      break;
    case 'version':
    case '-v':
    case '--version':
      // 显示版本信息
      showVersion();
      break;
    default:
      // 未知命令
      utils.log(utils.chalk.red(`未知命令: ${command}`));
      showHelp();
      break;
  }
}

// 显示帮助信息
function showHelp(): void {
  utils.log(
    'servermock 命令行工具',
    '\n用法:',
    '\n  sm [command] [options]',
    '\n命令:',
    '\n  start       启动服务器（默认）',
    '\n  init        初始化配置文件',
    '\n  plugin      插件管理',
    '\n  help        显示帮助信息',
    '\n  version     显示版本信息',
    '\n选项:',
    '\n  -p          指定端口号',
    '\n  -i          指定主页面文件',
    '\n  -n          指定主机名（auto 表示自动获取 IP）',
    '\n  -py         启用代理模式',
    '\n  @p          启动指定插件'
  );
}

// 显示版本信息
function showVersion(): void {
  try {
    const pkg = require('../../package.json');
    utils.log(`servermock v${pkg.version}`);
  } catch (err) {
    utils.log('servermock version unknown');
  }
}

export default cmd;