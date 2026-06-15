# 快密生成器

快密生成器是一款本地优先、深色现代卡片风的 Chrome 随机密码生成器扩展。它用于快速生成强随机密码，支持自定义长度、字符类型、排除易混淆字符、一键复制，并且只在浏览器本地保存偏好配置。

## 功能特性

- **现代深色卡片界面**：设置区域在上方，密码展示与复制操作在底部。
- **可调密码长度**：范围 8 到 64，默认 16。
- **字符类型可选**：大写字母、小写字母、数字、兼容特殊符号。
- **兼容特殊符号集**：`!@#$%^&*_-+=`，减少网站不兼容概率。
- **排除易混淆字符**：可选择排除 `0 O o 1 l I`。
- **强度提示**：根据长度和启用字符类型给出强度等级。
- **一键复制**：复制当前生成的密码到剪贴板。
- **本地保存配置**：使用 `chrome.storage.local` 保存用户偏好。
- **不保存密码历史**：生成过的密码不会写入本地存储，也不会上传。
- **安全随机数**：使用浏览器 `crypto.getRandomValues()` 生成随机值。

## 项目结构

```text
quick-pass-gen/
├── manifest.json              # Chrome Manifest V3 配置
├── popup.html                 # 插件弹窗结构
├── popup.css                  # 深色现代卡片风样式
├── popup.js                   # 弹窗交互、本地配置、复制逻辑
├── password.js                # 密码生成核心逻辑
├── tests/password.test.js     # Node 内置测试框架测试用例
├── scripts/pack-chrome.js     # Chrome 上传包生成脚本
├── icons/                     # 插件图标
├── package.json               # npm 脚本
├── PRIVACY.md                 # 隐私说明
├── STORE_LISTING.md           # Chrome 商店文案草稿
├── RELEASE_CHECKLIST.md       # 发布检查清单
└── CONTRIBUTING.md            # 开发贡献说明
```

## 本地开发

本项目不依赖第三方 npm 包，使用 Node.js 内置测试框架。

```bash
npm test
```

## 打包 Chrome 扩展

运行：

```bash
npm run pack:chrome
```

脚本会生成：

```text
dist/quick-pass-gen.zip
```

该 zip 文件就是上传到 Chrome Web Store 开发者后台的扩展包。

## 在 Chrome 中本地调试

1. 打开 Chrome。
2. 进入 `chrome://extensions/`。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目根目录。
6. 点击浏览器工具栏中的“快密生成器”图标进行测试。


## 不上架 Chrome 商店，直接本地使用

如果你暂时不想发布到 Chrome Web Store，也可以用开发者模式直接安装。

### 方式一：加载项目源码目录

适合你正在开发或想随时改代码的情况：

1. 确认本仓库已经下载到本地。
2. 打开 Chrome，进入 `chrome://extensions/`。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目根目录，也就是包含 `manifest.json` 的目录。
6. 修改代码后，回到 `chrome://extensions/` 点击该扩展卡片上的“重新加载”。

### 方式二：使用 GitHub Actions 自动打包产物

适合你不想在本地运行打包命令，只想从 GitHub 下载可安装包的情况：

1. 把代码推送到 GitHub 仓库。
2. 打开 GitHub 仓库页面，进入 **Actions**。
3. 选择 **Build Chrome Extension** 工作流。
4. 如果没有自动运行，点击 **Run workflow** 手动触发。
5. 等待工作流完成后，打开最新一次成功运行记录。
6. 在页面底部 **Artifacts** 区域下载 `quick-pass-gen-chrome-extension`。
7. 解压下载到的 artifact，得到 `quick-pass-gen.zip`。
8. 再解压 `quick-pass-gen.zip` 到一个本地文件夹。
9. 打开 Chrome `chrome://extensions/`，启用“开发者模式”。
10. 点击“加载已解压的扩展程序”，选择第 8 步解压出来、包含 `manifest.json` 的文件夹。

> 注意：Chrome 开发者模式不能直接加载 zip 文件，必须选择解压后的扩展目录；Chrome Web Store 后台才是上传 `dist/quick-pass-gen.zip`。

### 方式三：本地手动打包

如果你本地有 Node.js，可以运行：

```bash
npm run pack:chrome
```

然后在 `dist/quick-pass-gen.zip` 中得到打包文件。开发者模式安装时仍然需要先解压该 zip，再选择解压后的目录。

## 发布到 Chrome Web Store

发布前请参考：

- [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)
- [`STORE_LISTING.md`](./STORE_LISTING.md)
- [`PRIVACY.md`](./PRIVACY.md)

基本流程：

1. 运行 `npm test`。
2. 运行 `npm run pack:chrome`。
3. 登录 Chrome Web Store 开发者后台。
4. 新建扩展或上传新版本。
5. 上传 `dist/quick-pass-gen.zip`。
6. 填写商店描述、隐私说明和截图。
7. 提交审核。

## 隐私原则

快密生成器是本地工具：

- 不收集个人信息。
- 不上传生成的密码。
- 不保存密码历史。
- 不调用远程服务器。
- 仅使用 `chrome.storage.local` 保存用户的配置偏好。

更多内容见 [`PRIVACY.md`](./PRIVACY.md)。

## 测试覆盖

当前测试覆盖：

- 密码长度边界修正。
- 指定长度生成。
- 只启用数字时只生成数字。
- 同时启用多种字符类型时，每种类型至少出现一次。
- 排除易混淆字符。
- 所有字符类型关闭时抛出错误。
- 长密码和多字符类型的强度评分更高。

## 许可证

当前仓库尚未添加许可证文件。如果要公开发布到 GitHub，建议后续补充 `LICENSE`，例如 MIT License。
