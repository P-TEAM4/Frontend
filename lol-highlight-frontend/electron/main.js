const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let lolMonitorInterval = null;

// 설정 (메모리에만 저장, 백엔드에서 동기화)
let appSettings = {
    autoLaunch: false,
    autoShowOnLol: true,
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        backgroundColor: '#050816',
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../public/favicon.ico'),
        show: false, // 시작 시 숨김 (트레이로 시작)
    });

    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    mainWindow.loadURL(startUrl);

    // 윈도우가 준비되면 표시
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 윈도우 닫기 버튼 클릭 시 트레이로 최소화
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    // 트레이 아이콘 생성 (간단한 텍스트 아이콘)
    const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFMSURBVFiF7ZaxSgNBEIa/vSwWFhYWFhY+gI+Qh7CwsLGwsLCwsLGwsLCwsLGwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCw+D/YJJfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JPcF9wBxT0rMqKsAAAAASUVORK5CYII='
    );

    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: '자동 시작',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({
                    openAtLogin: menuItem.checked,
                    openAsHidden: true, // 백그라운드로 시작
                });
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('LOL Highlight');
    tray.setContextMenu(contextMenu);

    // 트레이 아이콘 더블클릭으로 윈도우 표시
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
        } else {
            createWindow();
        }
    });
}

// 롤 런처 프로세스 감지
function checkLeagueClient() {
    // 설정에서 자동 표시가 비활성화된 경우 체크하지 않음
    if (!appSettings.autoShowOnLol) {
        console.log('[LOL Monitor] Auto-show disabled, skipping check');
        return;
    }

    // 롤 런처 감지 (League of Legends.app)
    const processName = process.platform === 'win32' 
        ? 'LeagueClient.exe' 
        : 'League of Legends';

    const command = process.platform === 'win32'
        ? `tasklist /FI "IMAGENAME eq ${processName}" /NH`
        : `pgrep -f "League of Legends"`;  // 런처 프로세스 감지

    console.log(`[LOL Monitor] Checking for process: ${processName}`);
    console.log(`[LOL Monitor] Command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        console.log(`[LOL Monitor] Error: ${error}`);
        console.log(`[LOL Monitor] Stdout: ${stdout}`);
        console.log(`[LOL Monitor] Stderr: ${stderr}`);

        if (!error && stdout && stdout.trim().length > 0) {
            // 롤 런처 실행 중 - 메인 윈도우 표시
            console.log('[LOL Monitor] League of Legends detected!');
            if (mainWindow && !mainWindow.isVisible()) {
                console.log('[LOL Monitor] Showing window...');
                mainWindow.show();
            } else if (!mainWindow) {
                console.log('[LOL Monitor] Creating window...');
                createWindow();
            } else {
                console.log('[LOL Monitor] Window already visible');
            }
        } else {
            console.log('[LOL Monitor] League of Legends not detected');
        }
    });
}

// 롤 클라이언트 모니터링 시작
function startLeagueMonitoring() {
    // 5초마다 체크
    lolMonitorInterval = setInterval(checkLeagueClient, 5000);
    // 즉시 한 번 체크
    checkLeagueClient();
}

// 롤 클라이언트 모니터링 중지
function stopLeagueMonitoring() {
    if (lolMonitorInterval) {
        clearInterval(lolMonitorInterval);
        lolMonitorInterval = null;
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    startLeagueMonitoring();
    
    // IPC 핸들러 등록
    setupIpcHandlers();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// IPC 핸들러 설정
function setupIpcHandlers() {
    // 설정 조회
    ipcMain.handle('get-settings', () => {
        return appSettings;
    });

    // 설정 업데이트
    ipcMain.handle('update-settings', (event, settings) => {
        console.log('Updating settings:', settings);
        
        // 설정 업데이트
        appSettings = { ...appSettings, ...settings };
        
        // 자동 시작 설정 적용
        app.setLoginItemSettings({
            openAtLogin: appSettings.autoLaunch,
            openAsHidden: true, // 백그라운드로 시작
        });
        
        console.log('Settings updated:', appSettings);
        return true;
    });
}

app.on('before-quit', () => {
    isQuitting = true;
    stopLeagueMonitoring();
});

app.on('window-all-closed', () => {
    // macOS에서는 트레이 앱으로 계속 실행
    // Windows에서도 트레이로 계속 실행
    // 앱을 완전히 종료하려면 트레이 메뉴에서 "종료" 클릭
});
