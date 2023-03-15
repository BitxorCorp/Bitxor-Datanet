"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerNodeService = void 0;
const tslib_1 = require("tslib");
const tcpp = require("tcp-ping");
const utils_1 = require("@src/utils");
const infrastructure_1 = require("@src/infrastructure");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
class PeerNodeService {
}
exports.PeerNodeService = PeerNodeService;
PeerNodeService.tcpProbe = (host, port) => {
    return new Promise((resolve) => {
        tcpp.probe(host, port, function (err, result) {
            if (err) {
                resolve(false);
            }
            resolve(result);
        });
    });
};
PeerNodeService.getStatus = (host, port) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return {
        isAvailable: yield PeerNodeService.tcpProbe(host, port),
        lastStatusCheck: Date.now(),
    };
});
