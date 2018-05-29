/**
 * Created by liuxiahui on 2017/11/1.
 */

var Player = require('../../../domain/player');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app =  app;
};

var handler = Handler.prototype;