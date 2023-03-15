"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCountSeriesDay = exports.NodeCountSeries = void 0;
const mongoose = require("mongoose");
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
    },
    values: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
});
exports.NodeCountSeries = mongoose.model('NodeCountSeries', schema);
exports.NodeCountSeriesDay = mongoose.model('NodeCountSeriesDay', schema);
