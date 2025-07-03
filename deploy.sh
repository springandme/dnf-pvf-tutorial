#!/bin/bash

# DNF PVF 教程阅读器 - Docker 部署脚本
# 使用方法: ./deploy.sh [选项]
# 选项:
#   --simple    使用简化配置部署
#   --full      使用完整配置部署
#   --update    更新课程数据
#   --stop      停止服务
#   --restart   重启服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查课程数据目录
check_course_data() {
    if [ ! -d "./pvfCourse" ]; then
        log_warning "课程数据目录不存在，正在下载..."
        
        if command -v git &> /dev/null; then
            git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
            cp -r temp/pvfCourse ./
            rm -rf temp
            log_success "课程数据下载完成"
        else
            log_error "Git 未安装，无法自动下载课程数据"
            log_info "请手动下载课程数据到 ./pvfCourse 目录"
            exit 1
        fi
    else
        log_success "课程数据目录存在"
    fi
}

# 简化部署
deploy_simple() {
    log_info "使用简化配置部署..."
    
    if [ ! -f "docker-compose.simple.yml" ]; then
        log_info "下载简化配置文件..."
        curl -fsSL https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/docker-compose.simple.yml -o docker-compose.simple.yml
    fi
    
    docker-compose -f docker-compose.simple.yml up -d
    log_success "简化部署完成！访问地址: http://localhost:7210"
}

# 完整部署
deploy_full() {
    log_info "使用完整配置部署..."
    
    if [ ! -f "docker-compose.yml" ]; then
        log_info "下载完整配置文件..."
        curl -fsSL https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/docker-compose.yml -o docker-compose.yml
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    docker-compose up -d
    log_success "完整部署完成！访问地址: http://localhost:7210"
}

# 更新课程数据
update_course_data() {
    log_info "更新课程数据..."
    
    if [ -d "./pvfCourse" ]; then
        # 备份现有数据
        cp -r ./pvfCourse ./pvfCourse.backup.$(date +%Y%m%d_%H%M%S)
        log_info "已备份现有数据"
    fi
    
    # 下载最新数据
    git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
    rsync -av --delete temp/pvfCourse/ ./pvfCourse/
    rm -rf temp
    
    log_success "课程数据更新完成"
}

# 停止服务
stop_service() {
    log_info "停止服务..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
    fi
    
    if [ -f "docker-compose.simple.yml" ]; then
        docker-compose -f docker-compose.simple.yml down
    fi
    
    log_success "服务已停止"
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    stop_service
    
    if [ -f "docker-compose.yml" ]; then
        deploy_full
    elif [ -f "docker-compose.simple.yml" ]; then
        deploy_simple
    else
        log_error "未找到配置文件"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "DNF PVF 教程阅读器 - Docker 部署脚本"
    echo ""
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --simple    使用简化配置部署"
    echo "  --full      使用完整配置部署"
    echo "  --update    更新课程数据"
    echo "  --stop      停止服务"
    echo "  --restart   重启服务"
    echo "  --help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --simple     # 快速部署"
    echo "  $0 --full       # 完整部署"
    echo "  $0 --update     # 更新数据"
}

# 主函数
main() {
    case "${1:-}" in
        --simple)
            check_dependencies
            check_course_data
            deploy_simple
            ;;
        --full)
            check_dependencies
            check_course_data
            deploy_full
            ;;
        --update)
            update_course_data
            ;;
        --stop)
            stop_service
            ;;
        --restart)
            restart_service
            ;;
        --help)
            show_help
            ;;
        *)
            log_info "未指定选项，使用简化部署"
            check_dependencies
            check_course_data
            deploy_simple
            ;;
    esac
}

# 执行主函数
main "$@"
