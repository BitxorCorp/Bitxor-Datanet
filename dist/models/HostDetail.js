"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostDetail = void 0;
const mongoose = require("mongoose");
const mongoose_1 = require("mongoose");
const HostDetailSchema = new mongoose_1.Schema({
    host: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    coordinates: {
        type: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },
        required: false,
    },
    location: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: false,
    },
    as: {
        type: String,
        required: false,
    },
    continent: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    region: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    district: {
        type: String,
        required: false,
    },
    zip: {
        type: String,
        required: false,
    },
});
HostDetailSchema.set('toObject', {
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    },
});
exports.HostDetail = mongoose.model('HostDetail', HostDetailSchema);
