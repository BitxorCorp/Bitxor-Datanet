"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeolocationMonitor = void 0;
const tslib_1 = require("tslib");
const DataBase_1 = require("@src/services/DataBase");
const ApiNodeService_1 = require("@src/services/ApiNodeService");
const HostInfo_1 = require("@src/services/HostInfo");
const MemoryCache_1 = require("@src/services/MemoryCache");
const infrastructure_1 = require("@src/infrastructure");
const config_1 = require("@src/config");
const utils_1 = require("@src/utils");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
class GeolocationMonitor {
    constructor(_interval) {
        this.start = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.info(`Start`);
            try {
                this.isRunning = true;
                this.clear();
                yield this.getNodeList();
                yield this.getNodesHostDetail();
                if (this.isRunning) {
                    yield this.cacheCollection();
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
                this.nodeList = yield DataBase_1.DataBase.getNodeList();
            }
            catch (e) {
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
        this.getNodesHostDetail = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.info(`Getting host detail for ${this.nodeList.length} nodes`);
            let counter = 0;
            for (const node of this.nodeList) {
                counter++;
                try {
                    const hostDetail = yield HostInfo_1.HostInfo.getHostDetail(node.host);
                    if (hostDetail) {
                        this.addHostDetail(hostDetail);
                        yield this.addToCollection(hostDetail);
                    }
                }
                catch (e) {
                    logger.error(`Error getting host info. ${e.message}`);
                }
            }
        });
        this.clear = () => {
            this.nodeList = [];
            this.nodesHostDetail = [];
        };
        this.addToCollection = (hostDetail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const nodesHostDetailIndexes = yield MemoryCache_1.memoryCache.get('nodesHostDetailIndexes');
                if (!((_a = nodesHostDetailIndexes === null || nodesHostDetailIndexes === void 0 ? void 0 : nodesHostDetailIndexes.host) === null || _a === void 0 ? void 0 : _a[hostDetail.host])) {
                    yield DataBase_1.DataBase.insertNodeHostDetail(hostDetail);
                    logger.info(`New host info added to collection`);
                }
            }
            catch (e) {
                logger.error(`Failed to add new host info to collection`, e.message);
            }
        });
        this.updateCollection = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.nodesHostDetail.length > 0) {
                logger.info(`Update collection`);
                yield DataBase_1.DataBase.updateNodesHostDetail(this.nodesHostDetail);
            }
            else
                logger.error(`Failed to update collection. Collection length = ${this.nodesHostDetail.length}`);
        });
        this.cacheCollection = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const nodesHostDetail = yield DataBase_1.DataBase.getNodesHostDetail();
                MemoryCache_1.memoryCache.setArray('nodesHostDetail', nodesHostDetail, ['host']);
            }
            catch (e) {
                logger.error('Failed to cache "nodesHostDetail" collection to memory. ' + e.message);
            }
        });
        this.nodeList = [];
        this.isRunning = false;
        this.interval = _interval || 300000;
        this.nodesHostDetail = [];
        this.cacheCollection();
    }
    addHostDetail(hostDetail) {
        if (!this.nodesHostDetail.find((el) => el.host === hostDetail.host))
            this.nodesHostDetail.push(hostDetail);
    }
}
exports.GeolocationMonitor = GeolocationMonitor;
