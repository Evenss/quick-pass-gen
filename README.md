
# Quick Pass Gen

Quick Pass Gen is a local-first Chrome random password generator extension for quickly creating strong passwords.

中文说明见下方 [中文](#中文)。

<img width="355" height="580" alt="image" src="https://github.com/user-attachments/assets/13b930d8-a312-4929-9813-f6d6b271a5b1" />
<br>
<img width="355" height="90" alt="image" src="https://github.com/user-attachments/assets/1382c126-d080-4c18-b222-76737689533a" />

### What it does

- Customize password length from 8 to 32 characters.
- Choose uppercase letters, lowercase letters, numbers, and common symbols.
- Optionally exclude ambiguous characters such as `0 O o 1 l I`.
- Show password strength automatically.
- Copy the generated password with one click.
- Save recent usage history locally so you can recover recently copied or filled passwords; autofill history records only the site domain, not the full URL or page content, and no data is uploaded.

### Install from Chrome Web Store

For regular use, install Quick Pass Gen directly from the Chrome Web Store:

[Quick Pass Gen on Chrome Web Store](https://chromewebstore.google.com/detail/cjopmdmbneimmigedpadobbgjcdnnplk)

### Load in Google Chrome for development

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

<img width="355" height="580" alt="image" src="https://github.com/user-attachments/assets/5e536e08-ae69-464b-a863-17ef0bcf5bd3" />
<br>
<img width="355" height="90" alt="image" src="https://github.com/user-attachments/assets/881c61fc-a629-4175-9a6c-1f61a5e5a16d" />

### 能做什么

- 自定义密码长度（8-32 位）。
- 选择大写字母、小写字母、数字和常用特殊符号。
- 可排除 `0 O o 1 l I` 等易混淆字符。
- 自动显示密码强度。
- 一键复制生成的密码。
- 可在本地保存最近使用历史，方便找回近期复制或填充过的密码；自动填充历史只记录网站域名，不保存完整 URL 或页面内容，也不会上传任何数据。


### 从 Chrome Web Store 安装

日常使用请直接从 Chrome Web Store 安装快密生成器：

[快密生成器 - Chrome Web Store](https://chromewebstore.google.com/detail/cjopmdmbneimmigedpadobbgjcdnnplk)

### 开发时加载到 Google Chrome

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
