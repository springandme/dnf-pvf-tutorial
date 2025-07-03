@echo off
setlocal enabledelayedexpansion

REM DNF PVF 教程阅读器 - Docker 部署脚本 (Windows)
REM 使用方法: deploy.bat [选项]
REM 选项:
REM   simple    使用简化配置部署
REM   full      使用完整配置部署
REM   update    更新课程数据
REM   stop      停止服务
REM   restart   重启服务

set "action=%~1"
if "%action%"=="" set "action=simple"

echo [INFO] DNF PVF 教程阅读器 - Docker 部署脚本
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 检查 Docker Compose 是否安装
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

echo [SUCCESS] Docker 环境检查通过

REM 根据参数执行相应操作
if "%action%"=="simple" goto :deploy_simple
if "%action%"=="full" goto :deploy_full
if "%action%"=="update" goto :update_data
if "%action%"=="stop" goto :stop_service
if "%action%"=="restart" goto :restart_service
if "%action%"=="help" goto :show_help

echo [ERROR] 未知选项: %action%
goto :show_help

:deploy_simple
echo [INFO] 使用简化配置部署...
call :check_course_data

if not exist "docker-compose.simple.yml" (
    echo [INFO] 下载简化配置文件...
    curl -fsSL https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/docker-compose.simple.yml -o docker-compose.simple.yml
)

docker-compose -f docker-compose.simple.yml up -d
echo [SUCCESS] 简化部署完成！访问地址: http://localhost:7210
goto :end

:deploy_full
echo [INFO] 使用完整配置部署...
call :check_course_data

if not exist "docker-compose.yml" (
    echo [INFO] 下载完整配置文件...
    curl -fsSL https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/docker-compose.yml -o docker-compose.yml
)

REM 创建日志目录
if not exist "logs" mkdir logs

docker-compose up -d
echo [SUCCESS] 完整部署完成！访问地址: http://localhost:7210
goto :end

:update_data
echo [INFO] 更新课程数据...

if exist "pvfCourse" (
    set "backup_name=pvfCourse.backup.%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    set "backup_name=!backup_name: =0!"
    xcopy "pvfCourse" "!backup_name!" /E /I /Q
    echo [INFO] 已备份现有数据到 !backup_name!
)

REM 下载最新数据
git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
if exist "pvfCourse" rmdir /s /q "pvfCourse"
xcopy "temp\pvfCourse" "pvfCourse" /E /I /Q
rmdir /s /q "temp"

echo [SUCCESS] 课程数据更新完成
goto :end

:stop_service
echo [INFO] 停止服务...

if exist "docker-compose.yml" (
    docker-compose down
)

if exist "docker-compose.simple.yml" (
    docker-compose -f docker-compose.simple.yml down
)

echo [SUCCESS] 服务已停止
goto :end

:restart_service
echo [INFO] 重启服务...
call :stop_service

if exist "docker-compose.yml" (
    call :deploy_full
) else if exist "docker-compose.simple.yml" (
    call :deploy_simple
) else (
    echo [ERROR] 未找到配置文件
    goto :end
)
goto :end

:check_course_data
if not exist "pvfCourse" (
    echo [WARNING] 课程数据目录不存在，正在下载...
    
    git --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Git 未安装，无法自动下载课程数据
        echo [INFO] 请手动下载课程数据到 pvfCourse 目录
        pause
        exit /b 1
    )
    
    git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
    xcopy "temp\pvfCourse" "pvfCourse" /E /I /Q
    rmdir /s /q "temp"
    echo [SUCCESS] 课程数据下载完成
) else (
    echo [SUCCESS] 课程数据目录存在
)
exit /b 0

:show_help
echo DNF PVF 教程阅读器 - Docker 部署脚本 (Windows)
echo.
echo 使用方法: %~nx0 [选项]
echo.
echo 选项:
echo   simple    使用简化配置部署 (默认)
echo   full      使用完整配置部署
echo   update    更新课程数据
echo   stop      停止服务
echo   restart   重启服务
echo   help      显示此帮助信息
echo.
echo 示例:
echo   %~nx0 simple     # 快速部署
echo   %~nx0 full       # 完整部署
echo   %~nx0 update     # 更新数据
goto :end

:end
echo.
echo 按任意键退出...
pause >nul
