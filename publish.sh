#!/usr/bin/env bash
# PicTrace 一键发布脚本（macOS / Linux）
# 前置条件：已在 GitHub 创建空仓库 https://github.com/new （名称 pictrace，不勾选初始化选项）
set -e
cd "$(dirname "$0")"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin https://github.com/xiaoanping-101/pictrace.git
fi

echo "[1/2] 推送..."
if git push -u origin main; then
  echo "发布成功！ ➜ https://github.com/xiaoanping-101/pictrace"
else
  echo "推送失败：请确认仓库已创建、账号已登录（或需要代理：git config http.https://github.com/.proxy http://127.0.0.1:7897）" >&2
  exit 1
fi
