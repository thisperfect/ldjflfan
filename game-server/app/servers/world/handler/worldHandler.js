/**
 * Created by liuxiahui on 2017/11/1.
 */

var Player = require('../../../domain/player');

module.exports = function (app) {
    return new Handler(app);
};

class Handler {
    constructor(app) {
        this.app = app
    }
}