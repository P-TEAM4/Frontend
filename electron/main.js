const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple dev setup (secure defaults are better for prod)
            // preload: path.join(__dirname, 'preload.js') 
        },
        backgroundColor: '#050816', // Match our dark theme
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../public/favicon.ico') // If exists
    });

    // Development: Load Vite dev server
    // Production: Load built file
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

    win.loadURL(startUrl);

    // Open DevTools in dev mode
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
