
"use strict";
const logger = require("./logger").getLogger('error');
const constant = require('./constant');
const toBase64 = require('./toBase64');
const moment = require('moment');
const app = require('../app');


module.exports = function (name, err) {
    name = name || 'WError';
    let code = (err && constant[err.message] && constant[err.message].code) || constant.RUNTIME_ERROR.code;
    let message = (err && constant[err.message] && constant[err.message].desc) || (err && err.message) || constant.RUNTIME_ERROR.desc;
    let now = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

    if ((err && constant[err.message] && constant[err.message].code) || (err && constant[err.message] && constant[err.message].desc)) {
        //constant捕捉到错误
        let cont = `${now}|${now}|${app.pkg.sysCode}|${app.IPv4}|${app.pkg.name}|${code}|2|${'wError_debug'}|||||${name}|${message}|${(err && err.code) || err.message}|${err && err.stack}|||||2||api|0.0.0.4`;
        process.nextTick(() => {
            logger.debug(cont)
        });
    } else {
        let cont = `${now}|${now}|${app.pkg.sysCode}|${app.IPv4}|${app.pkg.name}|${(err && err.code) || code}|1|${toBase64((err && err.name) || 'snError')}|||||${name}|${message}|${(err && err.code) || (err && err.message)}|${toBase64(err && err.stack)}|||||1||api|0.0.0.4`;
        process.nextTick(() => {
            logger.error(cont)
        });
    }

    return {code: code, desc: message};
}