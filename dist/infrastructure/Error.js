"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.UnsupportedFilterError = exports.MissingParamError = exports.NotFoundError = void 0;
class NotFoundError {
}
exports.NotFoundError = NotFoundError;
NotFoundError.send = (res, param, value) => {
    return res.status(404).send({
        code: 'ResourceNotFound',
        message: `no resource exists with ${param} '${value}'`,
    });
};
class MissingParamError {
}
exports.MissingParamError = MissingParamError;
MissingParamError.send = (res, param) => {
    return res.status(422).send({
        code: 'UnprocessableEntity',
        message: `Missing required parameter "${param}"`,
    });
};
class UnsupportedFilterError {
}
exports.UnsupportedFilterError = UnsupportedFilterError;
UnsupportedFilterError.send = (res, param) => {
    return res.status(422).send({
        code: 'UnprocessableEntity',
        message: `Filter unsupport ${param}`,
    });
};
class InternalServerError {
}
exports.InternalServerError = InternalServerError;
InternalServerError.send = (res, error) => {
    return res.status(500).send({
        code: 'InternalServerError',
        message: error.message,
    });
};
