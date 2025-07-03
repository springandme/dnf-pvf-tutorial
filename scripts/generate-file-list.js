const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

/**
 * 生成静态文件列表，用于 GitHub Pages 部署
 */
async function generateFileList() {
  try {
    console.log('开始生成文件列表...');
    
    // 扫描 pvfCourse 目录下的所有 JSON 文件
    const files = await glob('pvfCourse/**/*.json', { cwd: process.cwd() });
    
    // 生成文件数据结构，与服务器 API 保持一致
    const fileData = files.map(file => ({
      path: file,
      name: path.basename(file),
    }));
    
    console.log(`找到 ${fileData.length} 个文件`);
    
    // 确保输出目录存在
    const outputDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入文件列表到 dist/api/files.json
    const apiDir = path.join(outputDir, 'api');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    
    const outputPath = path.join(apiDir, 'files.json');
    fs.writeFileSync(outputPath, JSON.stringify(fileData, null, 2), 'utf8');
    
    console.log(`文件列表已生成: ${outputPath}`);
    console.log(`包含 ${fileData.length} 个文件`);
    
    // 生成一些示例文件路径用于调试
    if (fileData.length > 0) {
      console.log('示例文件:');
      fileData.slice(0, 3).forEach(file => {
        console.log(`  - ${file.path}`);
      });
    }
    
    return fileData;
  } catch (error) {
    console.error('生成文件列表时出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateFileList();
}

module.exports = generateFileList;
