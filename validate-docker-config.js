const fs = require('fs');
const path = require('path');

/**
 * 验证 Docker 配置文件
 */
function validateDockerConfig() {
  console.log('🔍 验证 Docker 配置文件...\n');
  
  const configs = [
    'docker-compose.yml',
    'docker-compose.simple.yml',
    'Dockerfile'
  ];
  
  let allValid = true;
  
  configs.forEach(configFile => {
    console.log(`📄 检查 ${configFile}:`);
    
    if (!fs.existsSync(configFile)) {
      console.log(`   ❌ 文件不存在`);
      allValid = false;
      return;
    }
    
    try {
      const content = fs.readFileSync(configFile, 'utf8');
      
      // 基本语法检查
      if (configFile.endsWith('.yml')) {
        validateYamlSyntax(content, configFile);
      } else if (configFile === 'Dockerfile') {
        validateDockerfile(content);
      }
      
      console.log(`   ✅ 语法正确`);
      
    } catch (error) {
      console.log(`   ❌ 验证失败: ${error.message}`);
      allValid = false;
    }
    
    console.log('');
  });
  
  // 检查必需的目录结构
  console.log('📁 检查目录结构:');
  
  const requiredDirs = ['pvfCourse'];
  const optionalDirs = ['logs', 'scripts'];
  
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const stats = fs.statSync(dir);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dir);
        console.log(`   ✅ ${dir}/ (${files.length} 个文件)`);
      } else {
        console.log(`   ❌ ${dir} 不是目录`);
        allValid = false;
      }
    } else {
      console.log(`   ❌ 必需目录 ${dir}/ 不存在`);
      allValid = false;
    }
  });
  
  optionalDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`   ✅ ${dir}/ (可选)`);
    } else {
      console.log(`   ⚠️  ${dir}/ (可选，不存在)`);
    }
  });
  
  console.log('');
  
  // 检查端口配置
  console.log('🔌 检查端口配置:');
  checkPortConfiguration();
  
  console.log('');
  
  // 总结
  if (allValid) {
    console.log('🎉 所有配置验证通过！');
    console.log('');
    console.log('📋 部署建议:');
    console.log('   • 快速部署: docker-compose -f docker-compose.simple.yml up -d');
    console.log('   • 完整部署: docker-compose up -d');
    console.log('   • 访问地址: http://localhost:7210');
  } else {
    console.log('❌ 配置验证失败，请检查上述错误');
  }
}

function validateYamlSyntax(content, filename) {
  // 基本的 YAML 语法检查
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // 检查缩进
    if (line.trim() && line.match(/^\s+/) && !line.match(/^(\s{2}|\s{4}|\s{6}|\s{8})*\S/)) {
      throw new Error(`第 ${lineNum} 行缩进不正确`);
    }
    
    // 检查基本语法
    if (line.includes('\t')) {
      throw new Error(`第 ${lineNum} 行包含制表符，应使用空格`);
    }
  });
  
  // 检查必需的字段
  if (filename.includes('docker-compose')) {
    if (!content.includes('version:')) {
      throw new Error('缺少 version 字段');
    }
    if (!content.includes('services:')) {
      throw new Error('缺少 services 字段');
    }
    if (!content.includes('ports:')) {
      throw new Error('缺少端口映射配置');
    }
  }
}

function validateDockerfile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (!lines.some(line => line.startsWith('FROM'))) {
    throw new Error('缺少 FROM 指令');
  }
  
  if (!lines.some(line => line.startsWith('EXPOSE'))) {
    throw new Error('缺少 EXPOSE 指令');
  }
  
  if (!lines.some(line => line.startsWith('CMD') || line.startsWith('ENTRYPOINT'))) {
    throw new Error('缺少 CMD 或 ENTRYPOINT 指令');
  }
}

function checkPortConfiguration() {
  try {
    // 检查 docker-compose.yml
    if (fs.existsSync('docker-compose.yml')) {
      const content = fs.readFileSync('docker-compose.yml', 'utf8');
      const portMatch = content.match(/"(\d+):3000"/);
      if (portMatch) {
        console.log(`   ✅ 完整配置端口: ${portMatch[1]} -> 3000`);
      }
    }
    
    // 检查 docker-compose.simple.yml
    if (fs.existsSync('docker-compose.simple.yml')) {
      const content = fs.readFileSync('docker-compose.simple.yml', 'utf8');
      const portMatch = content.match(/"(\d+):3000"/);
      if (portMatch) {
        console.log(`   ✅ 简化配置端口: ${portMatch[1]} -> 3000`);
      }
    }
    
    // 检查 Dockerfile
    if (fs.existsSync('Dockerfile')) {
      const content = fs.readFileSync('Dockerfile', 'utf8');
      const exposeMatch = content.match(/EXPOSE\s+(\d+)/);
      if (exposeMatch) {
        console.log(`   ✅ Dockerfile 暴露端口: ${exposeMatch[1]}`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ 端口配置检查失败: ${error.message}`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  validateDockerConfig();
}

module.exports = validateDockerConfig;
