#!/bin/bash
# 推送脚本 - 使用 Personal Access Token

echo "准备推送到 GitHub..."
echo "如果提示输入用户名和密码："
echo "  用户名：输入你的 GitHub 用户名"
echo "  密码：输入你的 Personal Access Token（不是 GitHub 密码）"
echo ""
echo "如果还没有创建 Token，请访问："
echo "https://github.com/settings/tokens"
echo ""

git push -u origin main
