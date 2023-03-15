"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBase = exports.NodeListOrder = void 0;
const tslib_1 = require("tslib");
const mongoose = require("mongoose");
const utils_1 = require("@src/utils");
const infrastructure_1 = require("@src/infrastructure");
const Node_1 = require("@src/models/Node");
const HostDetail_1 = require("@src/models/HostDetail");
const NodesStats_1 = require("@src/models/NodesStats");
const NodeHeightStats_1 = require("@src/models/NodeHeightStats");
const NodeCountSeries_1 = require("@src/models/NodeCountSeries");
const Pagination_1 = require("@src/infrastructure/Pagination");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
var NodeListOrder;
(function (NodeListOrder) {
    NodeListOrder["Natural"] = "natural";
    NodeListOrder["Random"] = "random";
})(NodeListOrder = exports.NodeListOrder || (exports.NodeListOrder = {}));
class DataBase {
}
exports.DataBase = DataBase;
DataBase.connect = (url) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    catch (err) {
        logger.error(`DataBase Failed to connect MongoDB`);
        throw err;
    }
    logger.info(`DataBase Connected to MongoDB`);
});
DataBase.getNodeList = ({ filter, limit, order } = { filter: {}, limit: 0, order: NodeListOrder.Random }) => {
    if (limit > 0 && order === NodeListOrder.Random) {
        return Node_1.Node.aggregate([{ $match: Object.assign({}, filter) }, { $sample: { size: limit } }]).exec();
    }
    return Node_1.Node
        .find(filter)
        .limit(limit)
        .exec();
};
DataBase.getNodeListWithCriteria = (searchCriteria) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return Pagination_1.Pagination.getPage(Node_1.Node, searchCriteria);
});
DataBase.getNodeByPublicKey = (publicKey) => {
    return Node_1.Node.findOne({ publicKey }).exec();
};
DataBase.getNodeByNodePublicKey = (nodePublicKey) => {
    return Node_1.Node.findOne({ 'apiStatus.nodePublicKey': nodePublicKey }).exec();
};
DataBase.getNodeByHost = (host) => {
    return Node_1.Node.findOne({ host }).exec();
};
DataBase.updateNodeList = (nodeList) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield DataBase.updateCollection(Node_1.Node, nodeList, 'Node');
});
DataBase.updateNode = (node) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield Node_1.Node.findOneAndUpdate({ publicKey: node.publicKey }, node).exec();
});
DataBase.getNodesStats = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return ((_a = (yield NodesStats_1.NodesStats.findOne({}).exec())) === null || _a === void 0 ? void 0 : _a.toObject()) || null;
});
DataBase.getNodeHeightStats = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _b;
    return ((_b = (yield NodeHeightStats_1.NodeHeightStats.findOne({}).exec())) === null || _b === void 0 ? void 0 : _b.toObject()) || null;
});
DataBase.updateNodesStats = (nodeList) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield DataBase.updateCollection(NodesStats_1.NodesStats, [nodeList], 'NodesStats');
});
DataBase.updateNodeHeightStats = (nodeHeightStats) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield DataBase.updateCollection(NodeHeightStats_1.NodeHeightStats, [nodeHeightStats], 'NodeHeightStats');
});
DataBase.getNodesHostDetail = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return HostDetail_1.HostDetail.find().exec();
});
DataBase.insertNodeHostDetail = (hostDetail) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield HostDetail_1.HostDetail.insertMany([hostDetail]);
});
DataBase.updateNodesHostDetail = (hostDetail) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield DataBase.updateCollection(HostDetail_1.HostDetail, hostDetail, 'HostDetail');
});
DataBase.getNodeCountSeries = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return NodeCountSeries_1.NodeCountSeries.find().exec();
});
DataBase.updateCollection = (model, documents, collectionName) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const prevState = yield model.find().exec();
    try {
        yield model.deleteMany();
    }
    catch (e) {
        const msg = `Update collection "${collectionName}" failed. Error during "model.deleteMany()". ${e.message}`;
        logger.error(msg);
        throw new Error(msg);
    }
    try {
        yield model.insertMany(documents);
    }
    catch (e) {
        const msg = `Update collection "${collectionName}" failed. Error during "model.insertMany()". ${e.message}`;
        logger.error(msg);
        throw new Error(msg);
    }
    const currentState = yield model.find().exec();
    if (documents.length !== currentState.length) {
        logger.error(`Update collection "${collectionName}" failed. Collection.length(${currentState.length}) !== documentsToInsert.length(${documents.length})`);
        yield model.insertMany(prevState);
        throw new Error(`Failed to update collection "${collectionName}. Length verification failed`);
    }
});
