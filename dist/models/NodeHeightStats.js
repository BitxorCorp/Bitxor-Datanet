"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeHeightStats = void 0;
const mongoose = require("mongoose");
const mongoose_1 = require("mongoose");
const NodeHeightStatsSchema = new mongoose_1.Schema({
    height: {
        type: [
            {
                value: {
                    type: String,
                    required: true,
                },
                count: {
                    type: Number,
                    required: true,
                },
            },
        ],
        required: true,
    },
    finalizedHeight: {
        type: [
            {
                value: {
                    type: String,
                    required: true,
                },
                count: {
                    type: Number,
                    required: true,
                },
            },
        ],
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
});
NodeHeightStatsSchema.set('toObject', {
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    },
});
exports.NodeHeightStats = mongoose.model('NodeHeightStats', NodeHeightStatsSchema);
