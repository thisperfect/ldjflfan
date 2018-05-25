/**
 * Created by Administrator on 2017/12/8 0008.
 */

var utils = require('../../../util/utils');

module.exports = function (app) {
    return new gameUnshuffleRemote(app);
};

var gameUnshuffleRemote = function (app) {
    this.app = app;
    this.gameUnshuffleManager = app.get('gameUnshuffleManager');
};

var unshuffleRemote = gameUnshuffleRemote.prototype;

unshuffleRemote.add = function (uid,gameId,openFlag,data,cb) {
    var self = this;
    self.gameUnshuffleManager.addPlayer(uid,gameId,openFlag,data, function (res) {
        cb(res);
    });
};

unshuffleRemote.kick = function (uid,cb) {
    var self = this;
    self.gameUnshuffleManager.kickPlayer(uid);
    utils.invokeCallback(cb);
};

unshuffleRemote.continueGame = function (uid,openFlag,cb) {
    var self = this;
    self.gameUnshuffleManager.continueGame(uid,openFlag,function (res) {
        cb(res);
    });
};

unshuffleRemote.changeTable = function (uid,openFlag,cb) {
    var self = this;
    self.gameUnshuffleManager.changeTable(uid,openFlag,function (res) {
        cb(res);
    });
};

unshuffleRemote.openDeal = function (uid,cb) {
    var self = this;
    self.gameUnshuffleManager.openDeal(uid);
    utils.invokeCallback(cb);
};

unshuffleRemote.callLandlord = function (uid,callFlag,cb) {
    var self = this;
    self.gameUnshuffleManager.callLandlord(uid,callFlag);
    utils.invokeCallback(cb);
};

unshuffleRemote.grabLandlord = function (uid,grabFlag,cb) {
    var self = this;
    self.gameUnshuffleManager.grabLandlord(uid,grabFlag);
    utils.invokeCallback(cb);
};

unshuffleRemote.doubleRate = function (uid,doubleFlag,cb) {
    var self = this;
    self.gameUnshuffleManager.doubleRate(uid,doubleFlag);
    utils.invokeCallback(cb);
};

unshuffleRemote.superRate = function (uid,cb) {
    var self = this;
    self.gameUnshuffleManager.superRate(uid);
    utils.invokeCallback(cb);
};

unshuffleRemote.deposit = function (uid,cb) {
    var self = this;
    self.gameUnshuffleManager.deposit(uid);
    utils.invokeCallback(cb);
};

unshuffleRemote.dealCard = function (uid,cards,cb) {
    var self = this;
    self.gameUnshuffleManager.dealCard(uid,cards, function (res) {
        cb(res);
    });
};

unshuffleRemote.updatePlayerRole = function(uid, role, cb) {

    var self = this;
    self.gameUnshuffleManager.updatePlayerRole(uid, role);

    utils.invokeCallback(cb);
};

unshuffleRemote.chatInUnshuffle = function(uid, target, content, cb) {

    var self = this;
    self.gameUnshuffleManager.chatInUnshuffle(uid, target, content);

    utils.invokeCallback(cb);
};

/**
 * 更新玩家属性
 * @param uid
 * @param propInfo {coin:num, jewel:num , packet:num}
 * @param cb
 */
unshuffleRemote.updatePlayerProp = function(uid, propInfo, cb) {

    var self = this;
    self.gameUnshuffleManager.updatePlayerProp(uid, propInfo);

    utils.invokeCallback(cb);
};