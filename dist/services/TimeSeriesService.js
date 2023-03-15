"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSeriesService = void 0;
const tslib_1 = require("tslib");
const infrastructure_1 = require("@src/infrastructure");
const utils_1 = require("@src/utils");
const logger = infrastructure_1.Logger.getLogger(utils_1.basename(__filename));
const ERROR_REPEATE_TIMEOUT = 5000;
class TimeSeriesService {
    constructor(aggregateType, dayModel, mainModel) {
        this.isInitialized = false;
        this.aggregateType = aggregateType;
        this.dayModel = dayModel;
        this.mainModel = mainModel;
        this.dayCollection = [];
    }
    init() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.getDayCollection();
            this.isInitialized = true;
        });
    }
    setData(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized) {
                if (this.shouldMainCollectionBeUpdated(data)) {
                    const date = this.dayCollection[this.dayCollection.length - 1].date;
                    let sum = {};
                    let mainDocumentValues = {};
                    for (let docIndex = 0; docIndex < this.dayCollection.length; docIndex++) {
                        for (let key of Object.keys(this.dayCollection[docIndex].values)) {
                            if (!sum[key]) {
                                sum[key] = 0;
                            }
                            sum[key] = sum[key] += this.dayCollection[docIndex].values[key];
                        }
                    }
                    let type;
                    switch (this.aggregateType) {
                        case 'average':
                            type = 0;
                            break;
                        case 'average-round':
                            type = 1;
                            break;
                        case 'accumulate':
                            type = 2;
                            break;
                    }
                    if (type === 0 || type === 1) {
                        for (const key of Object.keys(sum)) {
                            const value = sum[key] / this.dayCollection.length;
                            mainDocumentValues[key] = type === 0 ? value : Math.round(value);
                        }
                    }
                    else
                        mainDocumentValues = sum;
                    const mainDocument = {
                        date,
                        values: mainDocumentValues,
                    };
                    yield this.insertToMainCollection(mainDocument);
                    yield this.clearDayCollection();
                }
                yield this.insertToDayCollection(data);
                this.dayCollection.push(data);
            }
            else
                throw Error(`Service is not initialized`);
        });
    }
    shouldMainCollectionBeUpdated(data) {
        if (this.dayCollection.length)
            return this.isDayEnded(this.dayCollection[0].date, data.date);
        return false;
    }
    isDayEnded(currentDate, date) {
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();
        const currentDay = currentDate.getUTCDate();
        const currentMonth = currentDate.getUTCMonth() + 1;
        const currentYear = currentDate.getUTCFullYear();
        if (year > currentYear)
            return true;
        if (year === currentYear && month > currentMonth)
            return true;
        if (year === currentYear && month === currentMonth && day > currentDay)
            return true;
        return false;
    }
    insertToDayCollection(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const document = new this.dayModel(data);
            const collection = document.collection;
            try {
                yield document.save();
                logger.info(`insertToDayCollection. Document has been inserted into ${collection.name}`);
            }
            catch (e) {
                logger.error(`insertToDayCollection. Document could not be saved into ${collection.name}. Error: ${e.message}`);
                logger.error(e);
            }
        });
    }
    insertToMainCollection(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const document = new this.mainModel(data);
            const collection = document.collection;
            try {
                yield document.save();
                logger.info(`insertToMainCollection. Document has been inserted into ${collection.name}`);
            }
            catch (e) {
                logger.error(`insertToMainCollection. Document could not be saved into ${collection.name}. Error: ${e.message}`);
                logger.error(e);
            }
        });
    }
    getDayCollection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const dayCollection = yield this.dayModel.find().exec();
                this.dayCollection = dayCollection.map((el) => ({
                    date: el.date,
                    values: el.values,
                }));
            }
            catch (e) {
                logger.error(`Failed getDayCollection. Error: ${e.message}`);
                yield new Promise((resolve) => setTimeout(() => {
                    this.getDayCollection().then(() => resolve(null));
                }, ERROR_REPEATE_TIMEOUT));
            }
        });
    }
    clearDayCollection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.dayModel.deleteMany();
                this.dayCollection = [];
            }
            catch (e) {
                logger.error(`Failed clearDayCollection. Error: ${e.message}`);
                yield new Promise((resolve) => setTimeout(() => {
                    this.clearDayCollection().then(() => resolve(null));
                }, ERROR_REPEATE_TIMEOUT));
            }
        });
    }
}
exports.TimeSeriesService = TimeSeriesService;
