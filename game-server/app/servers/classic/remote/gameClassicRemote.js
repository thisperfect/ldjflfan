/**
 * Created by Administrator on 2017/11/3 0003.
 */

var utils = require('../../../util/utils');

module.exports = function (app) {
    return new gameClassicRemote(app);
};

var gameClassicRemote = function (app) {
    this.app = app;
    this.gameClassicManager = app.get('gameClassicManager');
};

var classicRemote = gameClassicRemote.prototype;

classicRemote.add = function (uid,gameId,openFlag,data,cb) {
    var self = this;
    self.gameClassicManager.addPlayer(uid,gameId,openFlag,data, function (res) {
        cb(res);
    });
};

classicRemote.kick = function (uid,cb) {
    var self = this;
    self.gameClassicManager.kickPlayer(uid);
    utils.invokeCallback(cb);
};

classicRemote.continueGame = function (uid,openFlag,cb) {
    var self = this;
    self.gameClassicManager.continueGame(uid,openFlag,function (res) {
        cb(res);
    });
};

classicRemote.changeTable = function (uid,openFlag,cb) {
    var self = this;
    self.gameClassicManager.changeTable(uid,openFlag,function (res) {
        cb(res);
    });
};

classicRemote.reconnectGame = function (uid,roomId,cb) {
    var self = this;
    self.gameClassicManager.reconnectGame(uid,roomId,function (res) {
        cb(res);
    });
};

classicRemote.openDeal = function (uid,cb) {
    var self = this;
    self.gameClassicManager.openDeal(uid);
    utils.invokeCallback(cb);
};

classicRemote.callLandlord = function (uid,callFlag,cb) {
    var self = this;
    self.gameClassicManager.callLandlord(uid,callFlag);
    utils.invokeCallback(cb);
};

classicRemote.grabLandlord = function (uid,grabFlag,cb) {
    var self = this;
    self.gameClassicManager.grabLandlord(uid,grabFlag);
    utils.invokeCallback(cb);
};

classicRemote.doubleRate = function (uid,doubleFlag,cb) {
    var self = this;
    self.gameClassicManager.doubleRate(uid,doubleFlag);
    utils.invokeCallback(cb);
};

classicRemote.superRate = function (uid,cb) {
    var self = this;
    self.gameClassicManager.superRate(uid);
    utils.invokeCallback(cb);
};

classicRemote.deposit = function (uid,cb) {
    var self = this;
    self.gameClassicManager.deposit(uid);
    utils.invokeCallback(cb);
};

classicRemote.dealCard = function (uid,cards,cb) {
    var self = this;
    self.gameClassicManager.dealCard(uid,cards);
    utils.invokeCallback(cb);
};

classicRemote.updatePlayerRole = function(uid, role, cb) {

    var self = this;
    self.gameClassicManager.updatePlayerRole(uid, role);

    utils.invokeCallback(cb);
};

classicRemote.useExpression = function(uid, target, content, cb) {

    var self = this;
    self.gameClassicManager.useExpression(uid, target, content);

    utils.invokeCallback(cb);
};

classicRemote.chatInClassic = function(uid,content, cb) {

    var self = this;
    self.gameClassicManager.chatInClassic(uid, target, content);

    utils.invokeCallback(cb);
};

/**
 * 更新玩家属性
 * @param uid
 * @param propInfo {coin:num, jewel:num , packet:num}
 * @param cb
 */
classicRemote.updatePlayerProp = function(uid, propInfo, cb) {

    var self = this;
    self.gameClassicManager.updatePlayerProp(uid, propInfo);

    utils.invokeCallback(cb);
};