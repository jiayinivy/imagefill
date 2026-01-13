# MasterGo 文本填充插件

一个 MasterGo 插件，可以通过阿里云通义千问大模型自动生成并填充文本内容。

## 功能特性

1. 选中多个文字图层
2. 输入文本描述
3. 自动生成符合描述的不重复文本
4. 批量替换选中文字图层的内容

## 项目结构

```
textfill/
├── api/
│   └── qwen-proxy.js      # Vercel Serverless Function 代理
├── main.js                 # MasterGo 插件主逻辑
├── ui.html                 # 插件用户界面
├── manifest.json           # 插件配置文件
├── vercel.json             # Vercel 部署配置
├── package.json            # 项目配置
└── DEPLOY.md               # 部署说明文档
```

## 快速开始

### 1. 部署 Vercel 代理

由于 MasterGo 插件运行在沙盒环境中，需要通过 Vercel 代理调用阿里云百炼 API。

详细部署步骤请参考 [DEPLOY.md](./DEPLOY.md)

**快速部署：**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署
vercel
```

### 2. 配置代理地址

部署完成后，在 `main.js` 中更新代理 URL：

```javascript
const PROXY_URL = 'https://your-vercel-url.vercel.app/api/qwen-proxy';
```

### 3. 在 MasterGo 中运行插件

1. 打开 MasterGo 客户端
2. 进入 "插件 -> 开发者模式 -> 创建/添加插件"
3. 选择项目的 `manifest.json` 文件
4. 运行插件

## 使用说明

1. **选中文字图层**：在 MasterGo 画布中选中一个或多个文字图层
2. **输入描述**：在插件界面中输入文本描述（例如："order_info表字段"）
3. **提交**：点击提交按钮，插件会自动生成文本并填充到选中的图层

### 示例

- 选中 5 个文字图层
- 输入："order_info表字段"
- 结果：图层内容依次替换为：
  - order_id
  - customer_id
  - product_id
  - order_number
  - order_total_amount

## 技术栈

- **MasterGo Plugin API**: 插件开发框架
- **Vercel Serverless Functions**: 代理服务器
- **阿里云通义千问**: 大语言模型 API

## 注意事项

1. 需要先部署 Vercel 代理才能正常使用
2. 确保 API Key 有效（当前使用：`sk-42eced2107df4922b33311c52d2f24dd`）
3. 未选中文字图层时会提示错误

## 开发

### 本地测试 Vercel 函数

```bash
vercel dev
```

### 更新部署

```bash
vercel --prod
```

## 许可证

MIT
