import * as fs from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { ExcelRow, MetaJson, MDContent } from '../utils/types';
import { SvgParserService } from './svgParserService';

/**
 * 文件生成服务类
 */
export class FileGeneratorService {
  private svgParserService: SvgParserService;

  constructor() {
    this.svgParserService = new SvgParserService();
  }

  /**
   * 创建meta.json文件
   * @param outputDir 输出目录
   * @param row Excel行数据
   * @param svgFiles 该行包含的SVG文件列表
   */
  public createMetaJson(outputDir: string, row: ExcelRow, svgFiles: number[]): void {
    // 确保id存在
    if (!row.id) {
      console.log(`无效的数据行，缺少ID: ${JSON.stringify(row)}`);
      return;
    }

    // 解析range字段
    let range: number[] = [0, 0];
    try {
      // 尝试解析k3字段中的范围，例如 [1,4]
      const rangeMatch = row.k3?.match(/\[(\d+),(\d+)\]/);
      if (rangeMatch) {
        range = [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
      } else {
        // 如果没有明确的范围，使用实际文件的最小和最大编号
        range = svgFiles.length > 0
          ? [Math.min(...svgFiles), Math.max(...svgFiles)]
          : [1, 10]; // 默认范围
      }
    } catch (error) {
      console.warn(`无法解析range字段: ${row.k3 || '未提供'}，使用实际文件范围`);
      // 如果解析失败，使用实际文件的最小和最大编号
      range = svgFiles.length > 0
        ? [Math.min(...svgFiles), Math.max(...svgFiles)]
        : [1, 10]; // 默认范围
    }

    // 读取SVG文件内容
    const svgContents: string[] = [];
    for (const fileNumber of svgFiles) {
      const svgPath = path.join(outputDir, `${fileNumber}.svg`);
      if (fs.existsSync(svgPath)) {
        const content = fs.readFileSync(svgPath, 'utf8');
        svgContents.push(content);
      }
    }

    // 使用SvgParserService生成types
    const typesContent = this.svgParserService.parseSvgTypes(svgContents);

    // 创建meta.json内容，确保id使用小写
    const metaJson: MetaJson = {
      id: row.id.toLowerCase().trim(),
      name: row.name || row.id,
      nameZh: row.nameZh || row.name || row.id,
      version: 'v1', // 默认版本
      description: row.description || '',
      author: row.author || '',
      range: range,
      remark: row.remark || '',
      types: typesContent
    };

    // 写入meta.json文件
    const metaJsonPath = path.join(outputDir, 'meta.json');
    fsExtra.writeJsonSync(metaJsonPath, metaJson, { spaces: 2 });
    console.log(`已创建meta.json文件: ${metaJsonPath}`);
  }

  /**
   * 创建MD文档
   * @param metasDir metas目录
   * @param row Excel行数据
   */
  public createMdFile(metasDir: string, row: ExcelRow): void {
    // 确保id存在
    if (!row.id) {
      console.log(`无效的数据行，缺少ID: ${JSON.stringify(row)}`);
      return;
    }

    fsExtra.ensureDirSync(metasDir);
    
    // 确保使用小写id作为文件名
    const chartId = row.id.toLowerCase().trim();
    
    // 按照规范创建MD内容
    const mdContent = `# ${row.nameZh || row.name || chartId}
- 别名：${row.category || ''}，英文名 ${row.name || chartId}

## 使用场景：
${row.description || ''}

## 信息图属性:
${this.svgParserService.getSampleTypesDefinition()}

## 备注
${row.remark || ''}
`;
    
    const mdPath = path.join(metasDir, `${chartId}.md`);
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`已创建MD文件: ${mdPath}`);
  }

  /**
   * 合并所有MD文件内容为一个JSON文件
   * @param metasDir metas目录
   * @param outputJsonPath 输出JSON文件路径
   */
  public mergeMdFilesToJson(metasDir: string, outputJsonPath: string): void {
    const mdFiles = fs.readdirSync(metasDir).filter(file => file.endsWith('.md'));
    const mdContent: MDContent = {};
    
    for (const mdFile of mdFiles) {
      const filePath = path.join(metasDir, mdFile);
      const content = fs.readFileSync(filePath, 'utf8');
      // 使用文件名（不含扩展名）作为key，这将确保key是小写的
      const key = path.basename(mdFile, '.md');
      mdContent[key] = content;
    }
    
    // 写入JSON文件
    fsExtra.writeJsonSync(outputJsonPath, mdContent, { spaces: 2 });
    console.log(`已合并所有MD文件到JSON: ${outputJsonPath}`);
  }
} 