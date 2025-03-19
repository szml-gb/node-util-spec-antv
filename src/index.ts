import * as path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import { ExcelService } from './services/excelService';
import { ZipService } from './services/zipService';
import { FileGeneratorService } from './services/fileGeneratorService';
import { SvgParserService } from './services/svgParserService';
import { parseArgs } from './utils/cli';

/**
 * 主程序类
 */
class Program {
  private excelService: ExcelService;
  private zipService: ZipService;
  private fileGeneratorService: FileGeneratorService;
  
  constructor() {
    this.excelService = new ExcelService();
    this.zipService = new ZipService();
    this.fileGeneratorService = new FileGeneratorService();
  }
  
  /**
   * 运行程序
   */
  public async run(): Promise<void> {
    try {
      // 解析命令行参数
      const args = parseArgs();
      console.log('命令行参数:', args);
      
      // 创建输出目录
      const outputDir = path.resolve(args.outputDir || 'output');
      fsExtra.ensureDirSync(outputDir);
      console.log(`输出目录: ${outputDir}`);
      
      // 创建资源目录
      const assetsDir = path.join(outputDir, 'assets');
      fsExtra.ensureDirSync(assetsDir);
      
      // 创建metas目录
      const metasDir = path.join(outputDir, 'metas');
      fsExtra.ensureDirSync(metasDir);
      
      // 读取Excel文件
      const excelData = this.excelService.readExcel(args.excelPath);
      console.log(`成功读取Excel文件，共${excelData.length}行数据`);
      
      // 解压ZIP文件
      const extractedDir = await this.zipService.extractZip(args.zipPath, outputDir);
      console.log(`成功解压ZIP文件到: ${extractedDir}`);
      
      // 处理每行Excel数据
      for (const row of excelData) {
        // 确保id存在且有效
        if (!row.id) {
          console.log(`跳过无效行: ${JSON.stringify(row)}`);
          continue;
        }
        
        // 使用id作为目录名（不区分大小写，统一使用小写）
        const chartId = row.id.toLowerCase().trim();
        console.log(`处理图表: ${chartId} (${row.nameZh || row.name || '未命名'})`);
        
        // 先查找有哪些SVG文件包含chartId，如果没有则跳过
        const matchingSvgFiles = this.zipService.findAllSvgFilesForId(extractedDir, chartId);
        if (matchingSvgFiles.length === 0) {
          console.log(`未找到任何包含ID [${chartId}] 的SVG文件，跳过处理`);
          continue;
        }
        
        // 创建图表目录
        const chartDir = path.join(assetsDir, chartId);
        fsExtra.ensureDirSync(chartDir);
        
        // 创建版本目录
        const versionDir = path.join(chartDir, 'v1');
        
        // 清理目标目录，确保没有之前处理的文件残留
        if (fs.existsSync(versionDir)) {
          fsExtra.emptyDirSync(versionDir);
        }
        fsExtra.ensureDirSync(versionDir);
        
        // 复制SVG文件 - 直接复制所有匹配的文件，从文件名中提取编号
        const foundSvgFiles = this.zipService.copyAllMatchingSvgFiles(extractedDir, versionDir, chartId);
        
        // 如果没有成功复制任何SVG文件，删除创建的目录并跳过
        if (foundSvgFiles.length === 0) {
          console.log(`未能成功复制任何SVG文件: ${chartId}, 跳过`);
          // 删除创建的空目录
          fsExtra.removeSync(chartDir);
          continue;
        }
        
        // 提取范围
        let range: number[] = [1, 10]; // 默认范围
        try {
          const rangeMatch = row.k3?.match(/\[(\d+),(\d+)\]/);
          if (rangeMatch) {
            range = [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
            console.log(`从k3字段解析到的范围: [${range[0]}, ${range[1]}]`);
          } else if (foundSvgFiles.length > 0) {
            // 如果没有定义范围但找到了文件，使用实际文件编号的范围
            range = [Math.min(...foundSvgFiles), Math.max(...foundSvgFiles)];
            console.log(`根据实际文件确定的范围: [${range[0]}, ${range[1]}]`);
          } else {
            console.log(`未找到范围定义且没有文件，使用默认范围 [1, 10]: ${chartId}`);
          }
        } catch (error) {
          console.log(`解析range字段失败: ${chartId}, ${row.k3}, 使用默认值 [1, 10]`);
        }
        
        // 生成meta.json文件
        this.fileGeneratorService.createMetaJson(versionDir, row, foundSvgFiles);
        
        // 生成MD文件
        this.fileGeneratorService.createMdFile(metasDir, row);
      }
      
      // 合并MD文件为一个JSON文件
      const mdJsonPath = path.join(outputDir, 'metas.json');
      this.fileGeneratorService.mergeMdFilesToJson(metasDir, mdJsonPath);
      
      // 处理完成
      console.log(`处理完成时间: ${new Date().toISOString()}`);
      console.log('处理完成！');
      
    } catch (error) {
      console.error('程序运行错误:', error);
    }
  }
}

// 运行程序
const program = new Program();
program.run().catch(error => {
  console.error('程序运行失败:', error);
  process.exit(1);
}); 