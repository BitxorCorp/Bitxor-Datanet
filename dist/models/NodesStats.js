"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodesStats = void 0;
const mongoose = require("mongoose");
const mongoose_1 = require("mongoose");
const NodesStatsSchema = new mongoose_1.Schema({
    nodeTypes: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    nodeVersion: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
});
NodesStatsSchema.set('toObject', {
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    },
});
exports.NodesStats = mongoose.model('NodesStats', NodesStatsSchema);
