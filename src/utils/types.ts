// 定义Excel数据行的接口
export interface ExcelRow {
  category?: string;
  image?: string;
  id?: string;
  name?: string;
  nameZh?: string;
  author?: string;
  k1?: string;
  k2?: string;
  k3?: string;
  k4?: string;
  k5?: string;
  k6?: string;
  k7?: string;
  k8?: string;
  k9?: string;
  description?: string;
  remark?: string;
}

// 定义Meta.json文件的接口
export interface MetaJson {
  id: string;
  name: string;
  nameZh: string;
  version: string;
  description: string;
  author: string;
  range: number[];
  remark: string;
  types: string;
}

// 定义存储所有MD内容的JSON格式
export interface MDContent {
  [key: string]: string;
}

// 命令行参数接口
export interface CommandLineArgs {
  excelPath: string;
  zipPath: string;
  outputDir?: string;
} 