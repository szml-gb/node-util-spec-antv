import { CommandLineArgs } from './types';

/**
 * 解析命令行参数
 * @returns 解析后的命令行参数对象
 */
export function parseArgs(): CommandLineArgs {
  const args = process.argv.slice(2);
  const result: CommandLineArgs = {
    excelPath: '',
    zipPath: '',
    outputDir: 'output' // 默认输出目录
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--excel' || arg === '-e') {
      result.excelPath = args[++i] || '';
    } else if (arg === '--zip' || arg === '-z') {
      result.zipPath = args[++i] || '';
    } else if (arg === '--output' || arg === '-o') {
      result.outputDir = args[++i] || 'output';
    }
  }

  // 验证必要参数
  if (!result.excelPath) {
    throw new Error('缺少必要参数: --excel 或 -e');
  }
  
  if (!result.zipPath) {
    throw new Error('缺少必要参数: --zip 或 -z');
  }

  return result;
} 