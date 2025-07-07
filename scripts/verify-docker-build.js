#!/usr/bin/env node

/**
 * Docker 构建验证脚本
 * 用于验证 Docker 镜像是否包含所有必要的文件
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 Docker 构建所需的文件...\n');

// 必需的文件列表
const requiredFiles = [
    'server.js',
    'package.json',
    'dnf_pvf_tutorial.html',
    'style.css',
    'pvfCourse'
];

// 检查文件是否存在
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            console.log(`✅ 目录存在: ${file}/`);
        } else {
            const size = (stats.size / 1024).toFixed(2);
            console.log(`✅ 文件存在: ${file} (${size} KB)`);
        }
    } else {
        console.log(`❌ 文件缺失: ${file}`);
        allFilesExist = false;
    }
});

console.log('\n📋 检查关键文件内容...\n');

// 检查 style.css 是否包含新的样式
if (fs.existsSync(path.join(__dirname, '..', 'style.css'))) {
    const styleContent = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    
    const criticalStyles = [
        '#file-tree ul ul',
        '.folder-content::before',
        'padding-left: 1.5rem',
        'content: \'📁\'',
        'content: \'📂\''
    ];
    
    criticalStyles.forEach(style => {
        if (styleContent.includes(style)) {
            console.log(`✅ 样式包含: ${style}`);
        } else {
            console.log(`❌ 样式缺失: ${style}`);
            allFilesExist = false;
        }
    });
}

// 检查 HTML 文件是否包含新功能
if (fs.existsSync(path.join(__dirname, '..', 'dnf_pvf_tutorial.html'))) {
    const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'dnf_pvf_tutorial.html'), 'utf8');
    
    const criticalFeatures = [
        'expandedFolders',
        'resetFileTreeState',
        'breadcrumb-item',
        'folder-content'
    ];
    
    console.log('\n📄 检查 HTML 功能...\n');
    
    criticalFeatures.forEach(feature => {
        if (htmlContent.includes(feature)) {
            console.log(`✅ 功能包含: ${feature}`);
        } else {
            console.log(`❌ 功能缺失: ${feature}`);
            allFilesExist = false;
        }
    });
}

// 检查 package.json 版本
if (fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    console.log(`\n📦 当前版本: ${packageJson.version}`);
    
    if (packageJson.version === '0.1.0') {
        console.log('✅ 版本号正确');
    } else {
        console.log('❌ 版本号不匹配，期望: 0.1.0');
        allFilesExist = false;
    }
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
    console.log('🎉 所有文件和功能验证通过！');
    console.log('✅ Docker 构建应该包含所有最新的更改');
    process.exit(0);
} else {
    console.log('❌ 验证失败！请检查缺失的文件或功能');
    console.log('🔧 建议重新构建 Docker 镜像');
    process.exit(1);
}
