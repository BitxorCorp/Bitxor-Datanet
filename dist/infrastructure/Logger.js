"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston = require("winston");
class Logger {
    static getLogger(name) {
        return winston.createLogger({
            format: winston.format.combine(winston.format.label({ label: name })),
            transports: [Logger.transportsConsole, Logger.transportsFile],
        });
    }
    static logTemplate(info) {
        return `${info.timestamp} ${info.level}: [${info.label}] ${info.message}`;
    }
}
exports.Logger = Logger;
Logger.transportsConsole = new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), winston.format.cli(), winston.format.printf(Logger.logTemplate)),
});
Logger.transportsFile = new winston.transports.File({
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf(Logger.logTemplate)),
    level: 'error',
    filename: 'error.log',
});
