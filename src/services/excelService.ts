import * as XLSX from 'xlsx';
import * as fs from 'fs';

/**
 * Excel数据行结构定义
 */
export interface ExcelRow {
  category?: string;    // A - 中文名
  image?: string;       // B - 示意图
  id?: string;          // C - id标识
  name?: string;        // D - 分类英文名
  nameZh?: string;      // E - 分类中文名
  author?: string;      // F - 设计负责人
  k1?: string;          // G - 变种
  k2?: string;          // H - 使用场景
  k3?: string;          // I - 数据项范围
  k4?: string;          // J - 优先级
  k5?: string;          // K - 效果图
  k6?: string;          // L - 建议数量
  k7?: string;          // M - 状态
  k8?: string;          // N - 交付日期
  k9?: string;          // O - 技术验收人
  description?: string; // P - 中文描述
  remark?: string;      // Q - 备注
}

/**
 * Excel服务类
 */
export class ExcelService {
  /**
   * 读取Excel文件
   * @param filePath 文件路径
   * @returns Excel数据行数组
   */
  public readExcel(filePath: string): ExcelRow[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel文件不存在: ${filePath}`);
    }

    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将Excel转换为JSON对象数组
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
    console.log(`读取Excel原始数据: ${rawData.length}行`);
    
    // 找到表头行
    let headerRowIndex = -1;
    let headerRow: any = null;
    
    // 查找前5行中含有表头信息的行
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] as any;
      // 输出表头候选行的内容
      // console.log(`检查第${i+1}行是否为表头:`, JSON.stringify(row));
      
      // 如果能找到至少4个关键字段，则视为表头行
      if (row && (row.C === 'id')) {
        headerRowIndex = i;
        headerRow = row;
        console.log(`找到表头行: 第${i+1}行, 内容: ${JSON.stringify(headerRow, null, 2)}`);
        break;
      }
    }
    
    if (headerRowIndex === -1 || !headerRow) {
      console.log(`未找到表头行，使用默认表头`);
      // 使用默认表头映射
      headerRow = {
        A: '中文名',
        B: '示意图',
        C: 'id标识',
        D: '分类英文名',
        E: '分类中文名',
        F: '设计负责人',
        G: '变种',
        H: '使用场景',
        I: '数据项范围',
        J: '优先级',
        K: '效果图',
        L: '建议数量',
        M: '状态',
        N: '交付日期',
        O: '技术验收人',
        P: '中文描述',
        Q: '备注'
      };
    }
    
    console.log('表头内容:', headerRow);
    
    // 创建字段映射
    const fieldMapping: Record<string, keyof ExcelRow> = {};
    
    // 遍历表头，建立列与字段的映射关系
    Object.entries(headerRow).forEach(([col, header]) => {
      const headerStr = String(header).toLowerCase();
      
      // 根据表头内容确定映射字段
      if (col === 'A' || headerStr.includes('中文名')) {
        if (col === 'E' || headerStr.includes('分类中文名')) {
          fieldMapping[col] = 'nameZh'; // E列为中文名
          console.log(`列 ${col} (${header}) 映射到 nameZh`);
        } else {
          fieldMapping[col] = 'category';
          console.log(`列 ${col} (${header}) 映射到 category`);
        }
      } else if (col === 'B' || headerStr.includes('示意图')) {
        fieldMapping[col] = 'image';
        console.log(`列 ${col} (${header}) 映射到 image`);
      } else if (col === 'C' || headerStr.includes('id')) {
        fieldMapping[col] = 'id';
        console.log(`列 ${col} (${header}) 映射到 id`);
      } else if (col === 'D' || headerStr.includes('分类英文名')) {
        fieldMapping[col] = 'name'; // D列为英文名
        console.log(`列 ${col} (${header}) 映射到 name`);
      } else if (col === 'E' || headerStr.includes('分类中文名')) {
        fieldMapping[col] = 'nameZh'; // E列为中文名
        console.log(`列 ${col} (${header}) 映射到 nameZh`);
      } else if (col === 'F' || headerStr.includes('设计负责人')) {
        fieldMapping[col] = 'author';
        console.log(`列 ${col} (${header}) 映射到 author`);
      } else if (col === 'G' || headerStr.includes('变种')) {
        fieldMapping[col] = 'k1';
        console.log(`列 ${col} (${header}) 映射到 k1`);
      } else if (col === 'H' || headerStr.includes('使用场景')) {
        fieldMapping[col] = 'k2';
        console.log(`列 ${col} (${header}) 映射到 k2`);
      } else if (col === 'I' || headerStr.includes('数据项范围')) {
        fieldMapping[col] = 'k3';
        console.log(`列 ${col} (${header}) 映射到 k3`);
      } else if (col === 'J' || headerStr.includes('优先级')) {
        fieldMapping[col] = 'k4';
        console.log(`列 ${col} (${header}) 映射到 k4`);
      } else if (col === 'K' || headerStr.includes('效果图')) {
        fieldMapping[col] = 'k5';
        console.log(`列 ${col} (${header}) 映射到 k5`);
      } else if (col === 'L' || headerStr.includes('建议数量')) {
        fieldMapping[col] = 'k6';
        console.log(`列 ${col} (${header}) 映射到 k6`);
      } else if (col === 'M' || headerStr.includes('状态')) {
        fieldMapping[col] = 'k7';
        console.log(`列 ${col} (${header}) 映射到 k7`);
      } else if (col === 'N' || headerStr.includes('交付日期')) {
        fieldMapping[col] = 'k8';
        console.log(`列 ${col} (${header}) 映射到 k8`);
      } else if (col === 'O' || headerStr.includes('技术验收人')) {
        fieldMapping[col] = 'k9';
        console.log(`列 ${col} (${header}) 映射到 k9`);
      } else if (col === 'P' || headerStr.includes('中文描述')) {
        fieldMapping[col] = 'description';
        console.log(`列 ${col} (${header}) 映射到 description`);
      } else if (col === 'Q' || headerStr.includes('备注')) {
        fieldMapping[col] = 'remark';
        console.log(`列 ${col} (${header}) 映射到 remark`);
      }
    });
    
    // 处理数据行（跳过表头行）
    const result: ExcelRow[] = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const rawRow = rawData[i] as any;
      const row: ExcelRow = {};
      
      // 映射字段
      Object.entries(fieldMapping).forEach(([col, field]) => {
        if (rawRow[col] !== undefined) {
          row[field] = rawRow[col];
        }
      });
      
      // 检查是否有有效的ID（C列）
      if (row.id) {
        result.push(row);
      } else {
        console.log(`跳过无ID行: ${JSON.stringify(rawRow)}`);
      }
    }
    
    console.log(`数据行数: ${result.length}`);
    
    // 返回处理后的数据
    return result;
  }
} 