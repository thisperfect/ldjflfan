/**
 * Created by Administrator on 2017/12/8 0008.
 */

var channelUtil = require('../../util/channelUtil');
var AreaServices = require('../../services/areaService');
var ddzCard = require('../../services/cardLogic');
var utils = require('../../util/utils');
var CallLordTimer = 5000;       //叫地主和抢地主倒计时  15000
var RateAndOpenTimer = 4000;    //明牌和加倍倒计时,牌发完时间 3处引用
var DiscardTimer = 4000;        //出牌倒计时  20000
var ChangeTableTimer = 8000;    //出牌倒计时  20000

var UnshuffleYard = function (app,event,gameId,point,roomId) {

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
    this.playerCards = {};     // {} -> {uid1 : [cards1], uid2 : [cards2], uid3 : [cards3]};
    this.leaveCards = null;    //{cards:null,type:0,rate:0}地主牌
    this.lastHand = {outUid:0,outCard:[]};  //上一手牌信息

    this.areaService = new AreaServices(app);

    this.playerArray = [];              //所有玩家
    this.playerMap = {};                //{ uid : {}...}
    this.playerOpen = [];               //明牌玩家
    this.playerReady = [];              //玩家准备好数组
    this.playerLeaveWait = [];          //游戏中途退出的玩家,在结束后执行离开逻辑

    this.callLordJobId = 0;
    this.grabLordJobId = 0;
    this.discardJobId = 0;
    this.changeTableJobId = 0;

};

module.exports = UnshuffleYard;

var unshuffleYard = UnshuffleYard.prototype;

unshuffleYard.addPlayer = function (uid,openFlag,data,cb) {

    var self = this;
    if(self.playerArray.length >= 3){
        return cb({code:1,msg:'房间已满!'});
    }
    var result = self.areaService.add(uid,channelUtil.getUnshuffleYardChannelName(self.roomId));
    if(result.code){
        return cb(result);
    }

    if(openFlag && openFlag != 0){
        console.log('openFlag:',openFlag);
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
 * 剔除玩家
 * @param uid
 */
unshuffleYard.kickPlayer = function(uid){
    var self = this;

    if(self.gameStatus == 0){       //初始状态,可直接离开

        self.areaService.kick(uid);

        self.event.emit('playerLeave',self.playerReady,self.playerOpen);   //把已经准备的玩家返回去执行换桌逻辑

        self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId), {
            route: "onPlayerLeaveUnshuffleYard",
            data:{
                uid : uid
            }
        }, function (err, res) {});

    }else {         //游戏已经开始,需要做托管
        self.playerMap[uid].isAuto = true;
        self.playerLeaveWait.push(uid);
    }
};

/**
 * 关闭游戏场
 */
unshuffleYard.close = function(){

    var self = this;

    clearTimeout(self.callLordJobId);
    clearTimeout(self.grabLordJobId);
    clearTimeout(self.discardJobId);

    self.playerArray.forEach(function (uid) {
        self.areaService.kick(uid);
        delete self.playerMap[uid];
    });
    self.playerArray = null;
    self.playerLeaveWait = null;
    self.playerCards = null;
    self.playerRate = null;
    self.callLord = null;
    self.landLord = null;
    self.playerCards = null;
    self.leaveCards = null;
    self.playerReady = null;

};

/**
 * 继续游戏
 * @param uid
 */
unshuffleYard.continueGame = function (uid,openFlag) {
    var self = this;

    if(self.playerArray.indexOf(uid) == -1 || self.gameStatus != 4 || self.playerArray.length != 3){
        return;
    }

    self.playerReady.push(uid);

    if(openFlag){
        self.rate *= 5;
        if(!self.callLord) self.callLord = uid;     //先明牌开始的优先叫地主
    }

    if(self.playerReady.length == 3){
        self.playerArray = [];
        self.gameStatus = 1;
        clearTimeout(self.changeTableJobId);
        gameStart(self);
    }else {
        self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
            route : "onUnshuffleYardContinueGame",
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
 * 明牌
 * @param uid
 */
unshuffleYard.openDeal = function (uid) {
    var self = this;

    if(self.playerArray.indexOf(uid) == -1 || !self.gameStatus){
        return;
    }

    if(new Date().valueOf() - self.startTime < RateAndOpenTimer && self.gameStatus == 1){       //发牌途中明牌
        self.rate *= 3;
        if(!self.callLord) self.callLord = uid;
    }else {                      //牌发完后明牌
        self.rate *= 2;
    }

    self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
        route : "onUnshuffleYardOpenDeal",
        data:{
            rate : self.rate,
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
unshuffleYard.callLandlord = function (uid,callFlag) {
    var self = this;

    clearTimeout(self.callLordJobId);       //清除自动叫地主定时器

    if(self.callStatus != 0 || self.callLord != uid || self.gameStatus != 2){
        return;
    }

    self.callLord = self.playerArray[(self.playerArray.indexOf(uid)+1) % 3];      //抢或者叫地主的人顺移一位

    self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
        route : "onUnshuffleYardCallLord",
        data:{
            callFlag : callFlag,
            uid : uid,
            callLord : self.callLord
        }
    }, function (err,res) {});

    if(callFlag){       //叫地主
        self.landLord = uid;
        self.callStatus = 1;
        self.discard = uid;

        //设置超时抢地主的人
        self.grabLordJobId = setTimeout(function () {

            self.grabLandlord(self.callLord,false);

        },CallLordTimer);
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
                self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
                    route : "onUnshuffleYardStart",
                    data:{
                        landLord : self.landLord,
                        disCard : self.discard,
                        leaveCard : self.leaveCards
                    }
                }, function (err,res) {});

                self.discardJobId = setTimeout(function () {
                    self.dealCard(self.discard,[],2, function () {});
                    self.playerMap[self.discard]["delay"]--;    //超时次数
                },DiscardTimer);

            }else {             //重开
                self.unLord = [];
                self.resume--;
                self.playerCards = {};
                self.leaveCards = null;
                self.lastHand = {outUid:0,outCard:[]};  //上一手牌信息
                self.gameStatus = 1;
                self.callLord = 0;
                self.startTime = new Date().valueOf();
                gameStart(self);
            }
        }else {
            //设置超叫抢地主的人
            self.callLordJobId = setTimeout(function () {

                self.callLandlord(self.callLord,false);

            },CallLordTimer);
        }
    }
};

/**
 *  抢地主
 * @param uid
 * @param grabFlag
 */
unshuffleYard.grabLandlord = function (uid,grabFlag) {
    var self = this;

    clearTimeout(self.grabLordJobId);       //清除自动叫地主定时器

    if(self.callStatus == 0 || self.callLord != uid || self.gameStatus != 2 || self.unLord.indexOf(uid) != -1){
        return;
    }

    if(grabFlag){       //叫地主
        self.landLord = uid;
        self.callStatus = 2;    //有人抢过,说明叫地主的人可以继续有机会抢一次
        self.rate *= 2;
        self.discard = uid;
    }

    self.callLord = self.playerArray[(self.playerArray.indexOf(uid)+1) % 3];      //抢地主的人顺移一位
    self.unLord.push(uid);      //不允许抢地主了

    if(self.unLord.length == 1){

        self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
            route : "onUnshuffleYardGrabLord",
            data:{
                grabFlag : grabFlag,
                uid : uid,
                callLord : self.callLord
            }
        }, function (err,res) {});

        self.grabLordJobId = setTimeout(function () {

            self.grabLordJobId(self.callLord,false);

        },CallLordTimer);

    }else if(self.unLord.length == 2){

        if(self.callStatus == 1){       //只有叫地主,没有人抢地主
            self.gameStatus = 3;
            self.callLord = 0;
            self.startTime = new Date().valueOf();
            self.rate *= self.leaveCards.rate;
            self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
            self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
                route : "onUnshuffleYardStart",
                data:{
                    landLord : self.landLord,
                    disCard : self.discard,
                    leaveCard : self.leaveCards
                }
            }, function (err,res) {});

            self.discardJobId = setTimeout(function () {
                self.dealCard(self.discard,[],2, function () {});
                self.playerMap[self.discard]["delay"]--;    //超时次数
            },DiscardTimer);

        }else if(self.callStatus == 2){     //有人叫有人抢,叫地主玩家可再抢一次
            self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
                route : "onUnshuffleYardGrabLord",
                data:{
                    grabFlag : grabFlag,
                    uid : uid,
                    callLord : self.callLord
                }
            }, function (err,res) {});

            self.grabLordJobId = setTimeout(function () {

                self.grabLordJobId(self.callLord,false);

            },CallLordTimer);

        }
    }else if(self.unLord.length == 3 ){

        if(self.callStatus != 0){   //3个人都不允许抢了而且有人叫了地主,游戏开始
            self.gameStatus = 3;
            self.callLord = 0;
            self.startTime = new Date().valueOf();
            self.rate *= self.leaveCards.rate;
            self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
            self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
                route : "onUnshuffleYardStart",
                data:{
                    landLord : self.landLord,
                    rate : self.rate,
                    disCard : self.discard
                }
            }, function (err,res) {});

            self.discardJobId = setTimeout(function () {
                self.dealCard(self.discard,[],2, function () {});
                self.playerMap[self.discard]["delay"]--;    //超时次数
            },DiscardTimer);

        }else if(self.callStatus == 0 && self.resume){                 //3个人都没叫地主并且重开次数小于2次,重开  todo:后两种情况不存在,因为已经到了抢地主的步骤了.不可能存在没叫地主
            self.unLord = [];
            self.resume--;
            self.playerCards = {};
            self.leaveCards = null;
            self.gameStatus = 1;
            self.callLord = 0;
            self.startTime = new Date().valueOf();
            gameStart(self);
        }else{                  //默认叫地主的人当地主
            self.landLord = self.callLord;
            self.discard = self.landLord;
            self.callLord = 0;
            self.gameStatus = 3;
            self.startTime = new Date().valueOf();
            self.rate *= self.leaveCards.rate;  //倍率乘上底牌倍率
            self.playerCards[self.landLord].push.apply(self.playerCards[self.landLord],self.leaveCards.cards);  //把牌拼接给地主
            self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
                route : "onUnshuffleYardStart",
                data:{
                    landLord : self.landLord,
                    rate : self.rate,
                    disCard : self.discard
                }
            }, function (err,res) {});

            self.discardJobId = setTimeout(function () {
                self.dealCard(self.discard,[],2, function () {});
                self.playerMap[self.discard]["delay"]--;    //超时次数
            },DiscardTimer);
        }
    }
};

unshuffleYard.doubleRate = function(uid,doubleFlag) {
    var self = this;

    if(self.gameStatus != 3 || new Date().valueOf() - self.startTime < 4000 && self.playerMap[uid].coin < 8000){
        return;
    }

    if(doubleFlag && doubleFlag != 0){      //加倍

        if(self.landLord == uid){           //地主加倍,则全局加倍
            self.rate *= 2;
        }else {                             //玩家自身翻倍
            self.playerRate[uid] *= 2;
        }
    }

    self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
        route : "onUnshuffleYardDoubleRate",
        data:{
            uid : uid,
            doubleFlag : doubleFlag,
            rate : 2
        }
    }, function (err,res) {});

};

unshuffleYard.superRate = function(uid) {
    var self = this;

    if(self.gameStatus != 3 || new Date().valueOf() - self.startTime < RateAndOpenTimer){       //时间已过
        return;
    }

    if(self.playerMap[uid]['superCard'] < 1){       //超级加倍卡不足
        return;
    }else {
        self.playerMap[uid]['superCard'] --;

        if(self.landLord == uid){       //地主超级加倍,则全局加倍
            self.rate *= 4;
        }else {                 //玩家自身翻倍
            self.playerRate[uid] *= 4;
        }

        self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
            route : "onUnshuffleYardSuperRate",
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
unshuffleYard.deposit = function(uid) {
    var self = this;

    if(self.gameStatus != 3) return;

    if(self.playerMap[uid]){
        self.playerMap[uid]["isAuto"] = !self.playerMap[uid]["isAuto"];
        self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
            route : "onUnshuffleYardDeposit",
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
unshuffleYard.dealCard = function (uid,cards,dealType,cb) {
    var self = this;

    if(uid != self.discard){
        return cb({code:1,msg:'非法的出牌人'});
    }

    clearTimeout(self.discardJobId);

    var cardFlag = false;

    if(self.playerMap[uid].role == 1){      //已经封禁的玩家执行托管模式
        dealType = 3;
        cards = [];
    }

    self.discard = self.playerArray[(self.playerArray.indexOf(uid)+1) % 3];     //出牌人顺移一位
    console.log('532 lastHand:%s, disUid"%s, dealType:%s',JSON.stringify(self.lastHand.outCard),uid,dealType);
    switch (parseInt(dealType)){
        case 1:{                //玩家自己出牌

            if(self.playerMap[uid]["isAuto"]) self.playerMap[uid]["isAuto"] = false;          //取消托管标志

            //检查上一手牌是谁出的
            if(!self.lastHand["outUid"] || self.lastHand["outUid"] == uid){        //自己出的牌或者没人出,则随便出什么都可以

                if(cards && cards.length){   //自己有出牌
                    cardFlag = checkCard(self,cards,self.playerCards[uid]);
                    console.log('1.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }else {
                    cards = ddzCard.selCard([].concat(self.lastHand["outCard"]),self.playerCards[uid]);
                    cardFlag = checkCard(self,uid,cards);
                    console.log('1.2 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }

            }else {                 //不是自己出的
                if(self.lastHand["outCard"].length){       //上家有出过牌

                    if(cards && cards.length){           //自己有出牌,比大小以及是否合规
                        if(ddzCard.beat(self.lastHand["outCard"],cards)){
                            cardFlag = checkCard(self,cards,self.playerCards[uid]);
                            console.log('1.3 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                        }

                    }else {                 //没出牌,则直接过
                        cardFlag = true;
                        console.log('1.4 玩家选择没出牌',JSON.stringify(cards),cardFlag)
                    }

                }else {         //上家没出牌,就是自己叫完地主出牌
                    if(cards && cards.length){   //自己有出牌
                        cardFlag = checkCard(self,cards,self.playerCards[uid]);
                        console.log('1.5 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }else {
                        cards = ddzCard.selCard([].concat(self.lastHand["outCard"]),self.playerCards[uid]);
                        cardFlag = checkCard(self,uid,cards);
                        console.log('1.6 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }
                }
            }

            break;
        }
        case 2:{                //超时情况下出牌

            if(!self.lastHand["outUid"] || self.lastHand["outUid"] == uid){        //自己出的牌或者没人出,则随便出什么都可以

                if(cards && cards.length){   //自己有出牌
                    cardFlag = checkCard(self,cards,self.playerCards[uid]);
                    console.log('2.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }else {
                    cards = ddzCard.selCard(null,self.playerCards[uid]);
                    cardFlag = checkCard(self,uid,cards);
                    console.log('2.2 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }

            }else {                 //不是自己出的
                console.log('2.3 %s 超时未出牌!!',uid);
            }

            break;
        }
        case 3:{                //托管模式

            //检查上一手牌是谁出的
            if(!self.lastHand["outUid"] || self.lastHand["outUid"] == uid){        //自己出的牌或者没人出,则随便出什么都可以

                if(cards && cards.length){   //自己有出牌
                    cardFlag = checkCard(self,cards,self.playerCards[uid]);
                    console.log('3.1 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }else {
                    cards = ddzCard.selCard(null,self.playerCards[uid]);
                    cardFlag = checkCard(self,uid,cards);
                    console.log('3.2 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                }

            }else {                 //不是自己出的
                if(self.lastHand["outCard"].length){       //上家有出过牌

                    if(cards && cards.length){           //自己有出牌,比大小以及是否合规
                        if(ddzCard.beat(self.lastHand["outCard"],cards)){
                            cardFlag = checkCard(self,cards,self.playerCards[uid]);
                            console.log('3.3 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                        }

                    }else {                 //看是否能压过牌
                        cards = ddzCard.selCard([].concat(self.lastHand["outCard"]),self.playerCards[uid]);
                        cardFlag = checkCard(self,uid,cards);
                        console.log('3.4 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }

                }else {         //上家没出牌,就是自己叫完地主出牌
                    if(cards && cards.length){   //自己有出牌
                        cardFlag = checkCard(self,cards,self.playerCards[uid]);
                        console.log('3.5 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }else {
                        cards = ddzCard.selCard(null,self.playerCards[uid]);
                        cardFlag = checkCard(self,uid,cards);
                        console.log('3.6 deal cards:%s,cardFlag:%s',JSON.stringify(cards),cardFlag);
                    }
                }
            }

            break;
        }
    }

    var outType = ddzCard.getCardType([].concat(cards));
    //console.log('643  outCard:%s,lastHand:%s \n selfCard',JSON.stringify(cards),JSON.stringify(self.lastHand),JSON.stringify(self.playerCards[uid]));
    //出牌消息
    self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
        route : "onUnshuffleYardDiscard",
        data:{
            uid : uid,
            isAuto:self.playerMap[uid]["isAuto"],
            outCards:JSON.stringify(cards),
            cardType:outType,
            remainNo : self.playerCards[uid].length,
            discard:self.discard
        }
    }, function (err,res) {});
    console.log('656 outUid:%s, outCard:%s, lastHand:%s',uid,JSON.stringify(cards),JSON.stringify(self.lastHand));
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


unshuffleYard.getPlayerNum = function () {
    return this.playerArray.length;
};

unshuffleYard.getGameId = function () {
    return this.gameId;
};

unshuffleYard.getGameStatus = function () {
    return this.gameStatus;
};

unshuffleYard.chatInUnshuffle = function (uid,target,content) {

    var self = this;

    if(parseInt(self.playerMap[uid]['role']) == 1) {
        return;
    }


    self.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(self.roomId),{
        route : "onChatInUnshuffleYard",
        chatInfo:{
            sendId : uid,
            content : content,
            target : target
        }
    }, function (err,res) {});

};

unshuffleYard.updatePlayerRole = function(uid, role) {

    this.playerMap[uid]['role'] = role;

};

unshuffleYard.updatePlayerProp = function(uid, propInfo) {
    var self = this;
    console.log('820 updatePro:%s',JSON.stringify(propInfo));
    for(var i in propInfo) {
        self.playerMap[uid][i] += propInfo[i];
    }

    propInfo['uid'] = uid;

    self.areaService.pushByChannelWithoutSelf(uid, channelUtil.getUnshuffleYardChannelName(self.roomId), {
        route: "OnSetPropInUnshuffleYard",
        msgInfo: propInfo
    }, function (err, res) {});

};

/*********   游戏内部逻辑  *********/

var gameStart = function (manager) {

    if(manager.gameStatus != 1 || manager.playerArray.length < 3) {
        return;
    }

    if(!manager.callLord) {      //没有地主
        manager.callLord = manager.playerArray[parseInt(Math.random() * 3)];
    }

    ddzCard.getShuffleCards();
    var cards = ddzCard.unShuffleCards();
    manager.leaveCards = ddzCard.leaveCardsInfo(cards.leaveCards);

    console.log('cards:%s \n leaveCards:%s',JSON.stringify(cards),JSON.stringify(manager.leaveCards));

    if(!manager.leaveCards){       //牌有问题,重开
        return gameStart(manager);
    }

    manager.playerArray.forEach(function (uid,index) {      //玩家发牌并且返回其他两个玩家的信息返回回去
        console.log('uid:%s, card:%s',uid,cards['player'+index]);

        manager.playerCards[uid] = cards['player'+index];   //给uid 发牌
        manager.playerMap[uid].isAuto = false;
        manager.playerMap[uid].delay = 2;
        var playerInfo = utils.clone(manager.playerMap);    //浅拷贝一份玩家信息
        manager.areaService.pushByPlayerUid(uid,{
            route:"onUnshuffleYardDealCard",
            data:{
                "playerInfo" : getPlayerInfo(manager,playerInfo,uid),
                "chair" : manager.playerArray.indexOf(uid)+1,
                "cards" : manager.playerCards[uid],
                "callLord" : manager.callLord
            }
        },function (err,res) {});
    });

    //设置抢地主顺序
    setTimeout(function () {
        manager.gameStatus = 2;
    },RateAndOpenTimer);

    //叫地主定时器
    manager.callLordJobId = setTimeout(function () {

        manager.callLandlord(manager.callLord,false);

    },RateAndOpenTimer+CallLordTimer);

};


/**
 * 游戏结算
 * @param manager
 * @param winId 赢家ID
 */
var gameBalance = function (manager,winId) {
    var springFlag = 0;                 // 0 : 不是春天, 1 : 地主打农民春天, 2 : 反春天,农民打地主春天
    var result = {};                    // 结果合计
    var lordRes = 0;                    // 地主结果

    if(manager.landLord == winId){      //地主赢了
        //判断是否春天

        if(manager.farmerStep < 1){     //农民没出一手牌,地主打了春天
            springFlag = 1;
            manager.rate *= 2;
        }

        for(var i in manager.playerRate){
            manager.playerRate[i] *= manager.rate;
        }

        // result[winId] = manager.rate * manager.point *  manager.playerRate[winId];

        manager.playerArray.forEach(function (puid) {
            if(puid != winId){
                result[puid] = manager.rate * manager.point * manager.playerRate[puid] * -1;
                lordRes -= result[puid];
            }
        });

    }else {             //农民赢了

        if(manager.lordStep < 2){          //地主只出了一手牌,农名打了反春天
            springFlag = 3;
            manager.rate *= 2;
        }

        for(var i in manager.playerRate){
            manager.playerRate[i] *= manager.rate;
        }

        // result[winId] = manager.rate * manager.point *  manager.playerRate[winId];
        manager.playerArray.forEach(function (puid) {
            if(puid != winId){
                if(puid == manager.landLord){      //地主输了
                    result[puid] = manager.rate * manager.point * manager.playerRate[puid] * -1;
                }else {
                    result[puid] = manager.rate * manager.point * manager.playerRate[puid];
                    lordRes -= result[puid];
                }
            }
        });

    }

    result[manager.landLord] = lordRes;

    manager.areaService.pushByChannel(channelUtil.getUnshuffleYardChannelName(manager.roomId),{
        route : "onUnshuffleYardGameOver",
        data:{
            win : winId,
            landLord : manager.landLord,
            result : result,
            point:manager.point,
            rateInfo:manager.playerRate,
            springFlag:springFlag

        }
    }, function (err,res) {});

    //重置数据
    manager.gameStatus = 4;    //游戏结束
    manager.rate = 1;
    manager.playerRate = {};
    manager.callLord = 0;
    manager.landLord = 0;
    manager.playerCards = {};
    manager.leaveCards = null;
    manager.lastHand = {outUid:0,outCard:[]};  //上一手牌信息

    if(manager.playerLeaveWait.length){        //有玩家退出,没办法继续下一把
        manager.gameStatus = 0;
        manager.playerLeaveWait.forEach(function (leaveUid) {
            manager.kickPlayer(leaveUid);
            manager.playerArray.splice(manager.playerArray.indexOf(leaveUid),1);
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
 * @param uid  不需要返回的属性
 */
var getPlayerInfo = function(manager,playerJson,uid){
    var players = [];
    for(var i in playerJson){
        if(i != uid){
            if(playerJson[i].openFlag && playerJson[i].openFlag != 0){
                playerJson[i].cardInfo = manager.playerCards[i];
            }
            players.push(playerJson[i]);
        }

    }
    return players;
};