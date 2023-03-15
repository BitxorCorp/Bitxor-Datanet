"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("module-alias/register");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const config = require("./config");
const DataBase_1 = require("./services/DataBase");
const NodeMonitor_1 = require("./services/NodeMonitor");
const ChainHeightMonitor_1 = require("./services/ChainHeightMonitor");
const GeolocationMonitor_1 = require("./services/GeolocationMonitor");
const routes_1 = require("./routes");
const infrastructure_1 = require("./infrastructure");
const utils = require("@src/utils");
const logger = infrastructure_1.Logger.getLogger(utils.basename(__filename));
class App {
}
App.start = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    config.verifyConfig(config);
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors());
    app.use('/openapi', express.static('openapi'));
    yield DataBase_1.DataBase.connect(config.db.MONGODB_ENDPOINT);
    yield routes_1.Routes.register(app);
    (yield new NodeMonitor_1.NodeMonitor(config.monitor.NODE_MONITOR_SCHEDULE_INTERVAL).init()).start();
    new ChainHeightMonitor_1.ChainHeightMonitor(config.monitor.CHAIN_HEIGHT_MONITOR_SCHEDULE_INTERVAL).start();
    new GeolocationMonitor_1.GeolocationMonitor(config.monitor.GEOLOCATION_MONITOR_SCHEDULE_INTERVAL).start();
    app.listen(config.network.PORT, () => {
        logger.info(`Server is running on port: ${config.network.PORT}`);
    });
});
App.start();
