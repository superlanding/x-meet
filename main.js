const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { screen } = require('electron');

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

    // 開發環境下打開開發者工具
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

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

    

    // // 當視窗關閉時
    // mainWindow.on('closed', () => {
    //     mainWindow = null;
    // });
}

app.whenReady().then(createWindow);

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