# Camera-WaterMark — Windows（v3.0）

> 相机照片水印工具 Windows 端：离线读取 EXIF，添加文字 / 图片 / 模糊卡片水印，全分辨率导出。
> 作者：**shiraijikuu**　|　协议：MIT

**EN:** Offline camera-photo watermark tool for Windows. Reads EXIF (brand / model / focal / shutter / aperture / ISO / date) and stamps text, image, or blur-card watermarks; brand-logo & parameter-badge presets; 8 themes; three-column UI; full-resolution export (JPG/PNG/WEBP). Built with a single-file HTML5 Canvas kernel running in Electron 31. Ships as NSIS installer + portable exe.

**中文：** Windows 端离线相机照片水印工具。读取 EXIF（品牌 / 型号 / 焦距 / 快门 / 光圈 / ISO / 日期），添加文字 / 图片 / 模糊卡片水印；支持品牌标与参数框预设、8 套主题、三栏 UI；全分辨率导出（JPG/PNG/WEBP）。由单文件 HTML5 Canvas 内核 + Electron 31 构建，发布为 NSIS 安装版 + 便携版。

## 构建 / Build
```powershell
npm install
npm run build:win          # 同时出 NSIS 安装版 + 便携版 → release\
npm run build:win-portable # 仅便携版
```
- 内核为 `index.html`（含品牌预设 `presets/`）。

## 许可 / License
MIT
