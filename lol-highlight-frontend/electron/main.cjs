const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple dev setup (secure defaults are better for prod)
            webSecurity: false, // CORS 회피 (데브 모드 전용)
            // preload: path.join(__dirname, 'preload.js') 
        },
        backgroundColor: '#050816', // Match our dark theme
        autoHideMenuBar: true,
        // icon: path.join(__dirname, '../public/favicon.ico') 
    });

    // Development: Load Vite dev server
    // Production: Load built file
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

    win.loadURL(startUrl);

    // 디버깅을 위해 개발자 도구 열기
    win.webContents.openDevTools();
}

// 딥링크 프로토콜 등록
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('nexusgg', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('nexusgg');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 두 번째 인스턴스가 실행되면 메인 윈도우를 찾아서 포커스
        console.log('Second instance triggered');
        console.log('Command Line:', commandLine);

        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();

            // 딥링크 URL 찾기
            const deepLinkUrl = commandLine.find((arg) => arg.startsWith('nexusgg://'));
            console.log('Found ID URL:', deepLinkUrl);

            if (deepLinkUrl) {
                // 렌더러로 URL 전달
                win.webContents.send('deep-link', deepLinkUrl);
            }
        }
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
            win.webContents.send('deep-link', url);
        }
    });

    app.whenReady().then(() => {
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
