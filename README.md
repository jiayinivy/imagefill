# MasterGo 图片填充插件

一个 MasterGo 插件，可以通过 Unsplash API 搜索高质量免费图片并自动填充到选中的形状图层中。

## 功能特性

1. **图片搜索**：支持输入关键词搜索 Unsplash 高质量免费图片（建议使用英文关键词）
2. **快捷搜索**：内置两个预设快捷按钮："avatar" 和 "product"
3. **批量填充**：选中多个形状图层后，自动按顺序匹配图片并填充
4. **蒙版填充**：图片自动应用为蒙版填充效果（Image as Mask），实现"在形状内显示搜索图片"
5. **多种填充模式**：
   - **居中裁剪**（默认）：保持图片比例，缩放至最小一边覆盖整个容器，超出部分被裁剪，居中对齐
   - **拉伸**：图片强制拉伸以完全填满容器，不保持宽高比，可能变形
   - **平铺**：图片按原尺寸重复平铺填满整个区域，不拉伸

## 项目结构

```
imagefill/
├── api/
│   └── qwen-proxy.js      # Vercel Serverless Function 代理（调用 Unsplash API）
├── main.js                 # MasterGo 插件主逻辑
├── ui.html                 # 插件用户界面
├── manifest.json           # 插件配置文件
├── vercel.json             # Vercel 部署配置
├── package.json            # 项目配置
└── README.md               # 项目说明文档
```

## 快速开始

### 1. 部署 Vercel 代理

由于 MasterGo 插件运行在沙盒环境中，需要通过 Vercel 代理调用 Unsplash API。

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

部署完成后，在 `ui.html` 中更新代理 URL：

```javascript
const PROXY_URL = 'https://your-vercel-url.vercel.app/api/unsplash-proxy';
```

### 3. 在 MasterGo 中运行插件

1. 打开 MasterGo 客户端
2. 进入 "插件 -> 开发者模式 -> 创建/添加插件"
3. 选择项目的 `manifest.json` 文件
4. 运行插件

## 使用说明

1. **选中形状图层**：在 MasterGo 画布中选中一个或多个形状图层（矩形、圆形等，不包括文本图层）
2. **输入关键词**：在插件界面中输入图片搜索关键词（建议使用英文，如 "nature"、"city"、"portrait" 等）
3. **选择填充模式**：选择图片填充模式（居中裁剪/拉伸/平铺）
4. **提交**：点击"搜索并填充"按钮，或点击预设按钮（"avatar" 或 "product"）快速搜索
5. **等待填充**：插件会自动搜索图片、下载并填充到选中的图层中

### 示例

- 选中 3 个矩形图层
- 输入关键词："mountain"
- 选择填充模式："居中裁剪"
- 结果：3 个矩形图层依次填充为不同的山脉图片

## 技术栈

- **MasterGo Plugin API**: 插件开发框架
- **Vercel Serverless Functions**: 代理服务器
- **Unsplash API**: 高质量免费图片搜索服务

## API 配置

插件使用 Unsplash API 搜索图片，API Key 已配置在代理服务器中：
- Access Key: `LRbxt00ShwcTdcoeJJujzoMW7ppZOK3uk5a6g7CXgF4o`
- Secret Key: `RKuJhQzYeU40qUdPrUIKVHLUJO7GpoA4DqWevoiiMCY`

## 注意事项

1. 需要先部署 Vercel 代理才能正常使用
2. 建议使用英文关键词搜索以获得更好的结果
3. 只能填充形状图层（矩形、圆形等），不支持文本图层
4. 图片下载需要一定时间，请耐心等待
5. Unsplash API 有请求频率限制，请合理使用

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
