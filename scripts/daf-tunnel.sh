#!/usr/bin/env bash

# DAF 源站反向隧道保活脚本（在本地国内网络的机器上运行，如 WSL）
#
# 背景：教程图片源站 daf.linglonger.com 屏蔽境外 IP，海外服务器直连会
# 在 TLS 握手阶段被丢包。本脚本把本地 tinyproxy（127.0.0.1:17771）通过
# SSH 反向隧道映射到服务器的 docker0 网卡（172.17.0.1:17771），容器内
# 服务配置 MEDIA_UPSTREAM_PROXY 后即可借道国内网络访问源站。
#
# 依赖：本地 tinyproxy（监听 127.0.0.1:17771）、可免密 SSH 到 oracle-cloud
# 用法：./scripts/daf-tunnel.sh          前台运行（断线自动重连）
#       nohup ./scripts/daf-tunnel.sh &  后台常驻

set -u

PROXY_PORT=17771
REMOTE_BIND=172.17.0.1          # 服务器 docker0 网卡，仅容器网段可达
SSH_HOST=${SSH_HOST:-oracle-cloud}

# tinyproxy 未运行则尝试拉起
if ! ss -tln 2>/dev/null | grep -q "127.0.0.1:${PROXY_PORT}"; then
    if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet tinyproxy 2>/dev/null; then
        systemctl restart tinyproxy
    elif command -v tinyproxy >/dev/null 2>&1; then
        tinyproxy
    else
        echo "错误：tinyproxy 未安装或未运行（WSL: sudo apt install tinyproxy，端口 ${PROXY_PORT}）" >&2
        exit 1
    fi
    sleep 1
fi

echo "[$(date '+%F %T')] 建立反向隧道 ${SSH_HOST}:${REMOTE_BIND}:${PROXY_PORT} -> 127.0.0.1:${PROXY_PORT}"
while true; do
    ssh -N \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -o BatchMode=yes \
        -R "${REMOTE_BIND}:${PROXY_PORT}:127.0.0.1:${PROXY_PORT}" \
        "$SSH_HOST"
    # ssh 退出（网络抖动/本机休眠唤醒）后等几秒重连
    echo "[$(date '+%F %T')] 隧道断开，5 秒后重连..."
    sleep 5
done
