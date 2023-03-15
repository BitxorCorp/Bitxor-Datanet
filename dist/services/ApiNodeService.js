"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiNodeService = void 0;
const tslib_1 = require("tslib");
const Http_1 = require("@src/services/Http");
const utils_1 = require("@src/utils");
const infrastructure_1 = require("@src/infrastructure");
const ws_1 = require("ws");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
class ApiNodeService {
}
exports.ApiNodeService = ApiNodeService;
ApiNodeService.getStatus = (hostUrl) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const { protocol, hostname } = new URL(hostUrl);
        const isHttps = protocol === 'https:';
        logger.info(`Getting node status for: ${hostUrl}`);
        let apiStatus = {
            restGatewayUrl: `${hostUrl}`,
            isAvailable: false,
            isHttpsEnabled: isHttps,
            lastStatusCheck: Date.now(),
            webSocket: {
                isAvailable: false,
                wss: false,
                url: undefined,
            },
        };
        const chainInfo = yield ApiNodeService.getNodeChainInfo(hostUrl);
        if (!chainInfo) {
            return apiStatus;
        }
        const [nodeInfo, nodeServer, nodeHealth] = yield Promise.all([
            ApiNodeService.getNodeInfo(hostUrl),
            ApiNodeService.getNodeServer(hostUrl),
            ApiNodeService.getNodeHealth(hostUrl),
        ]);
        if (nodeInfo) {
            Object.assign(apiStatus, {
                nodePublicKey: nodeInfo.nodePublicKey,
            });
        }
        if (chainInfo) {
            Object.assign(apiStatus, {
                isAvailable: true,
                chainHeight: chainInfo.height,
                finalization: {
                    height: Number(chainInfo.latestFinalizedBlock.height),
                    epoch: chainInfo.latestFinalizedBlock.finalizationEpoch,
                    point: chainInfo.latestFinalizedBlock.finalizationPoint,
                    hash: chainInfo.latestFinalizedBlock.hash,
                },
            });
        }
        const webSocketStatus = yield ApiNodeService.webSocketStatus(hostname, isHttps);
        if (webSocketStatus) {
            Object.assign(apiStatus, {
                webSocket: webSocketStatus,
            });
        }
        if (nodeHealth) {
            Object.assign(apiStatus, {
                nodeStatus: nodeHealth,
            });
        }
        if (nodeServer) {
            Object.assign(apiStatus, {
                restVersion: nodeServer.restVersion,
            });
        }
        return apiStatus;
    }
    catch (e) {
        logger.error(`Fail to request host node status: ${hostUrl}`, e);
        return {
            restGatewayUrl: `${hostUrl}`,
            webSocket: {
                isAvailable: false,
                wss: false,
                url: undefined,
            },
            isAvailable: false,
            lastStatusCheck: Date.now(),
        };
    }
});
ApiNodeService.getNodeInfo = (hostUrl) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield Http_1.HTTP.get(`${hostUrl}/node/info`)).data;
    }
    catch (e) {
        logger.error(`[getNodeInfo] Fail to request /node/info: ${hostUrl}`, e);
        return null;
    }
});
ApiNodeService.getNodeChainInfo = (hostUrl) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        return (yield Http_1.HTTP.get(`${hostUrl}/chain/info`)).data;
    }
    catch (e) {
        logger.error(`[getNodeChainInfo] Fail to request /chain/info: ${hostUrl}`, e);
        return null;
    }
});
ApiNodeService.getNodeServer = (hostUrl) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const nodeServerInfo = (yield Http_1.HTTP.get(`${hostUrl}/node/server`)).data;
        return nodeServerInfo.serverInfo;
    }
    catch (e) {
        logger.error(`[getNodeServer] Fail to request /node/server: ${hostUrl}`, e);
        return null;
    }
});
ApiNodeService.getNodeHealth = (hostUrl) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const health = (yield Http_1.HTTP.get(`${hostUrl}/node/health`)).data;
        return health.status;
    }
    catch (e) {
        logger.error(`[getNodeHealth] Fail to request /node/health: ${hostUrl}`, e);
        return null;
    }
});
ApiNodeService.isHttpsEnabled = (host, port = 3001) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Http_1.HTTP.get(`https://${host}:${port}/chain/info`);
        return true;
    }
    catch (e) {
        return false;
    }
});
ApiNodeService.checkWebSocketHealth = (host, port, protocol, timeout = 1000) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const clientWS = new ws_1.WebSocket(`${protocol}//${host}:${port}/ws`, {
            timeout,
        });
        clientWS.on('open', () => {
            resolve(true);
        });
        clientWS.on('error', (e) => {
            logger.error(`Fail to request web socket heartbeat: ${protocol}//${host}:${port}/ws`, e);
            resolve(false);
        });
    });
});
ApiNodeService.webSocketStatus = (hostname, isHttp) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    let webSocketUrl = undefined;
    let wssHealth = false;
    if (isHttp) {
        wssHealth = yield ApiNodeService.checkWebSocketHealth(hostname, 3001, 'wss:');
    }
    if (wssHealth) {
        webSocketUrl = `wss://${hostname}:3001/ws`;
    }
    else {
        const wsHealth = yield ApiNodeService.checkWebSocketHealth(hostname, 3000, 'ws:');
        webSocketUrl = wsHealth ? `ws://${hostname}:3000/ws` : undefined;
    }
    return {
        isAvailable: webSocketUrl ? true : false,
        wss: wssHealth,
        url: webSocketUrl,
    };
});
ApiNodeService.buildHostUrl = (hostname) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const isHttps = yield ApiNodeService.isHttpsEnabled(hostname);
    const protocol = isHttps ? 'https:' : 'http:';
    const port = isHttps ? 3001 : 3000;
    return `${protocol}//${hostname}:${port}`;
});
