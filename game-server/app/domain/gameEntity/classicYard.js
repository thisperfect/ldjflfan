/**
 * Created by Administrator on 2017/11/5 0005.
 */

var channelUtil = require('../../util/channelUtil');
var AreaServices = require('../../services/areaService');
var ddzCard = require('../../services/cardLogic');
var utils = require('../../util/utils');
var GameDao = require('../../dao/gameDao');
var gameConf = require('../../../config/gameConf');
var Player = require('../../domain/player');
var CallLordTimer = 15000;       //叫地主和抢地主倒计时  15秒
var RateAndOpenTimer = 5000;     //明牌和加倍倒计时 5秒
var DiscardTimer = 15000;         //出牌倒计时  15秒
var ChangeTableTimer = 10000;     //是否换桌  10秒

var ClassicYard = function (app,event,gameId,point,roomId) {

    this.app = app;
    this.gameId = gameId;
    this.roomId = roomId;
    this.startTime = new Date().valueOf();
    this.event = event;
    this.gameStatus = 0;       // 0 : 初始状态,1 : 开始发牌 ,2 : 牌发完,走叫地主流程    3:地主已确定,开始打牌  4:游戏结束

    this.rate = 1;             //公共倍率
    this.point = point;        //底分
    this.playerRate = {};      //个人倍率 {uid1 : rate1, ...}
    this.callStatus = 0;       // 0:没有叫地主, 1 : 有人叫地主 , 2 : 有人抢地主
    this.resume = 0;           //重开次数
    this.lordStep = 0;         //地主出了几手牌   计算春天用
    this.farmerStep = 0;       //农民出了几手牌   计算春天用

    this.callLord = 0;         //叫地主     uid
    this.landLord = 0;         //当地主     uid
    this.unLord = [];          //不能抢地主
    this.discard = 0;          //当前出牌人 uid
    this.playerCards = null;     // {} -> {uid1 : [cards1], uid2 : [cards2], uid3 : [cards3]};
    this.leaveCards = null;    //{cards:null,type:0,rate:0}地主牌
    this.lastHand = {outUid:0,outCard:[]};  //上一手牌信息

    this.areaService = new AreaServices(app);

    this.playerArray = [];              //所有玩家
    this.playerMap = {};                //{ uid : {}...}
    this.playerOpen = [];               //明牌玩家
    this.playerReady = [];              //玩家准备好数组
    this.playerLeaveWait = [];          //游戏中途退出的玩家,在结束后执行离开逻辑

    this.callLordJobId = 0;             //叫地主定时标识
    this.grabLordJobId = 0;             //抢地主定时标识
    this.discardJobId = 0;              //出牌定时标识
    this.changeTableJobId = 0;          //换桌定时标识(有继续游戏的玩家时,有人迟迟不点继续游戏)

};

module.exports = ClassicYard;

var classicYard = ClassicYard.prototype;


classicYard.getPlayerNum = function () {
    return this.playerArray.length;
};

classicYard.getGameId = function () {
    return this.gameId;
};

classicYard.getGameStatus = function () {
    return this.gameStatus;
};

classicYard.addPlayer = function (uid,openFlag,data,cb) {
    var self = this;
    if(self.playerArray.length >= 3){
        return cb({code:1,msg:'房间已满!'});
    }
    var result = self.areaService.add(uid,channelUtil.getClassicYardChannelName(self.roomId));
    if(result.code){
        return cb(result);
    }

    if(openFlag && openFlag != 0){
        self.rate *= 5;
        self.playerOpen.push(uid);
        if(!self.callLord) self.callLord = uid;     //先明牌开始的优先叫地主
    }

    self.playerArray.push(uid);
    self.playerMap[uid] = {uid:uid,coin:data.coin,jewel:data.jewel,superCard:data.superCard,delay:2,isAuto:false,charm:data.charm,role:data.role,level:data.level,vipLevel:data.vipLevel,chair:self.playerArray.length,openFlag:openFlag,nickname:data.nickname,avatar:data.avatar};
    self.playerRate[uid] = 1;

    if(self.playerArray.length == 3){     //可以开始游戏了
        self.gameStatus = 1;              //发牌
        gameStart(self);
    }
    cb(result);
    
};

/**
 * 剔出玩家
 * @param uid
 */
classicYard.kickPlayer = function(uid){
    var self = this;
    console.log('109 kick player:%s',JSON.stringify(self.playerMap[uid]));
    console.log('110 kick playerMap:%s',utils.size(self.playerMap));
    if(!self.playerMap[uid]) return;

    if(self.gameStatus == 0 || self.gameStatus == 4){       //初始状态或者结束状态,可直接离开
        GameDao.recordPlayerAction(uid,self.playerMap[uid].coin,self.playerMap[uid].jewel,self.playerMap[uid].packet,'离开经典场'+self.gameId+'_'+self.roomId);
        self.areaService.kick(uid);
        delete self.playerMap[uid];
        self.playerArray.splice(self.playerArray.indexOf(uid),1);
        self.playerReady.splice(self.playerReady.indexOf(uid),1);

        if(self.playerOpen.indexOf(uid)){
            self.rate  = Math.ceil(self.rate/5);
            self.playerOpen.splice(self.playerOpen.indexOf(uid),1);
        }
        if(self.callLord = uid) self.callLord = null;

        self.event.emit('playerLeave',self.playerReady,self.playerOpen);   //把已经准备的玩家返回去执行换桌逻辑

        self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId), {
            route: "onPlayerLeaveClassicYard",
            data:{
                uid : uid
            }
        }, function (err, res) {});

    }else {         //游戏已经开始,需要做托管
        //self.playerMap[uid].isAuto = true;
        if(self.playerLeaveWait.indexOf(uid) == -1) self.playerLeaveWait.push(uid);
    }
    console.log('134 kick playerMap:%s',utils.size(self.playerMap));
};

/**
 * 关闭游戏场
 */
classicYard.close = function(){

    var self = this;

    clearTimeout(self.callLordJobId);
    clearTimeout(self.grabLordJobId);
    clearTimeout(self.discardJobId);
    clearTimeout(self.changeTableJobId);

    self.playerArray.forEach(function (uid) {
        GameDao.recordPlayerAction(uid,self.playerMap[uid].coin,self.playerMap[uid].jewel,self.playerMap[uid].packet,'离开经典场'+self.gameId+'_'+self.roomId);
        self.areaService.kick(uid);
    });

    self.playerArray = null;
    self.playerLeaveWait = null;
    self.playerReady = null;
    self.playerMap = null;
    self.playerCards = null;
    self.playerRate = null;
    self.playerOpen = null;
    self.callLord = null;
    self.landLord = null;
    self.leaveCards = null;

};

/**
 * 继续游戏
 * @param uid
 */
classicYard.continueGame = function (uid,openFlag) {
    var self = this;

    if(self.playerArray.indexOf(uid) == -1 || self.gameStatus != 4 || self.playerArray.length != 3){
        return;
    }

    switch (self.gameId){
        case 1:{
            if(self.playerMap[uid].coin < parseInt(gameConf.classicYardLimit1)) return;
            break;
        }
        case 2:{
            if(self.playerMap[uid].coin < parseInt(gameConf.classicYardLimit2)) return;
            break;
        }
        case 3:{
            if(self.playerMap[uid].coin < parseInt(gameConf.classicYardLimit3)) return;
            break;
        }
        default:{
            return;
        }
    }

    self.playerReady.push(uid);
    self.playerMap[uid].openFlag = openFlag;
    self.playerRate[uid] = 1;

    if(openFlag){
        self.rate *= 5;
        self.playerOpen.push(uid);
        if(!self.callLord) self.callLord = uid;     //先明牌开始的优先叫地主
    }

    if(self.playerReady.length == 3){
        self.playerReady = [];
        self.gameStatus = 1;
        clearTimeout(self.changeTableJobId);
        gameStart(self);
    }else {
        self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
            route : "onClassicYardContinueGame",
            data:{
                uid : uid
            }
        }, function (err,res) {});
    }

    if(self.playerReady.length){

        self.changeTableJobId = setTimeout(function () {
            self.playerReady.forEach(function (changeUid) {
                var openFlag = false;
                if(self.playerOpen.indexOf(changeUid) != -1){
                    openFlag = true;
                }
                self.event.emit('playerChangeTable',changeUid,openFlag);

            });
        },ChangeTableTimer);
    }

};

/**
 * 游戏重连
 * @param uid
 */
classicYard.reconnectGame = function (uid,cb) {
    var self = this;

    if(self.playerArray.indexOf(uid) == -1 || self.playerArray.length != 3){
        return cb({code:1,msg:'游戏已结束!'});
    }

    self.playerLeaveWait.splice(self.playerLeaveWait.indexOf(uid),1);

    return cb({
        code:0,
        playerInfo:getPlayerInfo(self),
        landLord : self.landLord,
        cards : self.playerCards[uid],
        gameStatus:self.gameStatus
    });


};

/**
 * 明牌
 * @param uid
 */
classicYard.openDeal = function (uid) {
    var self = this;
    console.log('openDeal status:%s,timer',self.gameStatus,new Date().valueOf() - self.startTime);
    if(self.playerArray.indexOf(uid) == -1 || self.gameStatus == 0 || self.gameStatus == 4){
        return;
    }

    if(self.gameStatus == 1 && new Date().valueOf() - self.startTime < RateAndOpenTimer){       //发牌途中明牌
        self.rate *= 3;
        if(!self.callLord) self.callLord = uid;
    }

    if(self.gameStatus != 1 && new Date().valueOf() - self.startTime < RateAndOpenTimer){
        self.rate *= 2;
    }

    self.playerOpen.push(uid);
    console.log('openDeal rate:%s,pRateInfo:%s',self.rate,JSON.stringify(self.playerRate));
    self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
        route : "onClassicYardOpenDeal",
        data:{
            rate : self.rate,
            cardInfo : self.playerCards[uid],
            uid : uid,
            callLord : self.callLord
        }
    }, function (err,res) {});
};

/**
 * 叫地主
 * @param uid
 * @param callFlag true:叫地主 // false:不叫
 */
classicYard.callLandlord = function (uid,callFlag) {
    var self = this;
    console.log('callLord 225 flag:%s,uid:%s,unLoard:%s',callFlag,uid,JSON.stringify(self.unLord));
    if(self.callStatus != 0 || self.callLord != uid || self.gameStatus != 2 || self.unLord.indexOf(uid) != -1){
        return;
    }

    clearTimeout(self.callLordJobId);       //清除自动叫地主定时器

    self.callLord = self.playerArray[(self.playerArray.indexOf(uid)+1) % 3];      //抢或者叫地主的人顺移一位


    if(callFlag && callFlag != 0){       //叫地主
        self.landLord = uid;
        self.callStatus = 1;
        self.discard = uid;

        self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
            route : "onClassicYardCallLord",
            data:{
                callFlag : callFlag,
                uid : uid,
                callLord : self.callLord,
                timer : CallLordTimer
            }
        }, function (err,res) {});

        if(self.unLord.length == 2){      //已经有两个人没叫了,则游戏开始

            self.gameStatus = 3;
            self.callLord = 0;
            self.startTime = new Date().valueOf();
            self.rate *= self.leaveCards.rate;

            self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
            self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                route : "onClassicYardStart",
                data:{
                    landLord : self.landLord,
                    disCard : self.discard,
                    leaveCard : self.leaveCards,
                    timer : RateAndOpenTimer+DiscardTimer
                }
            }, function (err,res) {});

            self.discardJobId = setTimeout(function () {
                self.dealCard(self.discard,[],2, function () {});
                self.playerMap[self.discard]["delay"]--;    //超时次数
            },DiscardTimer);

        }else {                           //设置超时抢地主的人

            self.grabLordJobId = setTimeout(function () {

                self.grabLandlord(self.callLord,false);

            },CallLordTimer);
        }

    }else {
        self.unLord.push(uid);      //不允许抢地主了
        if(self.unLord.length == 3){
            if(self.resume == 0){   //重开次数消耗完了,直接把地主设置为第一个叫地主的人

                self.gameStatus = 3;
                self.callLord = 0;
                self.startTime = new Date().valueOf();
                self.rate *= self.leaveCards.rate;
                self.landLord = self.unLord[0];
                self.discard = self.landLord;
                self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
                self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                    route : "onClassicYardStart",
                    data:{
                        landLord : self.landLord,
                        disCard : self.discard,
                        leaveCard : self.leaveCards,
                        timer : RateAndOpenTimer+DiscardTimer
                    }
                }, function (err,res) {});

                self.discardJobId = setTimeout(function () {
                    self.dealCard(self.discard,[],2, function () {});
                    self.playerMap[self.discard]["delay"]--;    //超时次数
                },DiscardTimer);

            }else {             //重开
                self.unLord = [];
                self.resume--;
                self.playerCards = null;
                self.leaveCards = null;
                self.lastHand = {outUid:0,outCard:[]};  //上一手牌信息
                self.gameStatus = 1;
                self.callLord = 0;
                gameStart(self);
            }
        }else {

            self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                route : "onClassicYardCallLord",
                data:{
                    callFlag : callFlag,
                    uid : uid,
                    callLord : self.callLord,
                    timer : CallLordTimer
                }
            }, function (err,res) {});

            //设置超叫抢地主的人
            self.callLordJobId = setTimeout(function () {

                self.callLandlord(self.callLord,false);

            },CallLordTimer);
        }
    }
    console.log('callLord 315 unLord:%s',JSON.stringify(self.unLord));
};

/**
 *  抢地主
 * @param uid
 * @param grabFlag
 */
classicYard.grabLandlord = function (uid,grabFlag) {
    var self = this;
    console.log('grab 325 flag:%s,uid:%s,unLoard:%s',grabFlag,uid,JSON.stringify(self.unLord));
    if(self.callStatus == 0 || self.callLord != uid || self.gameStatus != 2 || self.unLord.indexOf(uid) != -1){
        return;
    }

    clearTimeout(self.grabLordJobId);       //清除自动叫地主定时器
    self.unLord.push(uid);                  //不允许抢地主了
    self.callLord = self.playerArray[(self.playerArray.indexOf(uid)+1) % 3];                    //抢地主的人顺移一位
    if(self.unLord.indexOf(self.callLord) != -1){                                               //已经在不能抢列表中
        self.callLord = self.playerArray[(self.playerArray.indexOf(self.callLord)+1) % 3];      //再次顺移一位
    }
    if(grabFlag && grabFlag != 0){          //抢

        self.landLord = uid;
        self.callStatus = 2;                //有人抢过,说明叫地主的人可以继续有机会抢一次
        self.rate *= 2;
        self.discard = uid;
    }
    switch (self.unLord.length){
        case 3:{        //已经三个人都不能抢了,则地主确定
            self.gameStatus = 3;
            self.callLord = 0;
            self.startTime = new Date().valueOf();
            self.rate *= self.leaveCards.rate;
            self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
            self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                route : "onClassicYardStart",
                data:{
                    landLord : self.landLord,
                    disCard : self.discard,
                    leaveCard : self.leaveCards,
                    timer : RateAndOpenTimer+DiscardTimer
                }
            }, function (err,res) {});

            self.discardJobId = setTimeout(function () {
                self.dealCard(self.discard,[],2, function () {});
                self.playerMap[self.discard]["delay"]--;    //超时次数
            },DiscardTimer);

            break;
        }
        case 2:{        //只有叫地主的情况下,其余两人不抢地主,则地主确定
            if(self.callStatus == 1){

                self.gameStatus = 3;
                self.callLord = 0;
                self.startTime = new Date().valueOf();
                self.rate *= self.leaveCards.rate;
                self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
                self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                    route : "onClassicYardStart",
                    data:{
                        landLord : self.landLord,
                        disCard : self.discard,
                        leaveCard : self.leaveCards,
                        timer : RateAndOpenTimer+DiscardTimer
                    }
                }, function (err,res) {});

                self.discardJobId = setTimeout(function () {
                    self.dealCard(self.discard,[],2, function () {});
                    self.playerMap[self.discard]["delay"]--;    //超时次数
                },DiscardTimer);
            }else {
                self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                    route : "onClassicYardGrabLord",
                    data:{
                        grabFlag : grabFlag,
                        uid : uid,
                        grabLord : self.callLord,
                        timer : CallLordTimer
                    }
                }, function (err,res) {});

                self.grabLordJobId = setTimeout(function () {

                    self.grabLandlord(self.callLord,false);

                },CallLordTimer);
            }
            break;
        }
        default :{          //还有人能抢
            self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
                route : "onClassicYardGrabLord",
                data:{
                    grabFlag : grabFlag,
                    uid : uid,
                    grabLord : self.callLord,
                    timer : CallLordTimer
                }
            }, function (err,res) {});

            self.grabLordJobId = setTimeout(function () {

                self.grabLandlord(self.callLord,false);

            },CallLordTimer);
        }
    }

};

classicYard.doubleRate = function(uid,doubleFlag) {
    var self = this;

    if(self.gameStatus != 3 || new Date().valueOf() - self.startTime < 4000 && self.playerMap[uid].coin < 8000){
        console.log('doubleRate gameStatus:%s,coin:%s',self.gameStatus,self.playerMap[uid].coin);
        return;
    }

    if(doubleFlag && doubleFlag != 0){      //加倍

        if(self.landLord == uid){           //地主加倍,则全局加倍
            self.rate *= 2;
            console.log('landrate:%s',self.rate);
        }else {                             //玩家自身翻倍
            self.playerRate[uid] *= 2;
            console.log('playerrate:%s',self.playerRate[uid]);
        }
    }
    console.log('doubleRate doubleFlag:%s, rate:%s,pRateInfo:%s',doubleFlag,self.rate,JSON.stringify(self.playerRate));
    self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
        route : "onClassicYardDoubleRate",
        data:{
            uid : uid,
            doubleFlag : doubleFlag,
            rate : 2
        }
    }, function (err,res) {});

};

classicYard.superRate = function(uid) {
    var self = this;

    if(self.gameStatus != 3 || new Date().valueOf() - self.startTime > RateAndOpenTimer){       //时间已过
        console.log('superRate gameStatus:%s,timer',self.gameStatus,new Date().valueOf() - self.startTime);
        return;
    }

    if(self.playerMap[uid]['superCard'] < 1){       //超级加倍卡不足
        console.log('superRate superCard:%s',self.playerMap[uid]['superCard']);
        return;
    }else {
        self.playerMap[uid]['superCard'] --;

        if(self.landLord == uid){       //地主超级加倍,则全局加倍
            self.rate *= 4;
        }else {                 //玩家自身翻倍
            self.playerRate[uid] *= 4;
        }
        console.log('superRate rate:%s,pRateInfo:%s',self.rate,JSON.stringify(self.playerRate));
        self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
            route : "onClassicYardSuperRate",
            data:{
                uid : uid,
                rate : 4
            }
        }, function (err,res) {});
    }

};

/**
 * 托管
 * @param uid
 */
classicYard.deposit = function(uid) {
    var self = this;

    if(self.gameStatus != 3) return;

    if(self.playerMap[uid]){
        self.playerMap[uid]["isAuto"] = !self.playerMap[uid]["isAuto"];
        self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
            route : "onClassicYardDeposit",
            data:{
                uid : uid,
                isAuto : self.playerMap[uid]["isAuto"]
            }
        }, function (err,res) {});
    }

};

/**
 *  出牌处理
 * @param uid
 * @param cards 出的牌
 * @param dealType  1:玩家自己出牌, 2 : 超时出牌 3 : 托管
 * @param cb
 */
classicYard.dealCard = function (uid,cards,dealType) {
    var self = this;

    if(uid != self.discard){
        return;
    }
    if((self.lastHand["outUid"] == 0 || self.lastHand["outUid"] == uid) && cards && cards.length == 0 && dealType == 1) return;  //第一次以及无人压牌时不能不出牌

    clearTimeout(self.discardJobId);

    var cardFlag = false;

    if(self.playerMap[uid].role == 1){      //已经封禁的玩家执行托管模式
        dealType = 3;
        cards = [];
    }

    self.discard = self.playerArray[(self.playerArray.indexOf(uid)+1) % 3];     //出牌人顺移一位
    console.log('532 lastHand:%s, disUid:%s, dealType:%s',JSON.stringify(self.lastHand.outCard),uid,dealType);
    switch (parseInt(dealType)){
        case 1:{                //玩家自己出牌

            if(self.playerMap[uid]["isAuto"]) self.playerMap[uid]["isAuto"] = false;          //取消托管标志

            //检查上一手牌是谁出的
            if(!self.lastHand["outUid"] || self.lastHand["outUid"] == uid){        //自己出的牌或者没人出,则随便出什么都可以

                if(cards && cards.length){   //自己有出牌
                    cardFlag = checkCard(self,uid,cards);
                    //console.log('1.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }else {
                    cards = ddzCard.selCard([].concat(self.lastHand["outCard"]),self.playerCards[uid]);
                    cardFlag = checkCard(self,uid,cards);
                    //console.log('1.2 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }

            }else {                 //不是自己出的
                if(self.lastHand["outCard"].length){       //上家有出过牌

                    if(cards && cards.length){           //自己有出牌,比大小以及是否合规
                        if(ddzCard.beat(self.lastHand["outCard"],cards)){
                            cardFlag = checkCard(self,uid,cards);
                            //console.log('1.3 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                        }else {
                            cardFlag = false;
                            cards = [];
                            //console.log('1.3.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                        }

                    }else {                 //没出牌,则直接过
                            cardFlag = true;
                            console.log('1.4 玩家选择没出牌',JSON.stringify(cards),cardFlag)
                    }

                }else {         //上家没出牌,就是自己叫完地主出牌
                    if(cards && cards.length){   //自己有出牌
                        cardFlag = checkCard(self,uid,cards);
                        //console.log('1.5 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }else {
                        cards = ddzCard.selCard([].concat(self.lastHand["outCard"]),self.playerCards[uid]);
                        cardFlag = checkCard(self,uid,cards);
                        //console.log('1.6 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }
                }
            }

            break;
        }
        case 2:{                //超时情况下出牌

            if(!self.lastHand["outUid"] || self.lastHand["outUid"] == uid){        //自己出的牌或者没人出,则随便出什么都可以

                if(cards && cards.length){   //自己有出牌
                    cardFlag = checkCard(self,uid,cards);
                    //console.log('2.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }else {
                    cards = ddzCard.selCard(null,self.playerCards[uid]);
                    cardFlag = checkCard(self,uid,cards);
                    console.log('2.2 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }

            }else {                 //不是自己出的
                //console.log('2.3 %s 超时未出牌!!',uid);
            }

            break;
        }
        case 3:{                //托管模式

            //检查上一手牌是谁出的
            if(!self.lastHand["outUid"] || self.lastHand["outUid"] == uid){        //自己出的牌或者没人出,则随便出什么都可以

                if(cards && cards.length){   //自己有出牌
                    cardFlag = checkCard(self,uid,cards);
                    //console.log('3.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }else {
                    cards = ddzCard.selCard(null,self.playerCards[uid]);
                    cardFlag = checkCard(self,uid,cards);
                    //console.log('3.2 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }

            }else {                 //不是自己出的
                if(self.lastHand["outCard"].length){       //上家有出过牌

                    if(cards && cards.length){           //自己有出牌,比大小以及是否合规
                        if(ddzCard.beat(self.lastHand["outCard"],cards)){
                            cardFlag = checkCard(self,uid,cards);
                            //console.log('3.3 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                        }

                    }else {                 //看是否能压过牌
                        cards = ddzCard.selCard([].concat(self.lastHand["outCard"]),self.playerCards[uid]);
                        cardFlag = checkCard(self,uid,cards);
                        console.log('3.4 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }

                }else {         //上家没出牌,就是自己叫完地主出牌
                    if(cards && cards.length){   //自己有出牌
                        cardFlag = checkCard(self,uid,cards);
                        //console.log('3.5 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }else {
                        cards = ddzCard.selCard(null,self.playerCards[uid]);
                        cardFlag = checkCard(self,uid,cards);
                        //console.log('3.6 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }
                }
            }

            break;
        }
    }

    var outType = ddzCard.getCardType([].concat(cards));
    if(outType && outType.cardType > 1) self.rate *= 2;     //炸弹翻倍
    //console.log('643  outCard:%s,lastHand:%s \n selfCard',JSON.stringify(cards),JSON.stringify(self.lastHand),JSON.stringify(self.playerCards[uid]));
    //出牌消息
    self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
        route : "onClassicYardDiscard",
        data:{
            uid : uid,
            isAuto:self.playerMap[uid]["isAuto"],
            outCards:cards,
            cardType:outType,
            remainNo : self.playerCards[uid].length,
            discard:self.discard,
            timer: DiscardTimer
        }
    }, function (err,res) {});
    //console.log('656 outUid:%s, outCard:%s, disCard:%s ,disAuto:%s',uid,JSON.stringify(cards),self.discard,self.playerMap[self.discard]["isAuto"]);
    if(cardFlag && cards && cards.length){           //有出牌,更新出牌信息并且判断是否结束

        self.lastHand.outUid = uid;
        self.lastHand.outCard = cards;
        console.log('661 更新出牌信息 outUid:%s, cards:%s ,lastHand:%s',uid,JSON.stringify(cards),JSON.stringify(self.lastHand));

        if(outType.cardType == 'c4' || outType.cardType == 'cw') self.rate *= 2;

        if(self.landLord == uid){
            self.lordStep++;
        }else {
            self.farmerStep++;
        }

        if(self.playerCards[uid].length < 1) {       //游戏已经结束
            return gameBalance(self,uid);
        }
    }

    if(self.playerMap[self.discard]["isAuto"]){     //已经托管

        setTimeout(function () {
            self.dealCard(self.discard,[],3, function () {});
        },1000);


    }else {     //未托管,设定出牌超时机制
        self.discardJobId = setTimeout(function () {
            self.dealCard(self.discard,[],2, function () {});
            self.playerMap[self.discard]["delay"]--;    //超时次数
            if(self.playerMap[self.discard]["delay"] < 1){
                self.playerMap[self.discard]["isAuto"] = true;
            }
        },DiscardTimer);
    }
};

/**
 * 使用表情
 * @param uid
 * @param target
 * @param content
 */
classicYard.useExpression = function (uid,target,content) {

    var self = this;

    if(parseInt(self.playerMap[uid]['role']) == 1 || self.playerArray.indexOf(target) == -1) {
        return;
    }

    self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
        route : "onExpressionInClassicYard",
        chatInfo:{
            sendId : uid,
            content : content,
            target : target
        }
    }, function (err,res) {});

};

classicYard.chatInClassic = function (uid,content) {

    var self = this;

    if(parseInt(self.playerMap[uid]['role']) == 1) {
        return;
    }


    self.areaService.pushByChannel(channelUtil.getClassicYardChannelName(self.roomId),{
        route : "onChatInClassicYard",
        chatInfo:{
            sendId : uid,
            content : content,
            target : target
        }
    }, function (err,res) {});

};

classicYard.updatePlayerRole = function(uid, role) {

    this.playerMap[uid]['role'] = role;

};

classicYard.updatePlayerProp = function(uid, propInfo) {
    var self = this;
    console.log('820 updatePro:%s',JSON.stringify(propInfo));
    for(var i in propInfo) {
        self.playerMap[uid][i] += propInfo[i];
    }

    propInfo['uid'] = uid;

    self.areaService.pushByChannelWithoutSelf(uid, channelUtil.getClassicYardChannelName(self.roomId), {
        route: "OnSetPropInClassicYard",
        msgInfo: propInfo
    }, function (err, res) {});

};

/*********   游戏内部逻辑  *********/

var gameStart = function (manager) {

    if(manager.gameStatus != 1 || manager.playerArray.length < 3) {
        return;
    }
    console.log('742 ClassicStart:%s',JSON.stringify(manager.playerArray));
    if(!manager.callLord) {      //没有地主
        manager.callLord = manager.playerArray[parseInt(Math.random() * 3)];
    }

    ddzCard.getShuffleCards();
    manager.playerCards = ddzCard.dealCards([].concat(manager.playerArray));

    console.log('leaveCards:%s ,playerCards:%s',JSON.stringify(manager.playerCards.leaveCards),JSON.stringify(manager.playerCards));
    manager.leaveCards = ddzCard.leaveCardsInfo(manager.playerCards.leaveCards);
    var leaveCards = delete manager.playerCards.leaveCards;

    if(!manager.leaveCards){       //牌有问题
        return manager.event.emit('classicClose',manager.playerArray);   //牌不对,直接解散房间
    }

    manager.playerArray.forEach(function (uid) {      //玩家发牌并且返回其他两个玩家的信息返回回去

        manager.playerMap[uid].isAuto = false;
        manager.playerMap[uid].delay = 2;
        //扣除房费
        var roomCharge = 240;
        switch (manager.gameId){
            case 1:{
                roomCharge = parseInt(gameConf.classicYardRoomCharge1);
                break;
            }
            case 2:{
                roomCharge = parseInt(gameConf.classicYardRoomCharge2);
                break;
            }
            default:{
                roomCharge = parseInt(gameConf.classicYardRoomCharge3);
                break;
            }
        }

        Player.setIncrementValue(uid,{coin:-roomCharge});
        manager.playerMap[uid].coin = parseInt(manager.playerMap[uid].coin) - roomCharge;
        GameDao.recordSystemTax(uid,roomCharge,0,0,2+'_'+manager.gameId);

        //发送玩家消息
        manager.areaService.pushByPlayerUid(uid,{
            route:"onClassicYardDealCard",
            data:{
                "playerInfo" : getPlayerInfo(manager),
                "roomId" : manager.roomId,
                "callLord" : manager.callLord,
                "cards" : manager.playerCards[uid],
                "timer" : RateAndOpenTimer
            }
        },function (err,res) {});
    });


    //设置抢地主顺序
    setTimeout(function () {
        manager.gameStatus = 2;
    },4000);  //RateAndOpenTimer


    manager.startTime = new Date().valueOf();
    //叫地主定时器
    manager.callLordJobId = setTimeout(function () {

        manager.callLandlord(manager.callLord,false);

    },RateAndOpenTimer+CallLordTimer);

    //记录玩家操作
    for(var pid in manager.playerMap){
        GameDao.recordPlayerAction(pid,manager.playerMap[pid].coin,manager.playerMap[pid].jewel,manager.playerMap[pid].packet,'进入经典场'+manager.gameId+'_'+manager.roomId);
    }

};

/**
 * 游戏结算
 * @param manager
 * @param winId 赢家ID
 */
var gameBalance = function (manager,winId) {
    var springFlag = 0;                     // 0 : 不是春天, 1 : 地主打农民春天, 2 : 反春天,农民打地主春天
    var resultArr = [];                     // 结果合计
    var lordRes = 0;                        // 地主结果
    var lordRate = 0;                       // 地主结果

    if(manager.landLord == winId){      //地主赢了
        //判断是否春天

        if(manager.farmerStep < 1){     //农民没出一手牌,地主打了春天
            springFlag = 1;
            manager.rate *= 2;
        }

        for(var i in manager.playerRate){
            if(i != winId){
                manager.playerRate[i] *= manager.rate;
                lordRate += manager.playerRate[i];
            }
        }

        var maxCoin = manager.playerMap[winId].coin / 2;
        manager.playerArray.forEach(function (puid) {
            if(puid != winId){
                //地主最多对每个农民可以赢的金币,本局可以赢的钱,自己身上的金币,取一个最小值作为本局输家改付的金币
                var coinRes = parseInt(-Math.min(maxCoin,manager.point * manager.playerRate[puid],manager.playerMap[puid].coin));
                Player.setIncrementValue(puid,{coin : coinRes});
                manager.playerMap[puid].coin =parseInt(manager.playerMap[puid].coin)+coinRes;
                resultArr.push({uid:puid,coin:coinRes,rate:manager.playerRate[puid]});
                lordRes -= coinRes;
            }
        });
        Player.setIncrementValue(winId,{coin : lordRes});
        manager.playerMap[manager.landLord].coin = parseInt(manager.playerMap[manager.landLord].coin) - lordRes;
        resultArr.push({uid:manager.landLord,coin:lordRes,rate:lordRate});
    }else {             //农民赢了

        if(manager.lordStep < 2){          //地主只出了一手牌,农名打了反春天
            springFlag = 3;
            manager.rate *= 2;
        }

        for(var i in manager.playerRate){
            if(i != manager.landLord){
                manager.playerRate[i] *= manager.rate;
                lordRate += manager.playerRate[i];
            }

        }
        var maxCoin = manager.playerMap[manager.landLord].coin / 2;
        manager.playerArray.forEach(function (puid) {
            if(puid != manager.landLord){      //地主输了

                //农民自身的金币,本局改赢的金币,地主最多可以出给每个农民的金币, 取一个最小值作为可以赢去的金币
                var coinRes = parseInt(Math.min(maxCoin,manager.point * manager.playerRate[puid],manager.playerMap[puid].coin));
                Player.setIncrementValue(puid,{coin : coinRes});
                manager.playerMap[puid].coin =parseInt(manager.playerMap[puid].coin)+coinRes;
                lordRes -= coinRes;
                resultArr.push({uid:puid,coin:coinRes,rate:manager.playerRate[puid]});
            }

        });

        Player.setIncrementValue(manager.landLord,{coin : -lordRes});
        manager.playerMap[manager.landLord].coin = parseInt(manager.playerMap[manager.landLord].coin) + lordRes;
        resultArr.push({uid : manager.landLord,coin : lordRes,rate : lordRate});
    }

    //发送游戏结束消息
    manager.areaService.pushByChannel(channelUtil.getClassicYardChannelName(manager.roomId),{
        route : "onClassicYardGameOver",
        data:{
            win : winId,
            landLord : manager.landLord,
            result : resultArr,
            point:manager.point,
            springFlag:springFlag

        }
    }, function (err,res) {});

    //记录游戏数据
    resultArr.forEach(function (data) {
        console.log('963 record data:%s',JSON.stringify(data));
        GameDao.recordClassicYard(data.uid,manager.gameId+'_'+manager.roomId,manager.landLord,data.coin,data.rate,manager.playerOpen.indexOf(data.uid),springFlag);
    });

    //重置数据
    manager.gameStatus = 4;    //游戏结束
    manager.rate = 1;
    manager.lordStep = 0;
    manager.farmerStep = 0;
    manager.playerRate = {};
    manager.callLord = 0;
    manager.callStatus = 0;
    manager.landLord = 0;
    manager.unLord = [];
    manager.playerOpen = [];
    manager.playerCards = null;
    manager.leaveCards = null;
    manager.lastHand = {outUid:0,outCard:[]};  //上一手牌信息
    console.log('1065 leavewait:%s',JSON.stringify(manager.playerLeaveWait));
    if(manager.playerLeaveWait.length){        //有玩家退出,没办法继续下一把
        manager.gameStatus = 0;
        manager.playerLeaveWait.forEach(function (leaveUid) {
            manager.event.emit('removePlayer',leaveUid);   //把已经准备的玩家返回去执行换桌逻辑
            manager.kickPlayer(leaveUid);
        });
    }

    manager.playerLeaveWait = [];

};

/**
 * 检查自己手上打的牌是否合规
 * @param manager
 * @param uid
 * @param card      出的牌 []
 * @param return flag   true:合规并且出掉  false:不合规,不许出
 */
var checkCard = function (manager,uid,cards) {

    var uidCards = manager.playerCards[uid];      //将玩家的手上的牌取出
    var flag = true;
    if(!uidCards || !Array.isArray(uidCards) || !cards || !Array.isArray(cards)) return false;

    console.log('933 uid:%s,cards:%s,uidCards:%s',uid,JSON.stringify(cards),JSON.stringify(uidCards));
    cards.forEach(function (card) {

        var seat = uidCards.indexOf(card);

        if(seat == -1){
            return flag = false;
        }else {
            uidCards.splice(seat,1);        //将该张删掉
        }
    });

    if(flag){
        manager.playerCards[uid] = uidCards;      //替换牌
    }

    return flag;
};

/**
 * 获取除了当前uid的其他玩家的信息,并返回玩家数组
 * @param manager
 * @param playerJson  玩家合集的一份拷贝
 * @param uid   自身信息不需要返回
 */
var getPlayerInfo = function(manager){
    var players = [];
    manager.playerArray.forEach(function (uid) {

        var cardInfo = null;
        if(manager.playerMap[uid].openFlag && manager.playerMap[uid].openFlag != 0){
            cardInfo = manager.playerCards[uid];
            console.log('uid:%s , cardInfo:%s,\ncard:%s',uid,JSON.stringify(cardInfo),JSON.stringify(manager.playerCards));
        }
        players.push({
            uid : uid,
            coin : manager.playerMap[uid].coin,
            jewel : manager.playerMap[uid].jewel,
            packet : manager.playerMap[uid].packet,
            superCard : manager.playerMap[uid].superCard,
            cardInfo : cardInfo,
            charm : manager.playerMap[uid].charm,
            role : manager.playerMap[uid].role,
            level : manager.playerMap[uid].level,
            vipLevel : manager.playerMap[uid].vipLevel,
            chair : manager.playerMap[uid].chair,
            nickname : manager.playerMap[uid].nickname,
            avatar : manager.playerMap[uid].avatar
        });

    });

    return players;
};
