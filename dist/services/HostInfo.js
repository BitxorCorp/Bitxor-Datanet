"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostInfo = void 0;
const tslib_1 = require("tslib");
const Http_1 = require("@src/services/Http");
const MemoryCache_1 = require("@src/services/MemoryCache");
const utils_1 = require("@src/utils");
const infrastructure_1 = require("@src/infrastructure");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
class HostInfo {
}
exports.HostInfo = HostInfo;
HostInfo.getHostDetail = (host) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    let coordinates;
    let location = '';
    const cachedHostdetail = yield HostInfo.getHostDetailCached(host);
    if (cachedHostdetail)
        return cachedHostdetail;
    try {
        yield utils_1.sleep(5000);
        const response = yield Http_1.HTTP.get(`http://ip-api.com/json/${host}?fields=33288191&lang=en`);
        const data = response.data;
        coordinates = {
            latitude: data.lat,
            longitude: data.lon,
        };
        location = data.city + ', ' + data.region + ', ' + data.country;
        return {
            host,
            coordinates,
            location,
            ip: data.query,
            organization: data.org,
            as: data.as,
            continent: data.continent,
            country: data.country,
            region: data.region,
            city: data.city,
            district: data.district,
            zip: data.zip,
        };
    }
    catch (e) {
        logger.error(`[getHostDetail] Failed to get host ${host} info ${e.message}`);
        return null;
    }
});
HostInfo.getHostDetailCached = (host) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const nodesHostDetailIndexes = yield MemoryCache_1.memoryCache.get('nodesHostDetailIndexes');
        if (!(nodesHostDetailIndexes === null || nodesHostDetailIndexes === void 0 ? void 0 : nodesHostDetailIndexes.host))
            throw Error();
        const cachedData = nodesHostDetailIndexes.host[host];
        if ((_a = cachedData === null || cachedData === void 0 ? void 0 : cachedData.coordinates) === null || _a === void 0 ? void 0 : _a.latitude) {
            return {
                host: cachedData.host,
                coordinates: cachedData.coordinates,
                location: cachedData.location,
                ip: cachedData.ip,
                organization: cachedData.organization,
                as: cachedData.as,
                continent: cachedData.continent,
                country: cachedData.country,
                region: cachedData.region,
                city: cachedData.city,
                district: cachedData.district,
                zip: cachedData.zip,
            };
        }
        else
            throw Error();
    }
    catch (e) {
        return null;
    }
});
