# Vercel 代理部署说明

## 为什么需要代理？

MasterGo 插件运行在沙盒环境中，`ui.html` 作为前端页面无法直接调用阿里云百炼 API（存在 CORS 和安全限制）。因此需要通过 Vercel Serverless Function 作为代理服务器。

## 部署步骤

### 1. 准备工作

- 确保已安装 [Node.js](https://nodejs.org/) (版本 18+)
- 注册 [Vercel](https://vercel.com/) 账号（可使用 GitHub 账号登录）

### 2. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 3. 部署到 Vercel

#### 方法一：使用 Vercel CLI（推荐）

1. 在项目根目录执行：
```bash
cd /Users/jane/Desktop/textfill
vercel login
vercel
```

2. 按照提示操作：
   - 是否要部署到现有项目？选择 `N`（新建项目）
   - 项目名称：输入 `textfill-proxy` 或任意名称
   - 目录：直接回车（使用当前目录）
   - 是否覆盖设置？选择 `N`

3. 部署完成后，Vercel 会显示部署地址，例如：
   ```
   https://textfill-proxy.vercel.app
   ```

#### 方法二：通过 GitHub 部署

1. 将项目推送到 GitHub 仓库
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 中点击 "Add New Project"
3. 导入 GitHub 仓库
4. 保持默认设置，点击 "Deploy"

### 4. 配置插件使用代理

部署完成后，获取 Vercel 提供的 URL（例如：`https://textfill-proxy.vercel.app`），然后：

1. 打开 `main.js` 文件
2. 找到这一行：
   ```javascript
   const PROXY_URL = 'YOUR_VERCEL_URL/api/qwen-proxy';
   ```
3. 替换为实际的 Vercel URL：
   ```javascript
   const PROXY_URL = 'https://textfill-proxy.vercel.app/api/qwen-proxy';
   ```

### 5. 验证部署

部署完成后，可以通过以下方式测试代理是否正常工作：

```bash
curl -X POST https://your-vercel-url.vercel.app/api/qwen-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "description": "order_info表字段",
    "count": 3
  }'
```

如果返回 JSON 数据，说明代理部署成功。

## 项目结构

```
textfill/
├── api/
│   └── qwen-proxy.js      # Vercel Serverless Function
├── main.js                 # MasterGo 插件主文件
├── ui.html                 # 插件界面
├── manifest.json           # 插件配置
├── vercel.json             # Vercel 配置
└── package.json            # 项目配置
```

## 环境变量（可选）

如果需要更安全的 API Key 管理，可以在 Vercel 中设置环境变量：

1. 在 Vercel Dashboard 中进入项目设置
2. 找到 "Environment Variables"
3. 添加变量：
   - `QWEN_API_KEY`: `sk-42eced2107df4922b33311c52d2f24dd`

然后修改 `api/qwen-proxy.js`：
```javascript
const apiKey = process.env.QWEN_API_KEY || 'sk-42eced2107df4922b33311c52d2f24dd';
```

## 更新部署

如果修改了代码，重新部署：

```bash
vercel --prod
```

## 常见问题

### 1. CORS 错误
如果遇到 CORS 错误，检查 `vercel.json` 中的 CORS 配置是否正确。

### 2. 函数超时
如果 API 调用时间较长，可以在 `vercel.json` 中增加 `maxDuration`（最大 60 秒）。

### 3. API Key 泄露
建议使用环境变量存储 API Key，不要直接写在代码中。

## 安全建议

1. **使用环境变量**：将 API Key 存储在 Vercel 环境变量中
2. **添加访问限制**：可以在代理函数中添加请求来源验证
3. **限制请求频率**：添加速率限制防止滥用

## 测试

部署完成后，在 MasterGo 插件中：
1. 选中多个文字图层
2. 输入文本描述
3. 点击提交
4. 查看是否成功填充

如果失败，检查浏览器控制台的错误信息。
