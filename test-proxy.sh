#!/bin/bash
# 测试 Vercel 代理连接

echo "测试 Vercel 代理连接..."
echo "URL: https://textfill-ten.vercel.app/api/qwen-proxy"
echo ""

# 测试 OPTIONS 请求（CORS 预检）
echo "1. 测试 OPTIONS 请求（CORS 预检）..."
curl -X OPTIONS https://textfill-ten.vercel.app/api/qwen-proxy \
  -H "Origin: https://mastergo.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v --max-time 10 2>&1 | grep -E "(HTTP|Access-Control)"

echo ""
echo "2. 测试 POST 请求..."
curl -X POST https://textfill-ten.vercel.app/api/qwen-proxy \
  -H "Content-Type: application/json" \
  -H "Origin: https://mastergo.com" \
  -d '{"description": "order_info表字段", "count": 3}' \
  --max-time 30 \
  -w "\n\nHTTP状态码: %{http_code}\n总时间: %{time_total}秒\n" \
  2>&1

echo ""
echo "测试完成！"
