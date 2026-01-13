# 推送到 GitHub 仓库指南

## 方法一：使用命令行（推荐）

### 步骤 1: 初始化 Git 仓库

```bash
cd /Users/jane/Desktop/textfill
git init
```

### 步骤 2: 添加所有文件

```bash
git add .
```

### 步骤 3: 创建初始提交

```bash
git commit -m "Initial commit: MasterGo文本填充插件"
```

### 步骤 4: 在 GitHub 上创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `textfill` (或你喜欢的名称)
   - **Description**: MasterGo文本填充插件
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
4. 点击 "Create repository"

### 步骤 5: 连接远程仓库并推送

GitHub 创建仓库后会显示命令，使用以下命令：

```bash
# 添加远程仓库（将 YOUR_USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/textfill.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/textfill.git

# 推送代码
git branch -M main
git push -u origin main
```

## 方法二：使用 GitHub Desktop

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 打开 GitHub Desktop
3. 选择 "File" -> "Add Local Repository"
4. 选择项目目录：`/Users/jane/Desktop/textfill`
5. 点击 "Publish repository"
6. 填写仓库名称和描述
7. 选择是否公开
8. 点击 "Publish Repository"

## 方法三：使用 VSCode 的 Git 功能

1. 在 VSCode 中打开项目
2. 点击左侧的源代码管理图标（或按 `Cmd+Shift+G`）
3. 点击 "Initialize Repository"
4. 添加所有文件并提交
5. 点击 "..." 菜单，选择 "Publish to GitHub"
6. 按照提示操作

## 后续更新代码

推送代码后，如果修改了文件，使用以下命令更新：

```bash
# 查看修改的文件
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述你的修改内容"

# 推送到 GitHub
git push
```

## 常见问题

### 1. 需要输入用户名和密码？

如果使用 HTTPS，GitHub 已不再支持密码认证，需要：
- 使用 Personal Access Token（推荐）
- 或配置 SSH key

**使用 Personal Access Token：**
1. GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
2. 生成新 token，勾选 `repo` 权限
3. 推送时，用户名输入你的 GitHub 用户名，密码输入 token

**配置 SSH key：**
```bash
# 生成 SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 在 GitHub -> Settings -> SSH and GPG keys 中添加
```

### 2. 忘记添加 .gitignore？

如果已经推送了不想提交的文件（如 `node_modules`），可以：

```bash
# 从 Git 中移除但保留本地文件
git rm -r --cached node_modules
git commit -m "Remove node_modules from git"
git push
```

### 3. 修改远程仓库地址？

```bash
# 查看当前远程地址
git remote -v

# 修改远程地址
git remote set-url origin https://github.com/YOUR_USERNAME/textfill.git
```

## 推送后连接 Vercel

推送代码到 GitHub 后，可以在 Vercel 中：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 选择 "Import Git Repository"
4. 选择你的 GitHub 仓库
5. 保持默认设置，点击 "Deploy"

这样每次推送代码到 GitHub，Vercel 会自动重新部署。
