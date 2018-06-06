/**
 * Created by Administrator on 2017/11/3 0003.
 */

const Player = require('../../../domain/player');
const gameConf = require('../../../../config/gameConf.json');

module.exports = function (app) {
    return new Handler(app);
};
class Handler {
    constructor(app) {
        this.app = app;
    }
    //status: 1:世界大厅,2:经典场,3:不洗牌,4:红包场, 5:癞子场,6:竞技场
    async enterGame(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let gameId = parseInt(msg.gameId) || 1;        //1:初级场,2:中级场,3:高级场
        let openFlag = msg.openFlag || false;    //true:明牌;
        console.log('classic gameId:%s ,openFlag:%s',gameId,openFlag);
        if (!gameId) {
            return next(null, { code: 1, msg: '参数缺失!' });
        }

        Player.getPlayerCacheData(uid, (err, data) => {
            //console.log('classic han 29 row 经典场获取玩家缓存数据 data:%s',JSON.stringify(data));
            if (err || !data) {
                return next(null, { code: 1, msg: '获取玩家数据失败!' });
            }

            if (parseInt(data.role) == 1) {
                return next(null, { code: 1, msg: '玩家已被封禁!' });
            }

            switch (gameId) {
                case 1: {
                    if (data.coin < parseInt(gameConf.classicYardLimit1)) return next(null, { code: 1, msg: '玩家金币不足' });
                    break;
                }
                case 2: {
                    if (data.coin < parseInt(gameConf.classicYardLimit2)) return next(null, { code: 1, msg: '玩家金币不足' });
                    break;
                }
                case 3: {
                    if (data.coin < parseInt(gameConf.classicYardLimit3)) return next(null, { code: 1, msg: '玩家金币不足' });
                    break;
                }
                default: {
                    return next(null, { code: 1, msg: '请求失败,请重试!' });
                }
            }

            self.app.rpc.classic.gameClassicRemote.add(session, uid, gameId, openFlag, data, (res) => {
                if (!res.code) {
                    Player.setValue(uid, { status: 2 });
                }
                next(null, res);
            });
        });
    };
    /**
     * 退出游戏
     * @param msg
     * @param session
     * @param next
     */
    async leaveGame(msg, session, next) {
        let self = this;
        let uid = session.uid;
        self.app.rpc.classic.gameClassicRemote.kick(session, uid, (res) => {
            Player.setValue(uid, { status: 1 });
            next(null, res);
        });
    };

    /**
     * 继续游戏
     * @param msg
     * @param session
     * @param next
     */
    async continueGame(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let openFlag = msg.openFlag || false;    //true:明牌;
        self.app.rpc.classic.gameClassicRemote.continueGame(session, uid, openFlag, (res) => {
            next(null, res);
        });
    };
    /**
     * 换桌
     * @param msg
     * @param session
     * @param next
     */
    async changeTable(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let openFlag = msg.openFlag || false;    //true:明牌;
        self.app.rpc.classic.gameClassicRemote.changeTable(session, uid, openFlag, (res) => {
            next(null, res);
        });
    };

    /**
     * 游戏重连
     * @param msg
     * @param session
     * @param next
     * @returns {*}
     */
    async reconnectGame(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let roomId = msg.roomId;

        if (!roomId) {
            return next(null, { code: 1, msg: '参数缺失!' });
        }

        self.app.rpc.classic.gameClassicRemote.reconnectGame(session, uid, roomId, (res) => {
            next(null, res);
        });
    };

    /**
     * 明牌
     * @param msg
     * @param session
     * @param next
     */
    async openDeal(msg, session, next) {
        let self = this;
        let uid = session.uid;
        self.app.rpc.classic.gameClassicRemote.openDeal(session, uid, (res) => {
            next(null, res);
        });
    };

    /**
     * 叫地主
     * @param msg
     * @param session
     * @param next
     */
    async callLandlord(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let callFlag = msg.callFlag || false;  //true:叫地主,false:不叫
        self.app.rpc.classic.gameClassicRemote.callLandlord(session, uid, callFlag, (res) => {
            next(null, res);
        });
    };

    /**
     * 抢地主
     * @param msg
     * @param session
     * @param next
     */
    async grabLandlord(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let grabFlag = msg.grabFlag || false;  //true:叫地主,false:不叫
        self.app.rpc.classic.gameClassicRemote.grabLandlord(session, uid, grabFlag, (res) => {
            next(null, res);
        });
    };

    /**
     * 加倍 (翻两倍)
     * @param msg
     * @param session
     * @param next
     */
    async doubleRate(msg, session, next) {
        let self = this;
        let doubleFlag = msg.doubleFlag || false;
        let uid = session.uid;
        self.app.rpc.classic.gameClassicRemote.doubleRate(session, uid, doubleFlag, (res) => {
            next(null, res);
        });
    };

    /**
     * 超级加倍 (翻四倍,需翻倍卡)
     * @param msg
     * @param session
     * @param next
     */
    async superRate(msg, session, next) {
        let self = this;
        let uid = session.uid;
        self.app.rpc.classic.gameClassicRemote.superRate(session, uid, (res) => {
            next(null, res);
        });
    };

    /**
     * 托管
     * @param msg
     * @param session
     * @param next
     */
    async deposit(msg, session, next) {
        let self = this;
        let uid = session.uid;
        self.app.rpc.classic.gameClassicRemote.deposit(session, uid, (res) => {
            next(null, res);
        });
    };

    /**
     * 出牌
     * @param msg
     * @param session
     * @param next
     */
    async dealCard(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let cards = msg.cards;
        self.app.rpc.classic.gameClassicRemote.dealCard(session, uid, cards, (res) => {
            next(null, res);
        })
    };

    /**
     * 互动表情
     * @param msg
     * @param session
     * @param next
     * @returns {*}
     */
    async useExpression(msg, session, next) {
        let self = this;
        let uid = session.uid;
        let target = parseInt(msg.target);
        let content = parseInt(msg.content);

        if (!content || target == uid) {
            return next(null, {
                code: 1
            });
        }

        self.app.rpc.classic.gameClassicRemote.useExpression(session, uid, target, content, (result) => {

            next(null, result);
        });
    };

    /**
     * 聊天
     * @param msg  1-10 玩家互动,需传target
     * @param session
     * @param next
     */
    async chatInClassic(msg, session, next) {

        let self = this;
        let uid = session.uid;
        let content = parseInt(msg.content);

        if (!content) {
            return next(null, {
                code: 1
            });
        }

        self.app.rpc.classic.gameClassicRemote.chatInClassic(session, uid, content, (result) => {

            next(null, result);
        });
    };
}



// /**
//  * 以前的 
//  */

//  /**
//  * Created by Administrator on 2017/11/3 0003.
//  */

// var Player = require('../../../domain/player');
// var gameConf = require('../../../../config/gameConf.json');

// module.exports = function(app){
//     return new Handler(app);
// };

// var Handler = function (app) {
//     this.app = app;
// };

// var handler = Handler.prototype;

// //status: 1:世界大厅,2:经典场,3:不洗牌,4:红包场, 5:癞子场,6:竞技场
// handler.enterGame = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var gameId = parseInt(msg.gameId) || 1;        //1:初级场,2:中级场,3:高级场
//     var openFlag = msg.openFlag || false;    //true:明牌;
//     //console.log('classic gameId:%s ,openFlag:%s',gameId,openFlag);
//     if(!gameId){
//         return next(null,{code:1,msg:'参数缺失!'});
//     }

//     Player.getPlayerCacheData(uid, function (err,data) {
//         //console.log('classic han 29 row 经典场获取玩家缓存数据 data:%s',JSON.stringify(data));
//         if(err || !data){
//             return next(null,{code:1,msg:'获取玩家数据失败!'});
//         }

//         if(parseInt(data.role) == 1){
//             return next(null,{code:1,msg:'玩家已被封禁!'});
//         }

//         switch (gameId){
//             case 1:{
//                 if(data.coin < parseInt(gameConf.classicYardLimit1)) return next(null,{code:1,msg:'玩家金币不足'});
//                 break;
//             }
//             case 2:{
//                 if(data.coin < parseInt(gameConf.classicYardLimit2)) return next(null,{code:1,msg:'玩家金币不足'});
//                 break;
//             }
//             case 3:{
//                 if(data.coin < parseInt(gameConf.classicYardLimit3)) return next(null,{code:1,msg:'玩家金币不足'});
//                 break;
//             }
//             default:{
//                 return next(null,{code:1,msg:'请求失败,请重试!'});
//             }
//         }

//         self.app.rpc.classic.gameClassicRemote.add(session,uid,gameId,openFlag,data, function (res) {
//             if(!res.code){
//                 Player.setValue(uid,{status:2});
//             }
//             next(null,res);
//         });
//     });
// };

// /**
//  * 退出游戏
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.leaveGame = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     self.app.rpc.classic.gameClassicRemote.kick(session,uid, function (res) {
//         Player.setValue(uid,{status:1});
//         next(null,res);
//     });
// };

// /**
//  * 继续游戏
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.continueGame = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var openFlag = msg.openFlag || false;    //true:明牌;
//     self.app.rpc.classic.gameClassicRemote.continueGame(session,uid,openFlag,function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 继续游戏
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.changeTable = function (msg,session,next) {

//     var self = this;
//     var uid = session.uid;
//     var openFlag = msg.openFlag || false;    //true:明牌;

//     self.app.rpc.classic.gameClassicRemote.changeTable(session,uid,openFlag, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 游戏重连
//  * @param msg
//  * @param session
//  * @param next
//  * @returns {*}
//  */
// handler.reconnectGame = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var roomId = msg.roomId;

//     if(!roomId){
//         return next(null,{code:1,msg:'参数缺失!'});
//     }

//     self.app.rpc.classic.gameClassicRemote.reconnectGame(session,uid,roomId, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 明牌
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.openDeal = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     self.app.rpc.classic.gameClassicRemote.openDeal(session,uid, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 叫地主
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.callLandlord = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var callFlag = msg.callFlag || false;  //true:叫地主,false:不叫
//     self.app.rpc.classic.gameClassicRemote.callLandlord(session,uid,callFlag, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 抢地主
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.grabLandlord = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var grabFlag = msg.grabFlag  || false;  //true:叫地主,false:不叫
//     self.app.rpc.classic.gameClassicRemote.grabLandlord(session,uid,grabFlag, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 加倍 (翻两倍)
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.doubleRate = function (msg,session,next) {
//     var self = this;
//     var doubleFlag = msg.doubleFlag || false;
//     var uid = session.uid;
//     self.app.rpc.classic.gameClassicRemote.doubleRate(session,uid,doubleFlag, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 超级加倍 (翻四倍,需翻倍卡)
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.superRate = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     self.app.rpc.classic.gameClassicRemote.superRate(session,uid, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 托管
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.deposit = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     self.app.rpc.classic.gameClassicRemote.deposit(session,uid, function (res) {
//         next(null,res);
//     });
// };

// /**
//  * 出牌
//  * @param msg
//  * @param session
//  * @param next
//  */
// handler.dealCard = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var cards = msg.cards;
//     self.app.rpc.classic.gameClassicRemote.dealCard(session,uid,cards, function (res) {
//         next(null,res);
//     })
// };

// /**
//  * 互动表情
//  * @param msg
//  * @param session
//  * @param next
//  * @returns {*}
//  */
// handler.useExpression = function (msg,session,next) {
//     var self = this;
//     var uid = session.uid;
//     var target = parseInt(msg.target);
//     var content = parseInt(msg.content);

//     if(!content || target == uid) {
//         return next(null, {
//             code: 1
//         });
//     }

//     self.app.rpc.classic.gameClassicRemote.useExpression(session, uid, target, content, function(result){

//         next(null, result);
//     });
// };

// /**
//  * 聊天
//  * @param msg  1-10 玩家互动,需传target
//  * @param session
//  * @param next
//  */
// handler.chatInClassic = function(msg, session, next) {

//     var self = this;
//     var uid = session.uid;
//     var content = parseInt(msg.content);

//     if(!content) {
//         return next(null, {
//             code: 1
//         });
//     }

//     self.app.rpc.classic.gameClassicRemote.chatInClassic(session, uid,content, function(result){

//         next(null, result);
//     });
// };


