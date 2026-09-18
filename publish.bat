@echo off
REM PicTrace 一键发布脚本（Windows）
REM 前置条件：
REM   1. 已在 GitHub 创建空仓库 https://github.com/new （名称 pictrace，不要勾选任何初始化选项）
REM   2. 首次 push 时 Git Credential Manager 会弹出浏览器让你登录 GitHub 账号
REM 若直连 github.com 失败，脚本会自动尝试本地代理 127.0.0.1:7897

cd /d "%~dp0"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin https://github.com/xiaoanping-101/pictrace.git
)

echo [1/3] 尝试直连推送...
git push -u origin main
if not errorlevel 1 goto :done

echo [2/3] 直连失败，改用本地代理 127.0.0.1:7897 ...
git config http.https://github.com/.proxy http://127.0.0.1:7897
git push -u origin main
if not errorlevel 1 goto :done

echo [3/3] 仍然失败。请检查：
echo   - 仓库是否已在 GitHub 创建（https://github.com/new，名称 pictrace）
echo   - 浏览器登录是否完成
echo   - 代理端口是否为 7897（Clash Verge 默认；其它请改本脚本或 git config）
exit /b 1

:done
echo.
echo 发布成功！ ➜ https://github.com/xiaoanping-101/pictrace
echo 建议到仓库 Settings 中补充 Topics：reverse-image-search, osint, image-forensics, zh-cn
