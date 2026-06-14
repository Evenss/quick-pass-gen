import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

mkdirSync('dist', { recursive: true });
rmSync('dist/quick-pass-gen.zip', { force: true });
const files = ['manifest.json', 'popup.html', 'popup.css', 'popup.js', 'password.js', 'icons'];
execFileSync('zip', ['-r', 'dist/quick-pass-gen.zip', ...files], { stdio: 'inherit' });
writeFileSync('dist/README.txt', '上传 dist/quick-pass-gen.zip 到 Chrome 网上应用店开发者后台。\n');
