"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = exports.PaginationResponse = exports.Order = exports.SortType = void 0;
const tslib_1 = require("tslib");
var SortType;
(function (SortType) {
    SortType[SortType["ASC"] = 1] = "ASC";
    SortType[SortType["DESC"] = -1] = "DESC";
})(SortType = exports.SortType || (exports.SortType = {}));
var Order;
(function (Order) {
    Order["Asc"] = "asc";
    Order["Desc"] = "desc";
})(Order = exports.Order || (exports.Order = {}));
class PaginationResponse {
    constructor(data, searchCriteria, recordsCount) {
        this.data = data;
        this.pageSize = searchCriteria.pageSize;
        this.pageNumber = searchCriteria.pageNumber;
        if (recordsCount)
            this.lastPageNumber = Math.ceil(recordsCount / searchCriteria.pageSize);
    }
}
exports.PaginationResponse = PaginationResponse;
class Pagination {
    static getPage(model, searchCriteria) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const pageIndex = searchCriteria.pageNumber - 1;
            const data = yield model
                .find()
                .sort(searchCriteria.order == Order.Desc ? { _id: -1 } : { _id: 1 })
                .limit(searchCriteria.pageSize)
                .skip(searchCriteria.pageSize * pageIndex)
                .exec();
            return new PaginationResponse(data, searchCriteria);
        });
    }
    static reqToSearchCriteria(req) {
        const pageNumber = parseInt(req.query.pageNumber) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const order = req.query.order || Order.Desc;
        return {
            pageNumber,
            pageSize,
            order,
        };
    }
}
exports.Pagination = Pagination;
