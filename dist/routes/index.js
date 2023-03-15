"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const tslib_1 = require("tslib");
const DataBase_1 = require("@src/services/DataBase");
const Error_1 = require("@src/infrastructure/Error");
const config_1 = require("@src/config");
var NodeFilter;
(function (NodeFilter) {
    NodeFilter["Preferred"] = "preferred";
    NodeFilter["Suggested"] = "suggested";
})(NodeFilter || (NodeFilter = {}));
class Routes {
}
exports.Routes = Routes;
Routes.register = (app) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    app.get('/nodes', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { filter, limit, ssl, order } = req.query;
        let searchCriteria = {
            filter: {},
            limit: Number(limit) || 0,
            order: order ? order.toLowerCase() : DataBase_1.NodeListOrder.Random,
        };
        if (ssl) {
            const isSSL = ssl.toString().toLocaleLowerCase() === 'true';
            Object.assign(searchCriteria.filter, {
                'apiStatus.isHttpsEnabled': isSSL,
                'apiStatus.webSocket.wss': isSSL,
                'apiStatus.webSocket.isAvailable': true,
                version: { $gte: config_1.bitxor.MIN_PARTNER_NODE_VERSION },
            });
        }
        if (filter && filter !== NodeFilter.Preferred && filter !== NodeFilter.Suggested) {
            return Error_1.UnsupportedFilterError.send(res, filter);
        }
        if (filter === NodeFilter.Preferred) {
            if (!((_a = config_1.bitxor.PREFERRED_NODES) === null || _a === void 0 ? void 0 : _a.length)) {
                return Promise.resolve(res.send([]));
            }
            Object.assign(searchCriteria.filter, {
                host: { $in: config_1.bitxor.PREFERRED_NODES.map((node) => new RegExp(`^${node}`, 'i')) },
                'apiStatus.isAvailable': true,
                'apiStatus.nodeStatus.apiNode': 'up',
                'apiStatus.nodeStatus.db': 'up',
                version: { $gte: config_1.bitxor.MIN_PARTNER_NODE_VERSION },
            });
        }
        if (filter === NodeFilter.Suggested) {
            Object.assign(searchCriteria.filter, {
                'apiStatus.isAvailable': true,
                'apiStatus.nodeStatus.apiNode': 'up',
                'apiStatus.nodeStatus.db': 'up',
                version: { $gte: config_1.bitxor.MIN_PARTNER_NODE_VERSION },
            });
        }
        return DataBase_1.DataBase.getNodeList(searchCriteria)
            .then((nodes) => res.send(nodes))
            .catch((error) => Error_1.InternalServerError.send(res, error));
    }));
    app.get('/nodesHostDetail', (req, res) => {
        return DataBase_1.DataBase.getNodesHostDetail()
            .then((nodes) => res.send(nodes))
            .catch((error) => Error_1.InternalServerError.send(res, error));
    });
    app.get('/nodes/:publicKey', (req, res) => {
        const publicKey = req.params.publicKey;
        return DataBase_1.DataBase.getNodeByPublicKey(publicKey)
            .then((node) => {
            if (node)
                res.send(node);
            else
                Error_1.NotFoundError.send(res, 'publicKey', publicKey);
        })
            .catch((error) => Error_1.InternalServerError.send(res, error));
    });
    app.get('/nodes/nodePublicKey/:nodePublicKey', (req, res) => {
        const nodePublicKey = req.params.nodePublicKey;
        return DataBase_1.DataBase.getNodeByNodePublicKey(nodePublicKey)
            .then((node) => {
            if (node) {
                res.send(node);
            }
            else {
                Error_1.NotFoundError.send(res, 'nodePublicKey', nodePublicKey);
            }
        })
            .catch((error) => Error_1.InternalServerError.send(res, error));
    });
    app.get('/nodesStats', (req, res) => {
        return DataBase_1.DataBase.getNodesStats()
            .then((stats) => res.send(stats))
            .catch((error) => Error_1.InternalServerError.send(res, error));
    });
    app.get('/nodesHeightStats', (req, res) => {
        return DataBase_1.DataBase.getNodeHeightStats()
            .then((stats) => res.send(stats))
            .catch((error) => Error_1.InternalServerError.send(res, error));
    });
    app.get('/timeSeries/nodeCount', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        return DataBase_1.DataBase.getNodeCountSeries()
            .then((data) => res.send(data))
            .catch((error) => Error_1.InternalServerError.send(res, error));
    }));
});
