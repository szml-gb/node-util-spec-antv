import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as fsExtra from 'fs-extra';

/**
 * ZIP文件处理服务类
 * 
 * 负责解压ZIP文件、查找和复制SVG文件
 * 文件复制逻辑：从原始文件名中提取数字编号（例如从"roadmap-road-v1-7.svg"提取"7"），
 * 然后将文件复制为"7.svg"
 */
export class ZipService {
  /**
   * 解压ZIP文件到指定目录
   * @param zipPath ZIP文件路径
   * @param outputDir 输出目录
   * @returns 解压后的目录路径
   */
  public async extractZip(zipPath: string, outputDir: string): Promise<string> {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`ZIP文件不存在: ${zipPath}`);
    }

    // 确保输出目录存在
    fsExtra.ensureDirSync(outputDir);
    
    // 创建临时解压目录
    const extractDir = path.join(outputDir, 'extracted_svgs');
    fsExtra.ensureDirSync(extractDir);
    
    try {
      // 使用AdmZip解压文件
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);
      
      console.log(`解压ZIP文件完成，输出到: ${extractDir}`);
      return extractDir;
    } catch (error) {
      console.error('解压ZIP文件失败:', error);
      throw error;
    }
  }

  /**
   * 查找并复制SVG文件到指定目录
   * @param sourceDir 源目录（解压后的目录）
   * @param targetDir 目标目录
   * @param chartId 图表ID
   * @param fileNumber 文件编号
   * @returns 是否找到并复制了文件
   */
  public copySvgFile(sourceDir: string, targetDir: string, chartId: string, fileNumber: number): boolean {
    // 确保目标目录存在
    fsExtra.ensureDirSync(targetDir);
    
    // 递归查找指定编号的SVG文件
    const found = this.findAndCopySvgFileRecursive(sourceDir, targetDir, chartId, fileNumber);
    
    return found;
  }

  /**
   * 获取目录中所有的SVG文件
   * @param sourceDir 源目录
   * @returns SVG文件路径列表
   */
  public findAllSvgFilesForId(sourceDir: string, chartId: string): string[] {
    return this.findSvgFilesInDirectory(sourceDir, chartId);
  }

  /**
   * 复制所有匹配的SVG文件到目标目录
   * @param sourceDir 源目录（解压后的目录）
   * @param targetDir 目标目录
   * @param chartId 图表ID
   * @returns 复制成功的文件编号数组
   */
  public copyAllMatchingSvgFiles(sourceDir: string, targetDir: string, chartId: string): number[] {
    // 确保目标目录存在
    fsExtra.ensureDirSync(targetDir);
    
    // 获取所有匹配的SVG文件
    const matchingSvgFiles = this.findAllSvgFilesForId(sourceDir, chartId);
    const copiedNumbers: number[] = [];
    
    // 遍历复制每个匹配的文件
    for (const filePath of matchingSvgFiles) {
      const fileName = path.basename(filePath);
      
      // 从文件名中提取数字，例如从"roadmap-road-v1-7.svg"中提取"7"
      const matches = fileName.match(/-(\d+)\.svg$/i);
      if (matches && matches[1]) {
        const number = parseInt(matches[1]);
        const targetFile = path.join(targetDir, `${number}.svg`);
        
        // 复制文件
        fsExtra.copySync(filePath, targetFile);
        console.log(`已复制文件 ${fileName} 到 ${targetFile}`);
        copiedNumbers.push(number);
      } else {
        console.log(`无法从文件名 ${fileName} 中提取编号，跳过复制`);
      }
    }
    
    return copiedNumbers;
  }

  /**
   * 递归查找目录中的所有SVG文件
   * @param currentDir 当前目录
   * @param chartId 图表ID
   * @returns SVG文件路径列表
   */
  private findSvgFilesInDirectory(currentDir: string, chartId: string): string[] {
    const results: string[] = [];
    
    try {
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const currentPath = path.join(currentDir, file);
        const stats = fs.statSync(currentPath);
        
        if (stats.isDirectory()) {
          // 递归搜索子目录
          const subResults = this.findSvgFilesInDirectory(currentPath, chartId);
          results.push(...subResults);
        } else if (stats.isFile() && file.toLowerCase().endsWith('.svg')) {
          // 检查文件名是否包含chartId (不区分大小写)
          if (file.toLowerCase().includes(chartId.toLowerCase())) {
            results.push(currentPath);
          }
        }
      }
    } catch (error) {
      console.error(`搜索目录出错: ${currentDir}`, error);
    }
    
    return results;
  }

  /**
   * 递归查找并复制SVG文件
   * @param currentDir 当前目录
   * @param targetDir 目标目录
   * @param chartId 图表ID
   * @param fileNumber 文件编号
   * @returns 是否找到并复制了文件
   */
  private findAndCopySvgFileRecursive(currentDir: string, targetDir: string, chartId: string, fileNumber: number): boolean {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const currentPath = path.join(currentDir, file);
      const stats = fs.statSync(currentPath);
      
      if (stats.isDirectory()) {
        // 递归搜索子目录
        const found = this.findAndCopySvgFileRecursive(currentPath, targetDir, chartId, fileNumber);
        if (found) return true;
      } else if (stats.isFile() && file.toLowerCase().endsWith('.svg')) {
        // 首先检查SVG文件名是否包含chartId
        if (file.toLowerCase().includes(chartId.toLowerCase())) {
          // 然后才检查是否包含文件编号
          const numberPattern = new RegExp(`[-_]?${fileNumber}\\b`, 'i');
          if (numberPattern.test(file) || file.startsWith(`${fileNumber}.`)) {
            // 找到匹配的文件，复制到目标目录
            const targetFile = path.join(targetDir, `${fileNumber}.svg`);
            fsExtra.copySync(currentPath, targetFile);
            console.log(`已复制文件 ${file} 到 ${targetFile}`);
            return true;
          }
        }
      }
    }
    
    return false;
  }
} 