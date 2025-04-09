const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.APP_ENV === 'development';
const { screen } = require('electron');
// const { autoUpdater } = require('electron-updater');
// const log = require('electron-log');

// 配置日誌
// log.transports.file.level = 'debug';
// autoUpdater.logger = log;
// autoUpdater.autoDownload = true;
// autoUpdater.autoInstallOnAppQuit = true;
// autoUpdater.channel = 'latest';

// 設置應用程序圖標（僅在 macOS 中有效）
if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'assets', 'logo.png'));
} 
function createWindow() {
    // 獲取所有螢幕
    const displays = screen.getAllDisplays();
    
    // 找出最大寬度和高度
    let maxWidth = 0;
    let maxHeight = 0;
    
    displays.forEach(display => {
        maxWidth = Math.max(maxWidth, display.bounds.width);
        maxHeight = Math.max(maxHeight, display.bounds.height);
    });
    
    // 設定視窗大小為螢幕最大尺寸的 80%
    const windowWidth = Math.floor(maxWidth * 1);
    const windowHeight = Math.floor(maxHeight * 1);
    
    // 計算視窗位置使其置中
    const windowX = 0;
    const windowY = 0;
    
    const mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: windowX,
        y: windowY,
        icon: path.join(__dirname, 'assets', 'logo.png'), // 設置窗口圖標
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            webSecurity: false // 允許跨域請求
        }
    });

    // 載入 index.html
    mainWindow.loadFile('index.html');

    // 設置 CORS 頭
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Access-Control-Allow-Origin': ['*'],
                'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
                'Access-Control-Allow-Headers': ['Content-Type', 'Authorization']
            }
        });
    });
}

app.whenReady().then(() => {
    createWindow();
    
    // 只在生產環境檢查更新
    if (isDev === true) { return; }
    
    // autoUpdater.checkForUpdatesAndNotify();
    
    // // 監聽更新事件
    // autoUpdater.on('error', (err) => {
    //     log.error('更新錯誤:', err);
    // });
    
    // autoUpdater.on('update-available', (info) => {
    //     log.info('發現新版本:', info);
    // });
    
    // autoUpdater.on('update-downloaded', (info) => {
    //     log.info('更新已下載:', info);
        
    //     // 提示用戶重啟應用
    //     if (mainWindow) {
    //         mainWindow.webContents.executeJavaScript(`
    //             if (confirm('新版本已下載完成，是否立即重啟應用？')) {
    //                 require('electron').ipcRenderer.send('restart-app');
    //             }
    //         `).catch(err => log.error('執行重啟提示失敗:', err));
    //     }
    // });
    
    // // 監聽重啟請求
    // ipcMain.on('restart-app', () => {
    //     autoUpdater.quitAndInstall();
    // });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 