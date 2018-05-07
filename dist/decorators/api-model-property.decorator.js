"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
exports.ApiModelProperty = (metadata = {}) => {
    return helpers_1.createPropertyDecorator(constants_1.DECORATORS.API_MODEL_PROPERTIES, metadata);
};
exports.ApiModelPropertyOptional = (metadata = {}) => exports.ApiModelProperty(Object.assign({}, metadata, { required: false }));
