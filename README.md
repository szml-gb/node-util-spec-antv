# Excel-SVG 处理工具

这是一个Node.js脚本工具，用于处理Excel文件和SVG文件，生成标准化的目录结构和文档。

## 功能特点

1. 读取Excel文件，将内容转换为JSON格式
2. 解压SVG Zip文件，提取所需的SVG文件
3. 按照指定格式生成目录结构和meta.json文件
4. 生成Markdown文档和合并的JSON文件

## 目录结构

生成的目录结构如下：

```
output/
├── assets/
│   └── [chart-id]/
│       └── v1/
│           ├── [number].svg
│           └── meta.json
├── metas/
│   └── [chart-id].md
├── metas.json
```

## 安装

```bash
# 克隆仓库
git clone https://github.com/szml-gb/node-util-spec-antv.git
cd node-util-spec-antv

# 安装依赖
npm install
```

## 使用方法

### 默认配置运行

```bash
npm run process
```

这将使用默认配置运行脚本，处理`./任务列表.xlsx`和`./svg.zip`文件。

### 自定义参数运行

```bash
npm start -- --excel <excel-file-path> --zip <zip-file-path> --output <output-directory>
```

参数说明：
- `--excel` 或 `-e`: Excel文件路径
- `--zip` 或 `-z`: SVG Zip文件路径
- `--output` 或 `-o`: 输出目录路径（可选，默认为`./output`）

## 构建

```bash
npm run build
```

这将编译TypeScript代码到`dist`目录。

## 日志

处理过程中的日志将被保存到`output/log.txt`文件中，包括：
- 处理开始和结束时间
- 处理错误和警告
- 未找到的SVG文件

## 许可证

ISC 