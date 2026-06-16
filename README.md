
# Quick Pass Gen

Quick Pass Gen is a local-first Chrome random password generator extension for quickly creating strong passwords.

中文说明见下方 [中文](#中文)。

### What it does

- Customize password length from 8 to 32 characters.
- Choose uppercase letters, lowercase letters, numbers, and common symbols.
- Optionally exclude ambiguous characters such as `0 O o 1 l I`.
- Show password strength automatically.
- Copy the generated password with one click.
- Store only preferences locally; password history is not saved or uploaded.

### Load in Google Chrome

1. Download or clone this project locally.
2. Open Chrome and go to `chrome://extensions/`.
3. Turn on “Developer mode” in the top-right corner.
4. Click “Load unpacked”.
5. Select the project root directory that contains `manifest.json`.
6. Click the “Quick Pass Gen” icon in the browser toolbar to use it.

After changing code, return to `chrome://extensions/` and click “Reload” on the extension card.

### Development and packaging

```bash
npm test
npm run pack:chrome
```

The package command creates `dist/quick-pass-gen.zip`, which can be uploaded to the Chrome Web Store.

### License

This project is licensed under the [MIT License](./LICENSE).

---

# 快密生成器

## 中文

快密生成器是一款本地优先的 Chrome 随机密码生成器扩展，用来快速生成强随机密码。

### 能做什么

- 自定义密码长度（8-32 位）。
- 选择大写字母、小写字母、数字和常用特殊符号。
- 可排除 `0 O o 1 l I` 等易混淆字符。
- 自动显示密码强度。
- 一键复制生成的密码。
- 仅在本地保存偏好设置，不保存密码历史，也不上传任何数据。


### 加载到 Google Chrome

1. 下载或克隆本项目到本地。
2. 打开 Chrome，进入 `chrome://extensions/`。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目根目录（包含 `manifest.json` 的目录）。
6. 点击浏览器工具栏中的“快密生成器”图标开始使用。

如果修改了代码，回到 `chrome://extensions/`，点击该扩展卡片上的“重新加载”即可生效。

## 开发与打包

```bash
npm test
npm run pack:chrome
```

打包后会生成 `dist/quick-pass-gen.zip`，可用于上传到 Chrome Web Store。

### 许可证

本项目使用 [MIT License](./LICENSE) 开源。
