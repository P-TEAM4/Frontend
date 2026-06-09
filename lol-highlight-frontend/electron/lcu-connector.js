const https = require('https');
const fs = require('fs');
const path = require('path');

class LCUConnector {
    constructor() {
        this.port = null;
        this.password = null;
        this.connected = false;
        this.baseUrl = '127.0.0.1';
    }

    /**
     * lockfile에서 LCU 인증 정보 추출
     */
    async connect() {
        try {
            const lockfilePath = this.getLockfilePath();
            
            if (!fs.existsSync(lockfilePath)) {
                console.log('[LCU] Lockfile not found:', lockfilePath);
                this.connected = false;
                return false;
            }

            const lockfile = fs.readFileSync(lockfilePath, 'utf8');
            
            // lockfile 파싱: LeagueClientUx:12345:port:password:https
            const parts = lockfile.split(':');
            if (parts.length >= 5) {
                this.port = parts[2];
                this.password = parts[3];
                this.connected = true;
                console.log('[LCU] Connected successfully - Port:', this.port);
                return true;
            }

            console.log('[LCU] Failed to parse lockfile');
            this.connected = false;
            return false;
        } catch (err) {
            console.error('[LCU] Connection failed:', err.message);
            this.connected = false;
            return false;
        }
    }

    /**
     * 플랫폼별 lockfile 경로 반환
     */
    getLockfilePath() {
        if (process.platform === 'win32') {
            return 'C:\\Riot Games\\League of Legends\\lockfile';
        } else if (process.platform === 'darwin') {
            // macOS: /Applications 우선, 없으면 ~/Applications
            const systemPath = '/Applications/League of Legends.app/Contents/LoL/lockfile';
            const userPath = path.join(process.env.HOME, 'Applications/League of Legends.app/Contents/LoL/lockfile');
            return fs.existsSync(systemPath) ? systemPath : userPath;
        }
        throw new Error('Unsupported platform');
    }

    /**
     * LCU API 호출
     */
    async request(endpoint, method = 'GET') {
        if (!this.connected) {
            const connected = await this.connect();
            if (!connected) {
                throw new Error('LCU not connected');
            }
        }

        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseUrl,
                port: this.port,
                path: endpoint,
                method: method,
                auth: `riot:${this.password}`,
                rejectUnauthorized: false, // 자체 서명 인증서 허용
                headers: {
                    'Accept': 'application/json',
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(data));
                        } catch {
                            resolve(data);
                        }
                    } else if (res.statusCode === 404) {
                        // Not Found - 정상적인 응답 (아직 챔피언 선택 전)
                        resolve(null);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (err) => {
                // 연결 오류 시 연결 상태 리셋
                this.connected = false;
                reject(err);
            });

            req.end();
        });
    }

    /**
     * 현재 Champion Select 세션 정보 가져오기
     */
    async getChampSelectSession() {
        try {
            return await this.request('/lol-champ-select/v1/session');
        } catch (err) {
            // Champion Select가 아닌 경우 404 또는 에러
            return null;
        }
    }

    /**
     * 현재 선택한 챔피언 ID 가져오기
     */
    async getCurrentChampionId() {
        try {
            const session = await this.getChampSelectSession();
            
            if (!session || !session.myTeam) {
                return null;
            }

            // 로컬 플레이어의 셀 ID 찾기
            const localPlayerCellId = session.localPlayerCellId;
            
            // 내 팀에서 내 정보 찾기
            const myInfo = session.myTeam.find(player => player.cellId === localPlayerCellId);
            
            if (myInfo && myInfo.championId > 0) {
                return myInfo.championId;
            }

            return null;
        } catch (err) {
            console.error('[LCU] Failed to get champion ID:', err.message);
            return null;
        }
    }

    /**
     * 챔피언 ID를 이름으로 변환
     */
    async getChampionNameById(championId) {
        if (!championId || championId <= 0) {
            return null;
        }

        try {
            // /lol-champions/v1/inventories/{summonerId}/champions/{championId}
            // 또는 간단하게 매핑 테이블 사용
            const championData = await this.request(`/lol-champions/v1/inventories/current/champions/${championId}`);
            
            if (championData && championData.name) {
                return championData.name; // "Ahri", "Zed" 등
            }

            return null;
        } catch (err) {
            console.error('[LCU] Failed to get champion name:', err.message);
            return null;
        }
    }

    /**
     * 현재 선택한 챔피언 이름 가져오기 (통합 메서드)
     */
    async getCurrentChampion() {
        try {
            const championId = await this.getCurrentChampionId();
            
            if (!championId) {
                return null;
            }

            const championName = await this.getChampionNameById(championId);
            return championName;
        } catch (err) {
            console.error('[LCU] Failed to get current champion:', err.message);
            return null;
        }
    }

    /**
     * 게임 페이즈 확인 (챔피언 선택 중인지)
     */
    async isInChampSelect() {
        try {
            const session = await this.getChampSelectSession();
            return session !== null;
        } catch {
            return false;
        }
    }

    /**
     * 현재 게임 플로우 페이즈 반환
     * 가능한 값: None, Lobby, ChampSelect, InProgress, WaitingForStats, EndOfGame, PreEndOfGame
     */
    async getGamePhase() {
        try {
            const phase = await this.request('/lol-gameflow/v1/gameflow-phase');
            return typeof phase === 'string' ? phase.replace(/"/g, '') : phase;
        } catch {
            return null;
        }
    }

    /**
     * 실제 게임이 시작됐는지 확인 (로딩화면 이후)
     * Live Client Data API(포트 2999)가 응답하면 게임 라이브 상태
     */
    async isGameLive() {
        return new Promise((resolve) => {
            const req = https.request({
                hostname: '127.0.0.1',
                port: 2999,
                path: '/liveclientdata/gamestats',
                method: 'GET',
                rejectUnauthorized: false,
            }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(1000, () => { req.destroy(); resolve(false); });
            req.end();
        });
    }

    /**
     * 게임 라이브 상태에서 matchId 직접 획득
     * Live Client Data API의 gameId + 지역 prefix 조합
     */
    async getLiveMatchId() {
        return new Promise(async (resolve) => {
            const req = https.request({
                hostname: '127.0.0.1',
                port: 2999,
                path: '/liveclientdata/gamestats',
                method: 'GET',
                rejectUnauthorized: false,
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', async () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.gameId) {
                            const region = await this.getRegion();
                            resolve({
                                matchId: `${region}_${json.gameId}`,
                                gameTime: typeof json.gameTime === 'number' ? json.gameTime : 0,
                            });
                        } else if (res.statusCode === 200) {
                            // gameId 없는 게임 모드(신속대전 등) — LCU gameflow session에서 fallback
                            try {
                                const region = await this.getRegion();
                                const session = await this.request('/lol-gameflow/v1/session');
                                const gameId = session?.gameData?.gameId;
                                resolve(gameId
                                    ? { matchId: `${region}_${gameId}`, gameTime: 0 }
                                    : { matchId: `${region}_LIVE_${Date.now()}`, gameTime: 0 });
                            } catch {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    } catch {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(1000, () => { req.destroy(); resolve(null); });
            req.end();
        });
    }

    /**
     * 게임 종료 후 matchId 획득
     * LCU /lol-end-of-game/v1/eog-stats-block에서 gameId 추출 후 지역 prefix 조합
     */
    async getEndOfGameMatchId() {
        try {
            const region = await this.getRegion();
            const eog = await this.request('/lol-end-of-game/v1/eog-stats-block');
            if (eog && eog.gameId) {
                return `${region}_${eog.gameId}`;
            }
            return null;
        } catch (err) {
            console.error('[LCU] Failed to get end-of-game matchId:', err.message);
            return null;
        }
    }

    /**
     * 현재 계정의 지역 코드 반환 (예: KR, NA1, EUW1)
     */
    async getRegion() {
        try {
            const data = await this.request('/riotclient/region-locale');
            return data?.region || 'KR';
        } catch {
            return 'KR';
        }
    }

    /**
     * 연결 해제
     */
    disconnect() {
        this.port = null;
        this.password = null;
        this.connected = false;
        console.log('[LCU] Disconnected');
    }
}

// 싱글톤 인스턴스
module.exports = new LCUConnector();
