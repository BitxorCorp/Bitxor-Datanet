"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCache = void 0;
class MemoryCache {
    constructor() {
        this.set = (key, value) => {
            this.store[key] = value;
        };
        this.setArray = (key, value, indexes) => {
            this.store[key] = value;
            this.store[key + 'Indexes'] = {};
            indexes === null || indexes === void 0 ? void 0 : indexes.forEach((index) => {
                this.store[key + 'Indexes'][index] = {};
                value.forEach((item) => (this.store[key + 'Indexes'][index][item[index]] = item));
            });
        };
        this.get = (key) => {
            return this.store[key];
        };
        this.delete = (key) => {
            delete this.store[key];
        };
        this.store = {};
    }
}
exports.memoryCache = new MemoryCache();
