const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const lcuConnector = require('./lcu-connector');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let lolMonitorInterval = null;
let championCheckInterval = null;
let lastNotifiedChampion = null;

// 게임 상태 머신: NONE → LOADING → IN_GAME → ENDED
let gameState = 'NONE';
let gamePhaseInterval = null;
let liveGamePollInterval = null;
let currentMatchId = null;

let appSettings = {
    autoLaunch: false,
    autoShowOnLol: true,
    showChampionStats: true,
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
        show: false,
    });

    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

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
    const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFMSURBVFiF7ZaxSgNBEIa/vSwWFhYWFhY+gI+Qh7CwsLGwsLCwsLGwsLCwsLGwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCw+D/YJJfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JHdJ7pLcJblLcpfkLsldkrskd0nuktwluUtyl+QuyV2SuyR3Se6S3CW5S3KX5C7JXZK7JPcF9wBxT0rMqKsAAAAASUVORK5CYII='
    );

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
            click: () => {
                if (mainWindow) mainWindow.show();
                else createWindow();
            }
        },
        {
            label: '자동 시작',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({ openAtLogin: menuItem.checked, openAsHidden: true });
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => { isQuitting = true; app.quit(); }
        }
    ]);

    tray.setToolTip('LOL Highlight');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        if (mainWindow) mainWindow.show();
        else createWindow();
    });
}

// ─── 롤 클라이언트 감지 ───────────────────────────────────────

async function checkLeagueClient() {
    if (!appSettings.autoShowOnLol) return;

    const processName = process.platform === 'win32' ? 'LeagueClient.exe' : 'League of Legends';
    const command = process.platform === 'win32'
        ? `tasklist /FI "IMAGENAME eq ${processName}" /NH`
        : `pgrep -f "League of Legends"`;

    exec(command, async (error, stdout) => {
        if (!error && stdout && stdout.trim().length > 0) {
            if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
            else if (!mainWindow) createWindow();

            const connected = await lcuConnector.connect();
            if (connected) {
                if (appSettings.showChampionStats) startChampionMonitoring();
                startGamePhaseMonitoring();
            }
        } else {
            stopChampionMonitoring();
            stopGamePhaseMonitoring();
        }
    });
}

function startLeagueMonitoring() {
    lolMonitorInterval = setInterval(checkLeagueClient, 5000);
    checkLeagueClient();
}

function stopLeagueMonitoring() {
    if (lolMonitorInterval) { clearInterval(lolMonitorInterval); lolMonitorInterval = null; }
    stopChampionMonitoring();
    stopGamePhaseMonitoring();
}

// ─── 챔피언 선택 모니터링 ────────────────────────────────────

async function monitorChampionSelect() {
    if (!appSettings.showChampionStats) return;
    try {
        const champion = await lcuConnector.getCurrentChampion();
        if (champion && champion !== lastNotifiedChampion) {
            mainWindow?.webContents.send('champion-selected', champion);
            lastNotifiedChampion = champion;
        } else if (!champion && lastNotifiedChampion) {
            lastNotifiedChampion = null;
        }
    } catch (err) {
        console.error('[Champion Monitor] Error:', err.message);
    }
}

function startChampionMonitoring() {
    if (!championCheckInterval) {
        championCheckInterval = setInterval(monitorChampionSelect, 2000);
        monitorChampionSelect();
    }
}

function stopChampionMonitoring() {
    if (championCheckInterval) {
        clearInterval(championCheckInterval);
        championCheckInterval = null;
        lastNotifiedChampion = null;
        lcuConnector.disconnect();
    }
}

// ─── 게임 페이즈 모니터링 ────────────────────────────────────

async function checkGamePhase() {
    try {
        const phase = await lcuConnector.getGamePhase();
        if (!phase) return;

        console.log(`[Game Monitor] Phase: ${phase}, State: ${gameState}`);

        if (phase === 'InProgress' && gameState === 'NONE') {
            // 로딩화면 시작 → Live Client 폴링 시작
            gameState = 'LOADING';
            console.log('[Game Monitor] Loading screen detected, waiting for game live...');
            startLiveGamePolling();

        } else if (['WaitingForStats', 'EndOfGame', 'PreEndOfGame'].includes(phase)
                && (gameState === 'LOADING' || gameState === 'IN_GAME')) {
            // 게임 종료
            console.log('[Game Monitor] Game ended');
            stopLiveGamePolling();
            gameState = 'ENDED';

            // 게임 시작 시 저장한 matchId 우선 사용, 없으면 EOG에서 획득
            const matchId = currentMatchId || await lcuConnector.getEndOfGameMatchId();
            console.log('[Game Monitor] Match ID:', matchId);
            mainWindow?.webContents.send('game-ended', { matchId });

            // 30초 후 상태 초기화
            setTimeout(() => { gameState = 'NONE'; currentMatchId = null; }, 30000);

        } else if (['None', 'Lobby'].includes(phase) && gameState !== 'NONE') {
            stopLiveGamePolling();
            gameState = 'NONE';
        }
    } catch (err) {
        console.error('[Game Monitor] Error:', err.message);
    }
}

function startGamePhaseMonitoring() {
    if (!gamePhaseInterval) {
        console.log('[Game Monitor] Starting game phase monitoring...');
        gamePhaseInterval = setInterval(checkGamePhase, 3000);
        checkGamePhase();
    }
}

function stopGamePhaseMonitoring() {
    if (gamePhaseInterval) {
        clearInterval(gamePhaseInterval);
        gamePhaseInterval = null;
    }
    stopLiveGamePolling();
    gameState = 'NONE';
}

// ─── 실제 게임 시작 감지 (로딩화면 → 인게임) ─────────────────

function startLiveGamePolling() {
    if (liveGamePollInterval) return;
    liveGamePollInterval = setInterval(async () => {
        if (gameState !== 'LOADING') {
            stopLiveGamePolling();
            return;
        }
        const matchId = await lcuConnector.getLiveMatchId();
        if (matchId) {
            console.log('[Game Monitor] Game is now LIVE — matchId:', matchId);
            currentMatchId = matchId;
            gameState = 'IN_GAME';
            stopLiveGamePolling();
            mainWindow?.webContents.send('game-started', { matchId });
        }
    }, 2000);
}

function stopLiveGamePolling() {
    if (liveGamePollInterval) {
        clearInterval(liveGamePollInterval);
        liveGamePollInterval = null;
    }
}

// ─── 앱 초기화 ────────────────────────────────────────────────

app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
    createTray();
    startLeagueMonitoring();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

function setupIpcHandlers() {
    ipcMain.handle('get-settings', () => appSettings);

    ipcMain.handle('update-settings', (event, settings) => {
        appSettings = { ...appSettings, ...settings };
        app.setLoginItemSettings({ openAtLogin: appSettings.autoLaunch, openAsHidden: true });
        return true;
    });

    ipcMain.handle('get-screen-sources', async () => {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        return sources.map(s => ({ id: s.id, name: s.name }));
    });

    ipcMain.handle('save-video', (event, { buffer, filename }) => {
        const recordingsDir = path.join(app.getPath('documents'), 'LOL-Recordings');
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }
        const filePath = path.join(recordingsDir, filename);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log('[Recorder] Video saved to:', filePath);
        return filePath;
    });
}

app.on('before-quit', () => {
    isQuitting = true;
    stopLeagueMonitoring();
});

app.on('window-all-closed', () => {
    // 트레이로 계속 실행 (종료는 트레이 메뉴에서)
});
