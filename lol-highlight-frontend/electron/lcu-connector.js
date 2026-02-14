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
            // macOS
            return path.join(
                process.env.HOME,
                'Applications/League of Legends.app/Contents/LoL/lockfile'
            );
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
