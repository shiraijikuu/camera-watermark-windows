const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

/* ===== 自动更新（仅语义版本变化时自动下载安装；同版本 build 修订走渲染进程手动下载） ===== */
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
try {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'shiraijikuu',
    repo: 'camera-watermark-windows'
  });
} catch (e) {
  console.error('autoUpdater setFeedURL failed:', e.message);
}
autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: '更新已下载',
    message: `新版本 v${info.version} 已下载完成，是否立即重启安装？`,
    detail: '重启后将自动安装更新，当前未保存的工作请先保存。',
    buttons: ['稍后重启', '立即重启'],
    defaultId: 1,
    cancelId: 0
  }).then(({ response }) => {
    if (response === 1) {
      autoUpdater.quitAndInstall();
    }
  }).catch(() => {});
});
autoUpdater.on('error', (err) => {
  console.error('autoUpdater error:', err && err.message ? err.message : String(err));
});
autoUpdater.on('update-not-available', () => {
  console.log('autoUpdater: no semantic-version update available');
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    title: 'Camera-WaterMark',
    icon: path.join(__dirname, 'cwm.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile('index.html');
  // 外部链接用系统浏览器打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null); // 去掉 Electron 默认英文菜单栏
  createWindow();
  // 启动 5 秒后后台检查语义版本更新（不抢启动资源；同版本 build 修订由渲染进程按钮手动检查）
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
