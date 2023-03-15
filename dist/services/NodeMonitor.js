"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMonitor = void 0;
const tslib_1 = require("tslib");
const Http_1 = require("@src/services/Http");
const DataBase_1 = require("@src/services/DataBase");
const HostInfo_1 = require("@src/services/HostInfo");
const ApiNodeService_1 = require("@src/services/ApiNodeService");
const PeerNodeService_1 = require("@src/services/PeerNodeService");
const NodesStats_1 = require("@src/services/NodesStats");
const TimeSeriesService_1 = require("@src/services/TimeSeriesService");
const NodeCountSeries_1 = require("@src/models/NodeCountSeries");
const MemoryCache_1 = require("@src/services/MemoryCache");
const infrastructure_1 = require("@src/infrastructure");
const Node_1 = require("@src/models/Node");
const config_1 = require("@src/config");
const utils_1 = require("@src/utils");
const humanizeDuration = require("humanize-duration");
const constants_1 = require("@src/constants");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
class NodeMonitor {
    constructor(_interval) {
        this.init = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.nodeCountTimeSeriesService.init();
            return this;
        });
        this.start = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger.info(`Start`);
            const startTime = new Date().getTime();
            try {
                this.isRunning = true;
                this.clear();
                yield this.fetchAndSetNetworkInfo();
                yield this.getNodeList();
                yield this.getNodeListInfo();
                if (this.isRunning) {
                    yield this.updateCollection();
                    yield this.cacheCollection();
                    setTimeout(() => this.start(), this.interval);
                }
                logger.info(`[start] Node monitor task finished, time elapsed: [${utils_1.showDuration(startTime - new Date().getTime())}]`);
            }
            catch (e) {
                logger.error(`[start] Node monitor task failed [error: ${e.message}], time elapsed: [${utils_1.showDuration(startTime - new Date().getTime())}], Restarting Node monitor task...`);
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
            logger.info(`[getNodeList] Getting node list...`);
            const startTime = new Date().getTime();
            const nodesFromDb = (yield DataBase_1.DataBase.getNodeList().then((nodes) => nodes.map((n) => n.toJSON()))) || [];
            logger.info(`[getNodeList] Nodes count from DB: ${nodesFromDb.length}`);
            this.addNodesToList(nodesFromDb);
            logger.info(`[getNodeList] Initial node list: ${config_1.bitxor.NODES.join(', ')}`);
            for (const nodeUrl of config_1.bitxor.NODES) {
                const peers = yield this.fetchNodePeersByURL(nodeUrl);
                this.addNodesToList(peers);
            }
            yield this.fetchAndAddNodeListPeers();
            logger.info(`[getNodeList] Total node count: ${this.nodeList.length}, time elapsed: [${utils_1.showDuration(startTime - new Date().getTime())}]`);
            return Promise.resolve();
        });
        this.fetchNodePeersByURL = (hostUrl) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let nodeList = [];
            try {
                const nodePeers = yield Http_1.HTTP.get(hostUrl + '/node/peers', {
                    timeout: config_1.monitor.REQUEST_TIMEOUT,
                });
                if (Array.isArray(nodePeers.data))
                    nodeList = [...nodePeers.data];
            }
            catch (e) {
                logger.error(`[FetchNodePeersByURL] Failed to get /node/peers from "${hostUrl}". ${e.message}`);
            }
            return nodeList;
        });
        this.fetchAndAddNodeListPeers = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiNodeList = this.nodeList.filter((node) => utils_1.isAPIRole(node.roles));
            logger.info(`[fetchAndAddNodeListPeers] Getting peers from nodes, total nodes: ${this.nodeList.length}, api nodes: ${apiNodeList.length}`);
            yield utils_1.runTaskInChunks(apiNodeList, this.nodePeersChunkSize, logger, 'fetchAndAddNodeListPeers', (nodes) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const arrayOfPeerList = yield Promise.all([...nodes].map((node) => tslib_1.__awaiter(this, void 0, void 0, function* () { return this.fetchNodePeersByURL(yield ApiNodeService_1.ApiNodeService.buildHostUrl(node.host)); })));
                const peers = arrayOfPeerList.reduce((accumulator, value) => accumulator.concat(value), []);
                this.addNodesToList(peers);
                return peers;
            }));
        });
        this.getNodeListInfo = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const startTime = new Date().getTime();
            const nodeCount = this.nodeList.length;
            logger.info(`[getNodeListInfo] Getting node from peers, total nodes: ${nodeCount}`);
            yield utils_1.runTaskInChunks(this.nodeList, this.nodeInfoChunks, logger, 'getNodeListInfo', (nodes) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const nodeInfoPromises = [...nodes].map((node) => this.getNodeInfo(node));
                const arrayOfNodeInfo = yield Promise.all(nodeInfoPromises);
                this.addNodesToNodeInfoList(arrayOfNodeInfo.filter((node) => !!node));
                return arrayOfNodeInfo;
            }));
            this.nodeInfoList.forEach((node) => this.nodesStats.addToStats(node));
            logger.info(`[getNodeListInfo] Total node count(after nodeInfo): ${this.nodeInfoList.length}, time elapsed: [${utils_1.showDuration(startTime - new Date().getTime())}]`);
        });
        this.clear = () => {
            logger.info(`Clear`);
            this.nodeList = [];
            this.nodeInfoList = [];
            this.nodesStats.clear();
        };
        this.updateCollection = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.nodeCountTimeSeriesService.setData({
                date: new Date(),
                values: Object.assign(Object.assign({}, this.nodesStats.nodeTypes), { total: this.nodesStats.getTotal() }),
            });
            if (this.nodeInfoList.length > 0) {
                logger.info(`Update collection`);
                const prevNodeList = yield DataBase_1.DataBase.getNodeList();
                this.nodeInfoList = this.removeStaleNodesAndUpdateLastAvailable(this.nodeInfoList);
                try {
                    yield DataBase_1.DataBase.updateNodeList(this.nodeInfoList);
                    yield DataBase_1.DataBase.updateNodesStats(this.nodesStats);
                }
                catch (e) {
                    logger.error(`Failed to update collection. ${e.message}`);
                    yield DataBase_1.DataBase.updateNodeList(prevNodeList);
                }
            }
            else
                logger.error(`Failed to update collection. Collection length = ${this.nodeInfoList.length}`);
        });
        this.checkNodeStale = (node) => {
            return (!this.checkNodeAvailable(node) &&
                !!node.lastAvailable &&
                new Date().getTime() > node.lastAvailable.getTime() + config_1.monitor.KEEP_STALE_NODES_FOR_HOURS * constants_1.Constants.TIME_UNIT_HOUR);
        };
        this.checkNodeAvailable = (node) => {
            var _a, _b, _c, _d;
            let available = true;
            if (utils_1.isAPIRole(node.roles) && utils_1.isPeerRole(node.roles)) {
                available = !!((_a = node.apiStatus) === null || _a === void 0 ? void 0 : _a.isAvailable) || !!((_b = node.peerStatus) === null || _b === void 0 ? void 0 : _b.isAvailable);
            }
            else if (utils_1.isAPIRole(node.roles)) {
                available = !!((_c = node.apiStatus) === null || _c === void 0 ? void 0 : _c.isAvailable);
            }
            else if (utils_1.isPeerRole(node.roles)) {
                available = !!((_d = node.peerStatus) === null || _d === void 0 ? void 0 : _d.isAvailable);
            }
            return available;
        };
        this.addNodesToList = (nodes) => {
            nodes.forEach((node) => {
                if (node.networkIdentifier !== this.networkIdentifier ||
                    node.networkGenerationHashSeed !== this.generationHashSeed ||
                    !Node_1.validateNodeModel(node)) {
                    return;
                }
                const nodeInx = this.nodeList.findIndex((addedNode) => addedNode.publicKey === node.publicKey);
                if (nodeInx > -1) {
                    let lastAvailable = this.nodeList[nodeInx].lastAvailable || node.lastAvailable;
                    if (lastAvailable === undefined && !this.checkNodeAvailable(node)) {
                        lastAvailable = new Date();
                    }
                    this.nodeList[nodeInx] = Object.assign(Object.assign({}, node), { lastAvailable });
                }
                else {
                    if (!node.lastAvailable && !this.checkNodeAvailable(node)) {
                        node.lastAvailable = new Date();
                    }
                    this.nodeList.push(node);
                }
            });
        };
        this.addNodesToNodeInfoList = (nodes) => {
            this.nodeInfoList = this.nodeInfoList.concat(nodes);
        };
        this.nodesStats = new NodesStats_1.NodesStats();
        this.nodeCountTimeSeriesService = new TimeSeriesService_1.TimeSeriesService('average-round', NodeCountSeries_1.NodeCountSeriesDay, NodeCountSeries_1.NodeCountSeries);
        this.nodeList = [];
        this.nodeInfoList = [];
        this.isRunning = false;
        this.interval = _interval || 300000;
        this.nodeInfoChunks = config_1.monitor.NUMBER_OF_NODE_REQUEST_CHUNK;
        this.nodePeersChunkSize = config_1.monitor.NODE_PEERS_REQUEST_CHUNK_SIZE;
        this.networkIdentifier = 0;
        this.generationHashSeed = '';
        this.cacheCollection();
    }
    getNodeInfo(node) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let nodeWithInfo = Object.assign({}, node);
            const nodeHost = node.host;
            try {
                const hostDetail = yield HostInfo_1.HostInfo.getHostDetailCached(nodeHost);
                if (hostDetail) {
                    nodeWithInfo.hostDetail = hostDetail;
                }
                if (utils_1.isPeerRole(nodeWithInfo.roles)) {
                    nodeWithInfo.peerStatus = yield PeerNodeService_1.PeerNodeService.getStatus(nodeHost, node.port);
                }
                if (utils_1.isAPIRole(nodeWithInfo.roles)) {
                    const hostUrl = yield ApiNodeService_1.ApiNodeService.buildHostUrl(nodeHost);
                    const nodeStatus = yield ApiNodeService_1.ApiNodeService.getNodeInfo(hostUrl);
                    if (nodeStatus) {
                        if (nodeStatus.publicKey !== node.publicKey ||
                            nodeStatus.networkIdentifier !== this.networkIdentifier ||
                            nodeStatus.networkGenerationHashSeed !== this.generationHashSeed) {
                            return undefined;
                        }
                        Object.assign(nodeWithInfo, nodeStatus);
                        if (!nodeWithInfo.host) {
                            nodeWithInfo.host = nodeHost;
                        }
                    }
                    if (nodeWithInfo.networkIdentifier === this.networkIdentifier &&
                        nodeWithInfo.networkGenerationHashSeed === this.generationHashSeed) {
                        nodeWithInfo.apiStatus = yield ApiNodeService_1.ApiNodeService.getStatus(hostUrl);
                    }
                }
            }
            catch (e) {
                logger.error(`[getNodeInfo] Failed to fetch info for "${nodeWithInfo.host}". ${e.message}`);
            }
            return nodeWithInfo;
        });
    }
    removeStaleNodesAndUpdateLastAvailable(nodes) {
        let { filtered: availableNodes, unfiltered: unavailableNodes } = utils_1.splitByPredicate((n) => this.checkNodeAvailable(n), nodes);
        availableNodes = availableNodes.map((n) => (Object.assign(Object.assign({}, n), { lastAvailable: new Date() })));
        let { filtered: staleNodes, unfiltered: soonTobeStaleNodes } = utils_1.splitByPredicate((n) => this.checkNodeStale(n), unavailableNodes);
        logger.info(`[updateCollection] Removing stale nodes[${staleNodes
            .map((n) => n.host)
            .join(', ')}], available ones in the last ${humanizeDuration(config_1.monitor.KEEP_STALE_NODES_FOR_HOURS * constants_1.Constants.TIME_UNIT_HOUR)} are kept.`);
        return [...availableNodes, ...soonTobeStaleNodes];
    }
    cacheCollection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const nodeList = yield DataBase_1.DataBase.getNodeList();
                MemoryCache_1.memoryCache.set('nodeList', nodeList);
            }
            catch (e) {
                logger.error('Failed to cache Node collection to memory. ' + e.message);
            }
        });
    }
    fetchAndSetNetworkInfo() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const nodeUrl of config_1.bitxor.NODES) {
                const url = new URL(nodeUrl);
                const hostUrl = yield ApiNodeService_1.ApiNodeService.buildHostUrl(url.hostname);
                const nodeInfo = yield ApiNodeService_1.ApiNodeService.getNodeInfo(hostUrl);
                if (nodeInfo) {
                    this.networkIdentifier = nodeInfo.networkIdentifier;
                    this.generationHashSeed = nodeInfo.networkGenerationHashSeed;
                    logger.info(`Found network identifier ${nodeInfo.networkIdentifier}`);
                    logger.info(`Found network hash ${nodeInfo.networkGenerationHashSeed}`);
                    return;
                }
            }
            logger.info(`Network identifier not found in ${config_1.bitxor.NODES}, using default ${this.networkIdentifier}`);
        });
    }
}
exports.NodeMonitor = NodeMonitor;
