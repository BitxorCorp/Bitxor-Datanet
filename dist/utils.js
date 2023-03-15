"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitByPredicate = exports.runTaskInChunks = exports.showDuration = exports.splitArray = exports.parseArray = exports.basename = exports.sleep = exports.getNodeURL = exports.isPeerRole = exports.isAPIRole = exports.stringToArray = void 0;
const tslib_1 = require("tslib");
const path = require("path");
const humanizeDuration = require("humanize-duration");
exports.stringToArray = (str) => {
    let result = null;
    try {
        if (typeof str === 'string')
            result = JSON.parse(str);
    }
    catch (e) { }
    return result;
};
exports.isAPIRole = (roleType) => {
    const RolesTypeEnum = [2, 3, 6, 7];
    return !!RolesTypeEnum.find((role) => role === roleType);
};
exports.isPeerRole = (roleType) => {
    const RolesTypeEnum = [1, 3, 5, 7];
    return !!RolesTypeEnum.find((role) => role === roleType);
};
exports.getNodeURL = (node, port) => {
    return `http://${node.host}:${port}`;
};
exports.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.basename = (filename) => {
    return path.basename(filename, '.js');
};
exports.parseArray = (array) => {
    if (Array.isArray(array))
        return array;
    if (typeof array === 'string') {
        try {
            const json = JSON.parse(array);
            if (Array.isArray(json))
                return json;
        }
        catch (e) {
            return null;
        }
    }
    return null;
};
exports.splitArray = (array, chunks) => array.reduce((all, one, i) => {
    const ch = Math.floor(i / chunks);
    all[ch] = [].concat(all[ch] || [], one);
    return all;
}, []);
exports.showDuration = (durationMs) => {
    return humanizeDuration(durationMs);
};
exports.runTaskInChunks = (list, chunkSize, logger, loggingMethod, asyncTask) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (!(list === null || list === void 0 ? void 0 : list.length)) {
        return [];
    }
    if (chunkSize < 1) {
        throw new Error(`Invalid chunkSize value[${chunkSize}]`);
    }
    const chunks = exports.splitArray(list, chunkSize);
    const listSize = list.length;
    logger.info(`[${loggingMethod}] Running the task for chunks, Total Size: ${listSize}, Chunk size: ${chunkSize}, Chunk count: ${Math.ceil(listSize / chunkSize)}`);
    let numOfNodesProcessed = 0, i = 0;
    for (const chunk of chunks) {
        logger.info(`[${loggingMethod}] Working on chunk #${++i}/${chunks.length}, size: ${chunk.length}, progress: ${numOfNodesProcessed}/${listSize}`);
        const arrayOfTaskResults = yield asyncTask(chunk);
        logger.info(`[${loggingMethod}] Number of results:${arrayOfTaskResults.length}  in the chunk of ${chunk.length}`);
        numOfNodesProcessed += chunk.length;
    }
});
exports.splitByPredicate = (predicate, arr) => {
    return arr.reduce((res, item) => {
        res[predicate(item) ? 'filtered' : 'unfiltered'].push(item);
        return res;
    }, { filtered: [], unfiltered: [] });
};
