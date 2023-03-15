"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainHeightMonitor = void 0;
const tslib_1 = require("tslib");
const DataBase_1 = require("@src/services/DataBase");
const ApiNodeService_1 = require("@src/services/ApiNodeService");
const infrastructure_1 = require("@src/infrastructure");
const config_1 = require("@src/config");
const utils_1 = require("@src/utils");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
class ChainHeightMonitor {
    constructor(_interval) {
        this.start = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.info(`Start`);
            try {
                this.isRunning = true;
                this.clear();
                yield this.getNodeList();
                yield this.getNodeChainHeight();
                if (this.isRunning) {
                    yield this.updateCollection();
                    yield utils_1.sleep(this.interval);
                    this.start();
                }
            }
            catch (e) {
                logger.error(`Unhandled error during a loop. ${e.message}. Restarting Monitor..`);
                yield utils_1.sleep(this.interval);
                this.stop();
                this.start();
            }
        });
        this.stop = () => {
            logger.info(`Stop`);
            this.isRunning = false;
            this.clear();
        };
        this.getNodeList = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                this.nodeList = (yield DataBase_1.DataBase.getNodeList()).filter((node) => utils_1.isAPIRole(node.roles));
            }
            catch (e) {
                logger.error('[getNodeList] Failed to get node list. Use nodes from config');
                for (const node of config_1.bitxor.NODES) {
                    const url = new URL(node);
                    const hostUrl = yield ApiNodeService_1.ApiNodeService.buildHostUrl(url.hostname);
                    const nodeInfo = yield ApiNodeService_1.ApiNodeService.getNodeInfo(hostUrl);
                    if (nodeInfo) {
                        const status = yield ApiNodeService_1.ApiNodeService.getStatus(nodeInfo.host);
                        if (status.isAvailable)
                            this.nodeList.push(Object.assign({}, nodeInfo));
                    }
                }
            }
            return Promise.resolve();
        });
        this.getNodeChainHeight = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.info(`Getting height stats for ${this.nodeList.length} nodes`);
            yield utils_1.runTaskInChunks(this.nodeList, config_1.monitor.CHAIN_HEIGHT_REQUEST_CHUNK_SIZE, logger, 'getNodeChainHeight', (nodes) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const nodeChainInfoPromises = nodes.map((node) => {
                    var _a;
                    const isHttps = (_a = node.apiStatus) === null || _a === void 0 ? void 0 : _a.isHttpsEnabled;
                    const protocol = isHttps ? 'https:' : 'http:';
                    const port = isHttps ? 3001 : 3000;
                    const hostUrl = `${protocol}//${node.host}:${port}`;
                    return ApiNodeService_1.ApiNodeService.getNodeChainInfo(hostUrl);
                });
                const nodeChainInfoList = yield Promise.all(nodeChainInfoPromises);
                for (const chainInfo of nodeChainInfoList) {
                    try {
                        if (chainInfo) {
                            this.heights[chainInfo.height] = (this.heights[chainInfo.height] || 0) + 1;
                            this.finalizedHeights[chainInfo.latestFinalizedBlock.height] =
                                (this.finalizedHeights[chainInfo.latestFinalizedBlock.height] || 0) + 1;
                        }
                    }
                    catch (e) {
                        logger.error(`Node chain height monitor failed. ${e.message}`);
                    }
                }
                return nodeChainInfoList;
            }));
        });
        this.clear = () => {
            this.nodeList = [];
            this.heights = {};
            this.finalizedHeights = {};
        };
        this.updateCollection = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.info(`Update collection`);
            const nodeHeightStats = {
                height: Object.keys(this.heights).map((height) => ({
                    value: height,
                    count: this.heights[height],
                })),
                finalizedHeight: Object.keys(this.finalizedHeights).map((height) => ({
                    value: height,
                    count: this.finalizedHeights[height],
                })),
                date: new Date(),
            };
            if (nodeHeightStats.height.length > 0 || nodeHeightStats.finalizedHeight.length > 0) {
                yield DataBase_1.DataBase.updateNodeHeightStats(nodeHeightStats);
            }
            else {
                logger.error(`Failed to update collection. Collection length = ${this.nodeList.length}`);
            }
        });
        this.nodeList = [];
        this.isRunning = false;
        this.interval = _interval || 300000;
        this.heights = {};
        this.finalizedHeights = {};
    }
}
exports.ChainHeightMonitor = ChainHeightMonitor;
