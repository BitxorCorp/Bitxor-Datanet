"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP = void 0;
const axios_1 = require("axios");
const config_1 = require("@src/config");
const REQEST_TIMEOUT = config_1.monitor.REQUEST_TIMEOUT;
class HTTP {
    static get(url, config) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(Error(`HTTP get request failed. Timeout error`));
            }, REQEST_TIMEOUT + REQEST_TIMEOUT * 0.1);
            axios_1.default
                .get(url, Object.assign({ timeout: REQEST_TIMEOUT }, config))
                .then((response) => {
                clearTimeout(timeout);
                resolve(response);
            })
                .catch((e) => {
                clearTimeout(timeout);
                reject(e);
            });
        });
    }
}
exports.HTTP = HTTP;
