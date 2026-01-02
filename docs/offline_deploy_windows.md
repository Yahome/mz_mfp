# Windows 内网部署（含离线打包依赖）详细步骤

以下步骤假设你使用 PowerShell，项目根目录为 `E:\project\mz_mfp_gpt`。分为「有网机打包」与「内网机安装」两部分。

## 前置准备
- Python 3.11+ 安装包（从 python.org 下载 Windows x86-64 安装器，安装时勾选 “Add Python to PATH”）。
- Git（可选，用于拉代码）。
- Node.js 20+（仅需前端构建时用；若只跑后端可略过）。
- 有网机能访问外网 PyPI/NPM；内网机无外网。

## 一、有网机打包后端依赖
1. 打开 PowerShell，进入项目根目录：
   ```powershell
   cd E:\project\mz_mfp_gpt
   ```
2. 创建虚拟环境并激活：
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
3. 安装后端依赖（联网）：
   ```powershell
   pip install -r backend/requirements.txt
   ```
4. 下载离线依赖包到目录 `offline_pkgs`：
   ```powershell
   mkdir offline_pkgs
   pip download -r backend/requirements.txt -d offline_pkgs
   ```
   说明：该目录会包含所需的 whl/tar.gz 包，内网机可无需联网安装。
5. 退出虚拟环境（可选）：
   ```powershell
   deactivate
   ```
6. 打包/拷贝到内网机：至少拷贝以下内容
   - `backend/requirements.txt`
   - `offline_pkgs/` 目录
   - 项目代码本身（可打 zip 后拷贝）。

## 二、内网机安装后端依赖
1. 安装好 Python 3.11+（离线安装包）。
2. 打开 PowerShell，进入项目根目录（已拷贝到内网的路径）：
   ```powershell
   cd E:\project\mz_mfp_gpt
   ```
3. 创建并激活虚拟环境：
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
4. 使用离线包安装依赖（无需联网）：
   ```powershell
   pip install --no-index --find-links=offline_pkgs -r backend/requirements.txt
   ```
5. 配置后端环境变量：复制 `backend/.env`，根据内网 MySQL/外部视图 DSN 修改。
6. 启动后端（示例）：
   ```powershell
   cd backend
   ..\.venv\Scripts\activate   # 或直接回到项目根执行 .\.venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
   ```

## 三、（可选）前端离线处理简述
若需要在内网构建前端：
1. 有网机：在 `frontend` 目录执行 `npm ci`，并执行 `npm config set cache ./npm-cache` 保留缓存；可直接把 `frontend/node_modules` 和 `npm-cache` 一并拷贝。
2. 内网机：`cd frontend`，执行 `npm ci --offline --cache ./npm-cache`（或直接复用拷贝的 `node_modules`），再运行 `npm run build` 生成 `dist/` 静态文件。

## 常见问题
- pip 提示缺包：确认 `offline_pkgs` 中包含相应 whl；必要时在有网机重新执行 `pip download`。
- PATH 未生效：安装 Python 时需勾选 “Add Python to PATH”，或在 PowerShell 中使用完整路径调用 python。
- 数据库连接失败：检查 `.env` 中 `MYSQL_DSN` 是否指向内网可达的 MySQL，确保已导入 `db/schema.sql`。 
