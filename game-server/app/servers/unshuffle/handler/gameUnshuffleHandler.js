/**
 * Created by Administrator on 2017/12/8 0008.
 */

var Player = require('../../../domain/player');

module.exports = function(app){
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

//status: 1:世界大厅,2:红包场,3:经典场,4:癞子场,5:竞技场
handler.enterGame = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    var gameId = msg.gameId || 1;        //1:初级场,2:中级场,3:高级场
    var openFlag = msg.openFlag || false;    //true:明牌;
    console.log('classic gameId:%s ,openFlag:%s',gameId,openFlag);
    if(!gameId){
        return next(null,{code:1,msg:'参数缺失!'});
    }

    Player.getPlayerCacheData(uid, function (err,data) {
        console.log('classic han 29 row 经典场获取玩家缓存数据 data:%s',JSON.stringify(data));
        if(err || !data){
            return next(null,{code:1,msg:'获取玩家数据失败!'});
        }

        if(parseInt(data.role) == 1){
            return next(null,{code:1,msg:'玩家已被封禁!'});
        }

        self.app.rpc.unshuffle.gameUnshuffleRemote.add(session,uid,gameId,openFlag,data, function (res) {
            if(!res.code){
                Player.setValue(uid,{status:2});
            }
            next(null,res);
        });
    });
};

/**
 * 退出游戏
 * @param msg
 * @param session
 * @param next
 */
handler.leaveGame = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    self.app.rpc.unshuffle.gameUnshuffleRemote.kick(session,uid, function (res) {
        Player.setValue(uid,{status:1});
        next(null,res);
    });
};

/**
 * 继续游戏
 * @param msg
 * @param session
 * @param next
 */
handler.continueGame = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    var openFlag = msg.openFlag;    //true:明牌;
    self.app.rpc.unshuffle.gameUnshuffleRemote.continueGame(session,uid,openFlag,function (res) {
        next(null,res);
    });
};

/**
 * 继续游戏
 * @param msg
 * @param session
 * @param next
 */
handler.changeTable = function (msg,session,next) {

    var self = this;
    var uid = session.uid;
    var openFlag = msg.openFlag || false;    //true:明牌;

    self.app.rpc.unshuffle.gameUnshuffleRemote.changeTable(session,uid,openFlag, function (res) {
        next(null,res);
    });


};

/**
 * 明牌
 * @param msg
 * @param session
 * @param next
 */
handler.openDeal = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    self.app.rpc.unshuffle.gameUnshuffleRemote.openDeal(session,uid, function (res) {
        next(null,res);
    });
};

/**
 * 叫地主
 * @param msg
 * @param session
 * @param next
 */
handler.callLandlord = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    var callFlag = msg.callFlag;  //true:叫地主,false:不叫
    self.app.rpc.unshuffle.gameUnshuffleRemote.callLandlord(session,uid,callFlag, function (res) {
        next(null,res);
    });
};

/**
 * 抢地主
 * @param msg
 * @param session
 * @param next
 */
handler.grabLandlord = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    var grabFlag = msg.grabFlag;  //true:叫地主,false:不叫
    self.app.rpc.unshuffle.gameUnshuffleRemote.grabLandlord(session,uid,grabFlag, function (res) {
        next(null,res);
    });
};

/**
 * 加倍 (翻两倍)
 * @param msg
 * @param session
 * @param next
 */
handler.doubleRate = function (msg,session,next) {
    var self = this;
    var doubleFlag = msg.doubleFlag;
    var uid = session.uid;
    self.app.rpc.unshuffle.gameUnshuffleRemote.doubleRate(session,uid,doubleFlag, function (res) {
        next(null,res);
    });
};

/**
 * 超级加倍 (翻四倍,需翻倍卡)
 * @param msg
 * @param session
 * @param next
 */
handler.superRate = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    self.app.rpc.unshuffle.gameUnshuffleRemote.superRate(session,uid, function (res) {
        next(null,res);
    });
};

/**
 * 托管
 * @param msg
 * @param session
 * @param next
 */
handler.deposit = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    self.app.rpc.unshuffle.gameUnshuffleRemote.deposit(session,uid, function (res) {
        next(null,res);
    });
};

/**
 * 出牌
 * @param msg
 * @param session
 * @param next
 */
handler.dealCard = function (msg,session,next) {
    var self = this;
    var uid = session.uid;
    var cards = msg.cards;
    self.app.rpc.unshuffle.gameUnshuffleRemote.dealCard(session,uid,cards, function (res) {
        next(null,res);
    })

};

/**
 * 聊天
 * @param msg  1-10 玩家互动,需传对方uid/
 * @param session
 * @param next
 */
handler.chatInUnshuffle = function(msg, session, next) {

    var self = this;
    var uid = session.uid;
    var target = msg.target;
    var content = msg.content;

    if(!content) {
        return next(null, {
            code: 1
        });

    }

    self.app.rpc.unshuffle.gameUnshuffleRemote.chatInUnshuffle(session, uid, target, content, function(result){

        next(null, result);
    });
};