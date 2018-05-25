var host = window.location.origin;

var queryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  //如何利用 JS 脚本捕获页面 GET 方式请求的参数？其实直接使用 window.location.search 获得，然后通过 split 方法结合循环遍历自由组织数据格式。
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
      // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
      // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
  return query_string;
};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
};

// query connector
function queryEntry(token, callback) {
  var route = 'gate.gateHandler.queryEntry';
  pomelo.init({
    host: window.location.hostname,
    port: 3014,
    log: true
  }, function() {
    pomelo.request(route, {
      token: token
    }, function(data) {
      pomelo.disconnect();

      if(!data.code) {
        callback(data.host, data.port);
      }
      else {
        alert('gate error:'+JSON.stringify(data));
      }
    });
  });
};

function enterWorld(token){
  console.log('1.-------> token',token);
  queryEntry(token, function(host, port){
      console.log('2.-------> host:%s,port:%s',host,port);
    pomelo.init({
      host: host,
      port: port,
      log: true
    }, function() {
      console.log('3.------->connect');
      var route = "connector.entryHandler.enter";
      pomelo.request(route, {
        token: token
      }, function(data) {
        alert(JSON.stringify(data));
      });
    });
  });
};

function testGame(){
  var route = "test.testHandler.enterGame";
  pomelo.request(route, {}, function(data) {
    alert(JSON.stringify(data));
  });
};

function betCoin(){
  var route = "test.testHandler.betCoin";
  var seat = Math.floor(Math.random() * 4) + 1;
  pomelo.request(route, {
    seat: seat
  }, function(data) {
    alert(JSON.stringify(data));
  });
};


//大转盘
function enterGameClassic(gameId,openFlag){
  var route = "classic.gameClassicHandler.enterGame";
  pomelo.request(route, {
      gameId: gameId,
      openFlag: openFlag
  }, function(data) {
    console.log('enterGameClassic:'+JSON.stringify(data));
  });
};

function leaveGameClassic(){
  var route = "classic.gameClassicHandler.leaveGame";
  pomelo.request(route, {
  }, function(data) {
    console.log('leaveGameClassic:'+JSON.stringify(data));
  });
};

function conClassicGame(openFlag){
  var route = "classic.gameClassicHandler.continueGame";
  pomelo.request(route, {
    openFlag :openFlag
  }, function(data) {
    console.log('conClassicGame:'+JSON.stringify(data));
  });
};

function chanClassicGame(openFlag){
  var route = "classic.gameClassicHandler.changeTable";
  pomelo.request(route, {
    openFlag :openFlag
  }, function(data) {
    console.log('chanClassicGame:'+JSON.stringify(data));
  });
};

function reconnectGame(roomId){
  var route = "classic.gameClassicHandler.reconnectGame";
  pomelo.request(route, {
    roomId :roomId
  }, function(data) {
    console.log('reconnectGame:'+JSON.stringify(data));
  });
};

function openDeal(){
  var route = "classic.gameClassicHandler.openDeal";
  pomelo.request(route, {

  }, function(data) {
    console.log('openDeal:'+JSON.stringify(data));
  });
};

function callLord(callFlag){
  var route = "classic.gameClassicHandler.callLandlord";
  pomelo.request(route, {
    callFlag :callFlag
  }, function(data) {
    console.log('callLord:'+JSON.stringify(data));
  });
};

function grabLord(grabFlag){
  var route = "classic.gameClassicHandler.grabLandlord";
  pomelo.request(route, {
    grabFlag :grabFlag
  }, function(data) {
    console.log('grabLord:'+JSON.stringify(data));
  });
};

function doubleRate(doubleFlag){
  var route = "classic.gameClassicHandler.doubleRate";
  pomelo.request(route, {
    doubleFlag :doubleFlag
  }, function(data) {
    console.log('doubleFlag:%s,doubleRate:%s',doubleFlag,JSON.stringify(data));
  });
};

function superRate(){
  var route = "classic.gameClassicHandler.superRate";
  pomelo.request(route, {

  }, function(data) {
    console.log('superRate:'+JSON.stringify(data));
  });
};

function deposit(){
  var route = "classic.gameClassicHandler.deposit";
  pomelo.request(route, {

  }, function(data) {
    console.log('deposit:'+JSON.stringify(data));
  });
};

function useExpression(target,content){
  var route = "classic.gameClassicHandler.useExpression";
  pomelo.request(route, {
      target:target,
      content:content
  }, function(data) {
    console.log('useExpression:'+JSON.stringify(data));
  });
};

function chatInClassic(content){
  var route = "classic.gameClassicHandler.chatInClassic";
  pomelo.request(route, {
      content:content
  }, function(data) {
    console.log('chatInClassic:'+JSON.stringify(data));
  });
};


//不洗牌
function enterGameUnshuffle(roomId){
  var route = "unshuffle.gameUnshuffleHandler.enterGame";
  pomelo.request(route, {
    roomId: roomId
  }, function(data) {
    console.log('enterGameUnshuffle:'+JSON.stringify(data));
  });
};

function leaveGameUnshuffle(){
  var route = "unshuffle.gameUnshuffleHandler.leaveGame";
  pomelo.request(route, {
  }, function(data) {
    console.log('leaveGameUnshuffle:'+JSON.stringify(data));
  });
};

function removePlayer(){
  var route = "fivechess.gameFiveChessHandler.removePlayerInChess";
  pomelo.request(route, {
  }, function(data) {
    console.log('leaveGameFive:'+JSON.stringify(data));
  });
};

function failFive(){
  var route = "fivechess.gameFiveChessHandler.giveChessUp";
  pomelo.request(route, {
  }, function(data) {
    console.log('leaveGameFive:'+JSON.stringify(data));
  });
};

function chessDogfall(){
  var route = "fivechess.gameFiveChessHandler.chessDogfall";
  pomelo.request(route, {
  }, function(data) {
    console.log('leaveGameFive:'+JSON.stringify(data));
  });
};

function readyFive(guideFee){
  var route = "fivechess.gameFiveChessHandler.readyToChess";
  pomelo.request(route, {
    guideFee: guideFee
  }, function(data) {
    console.log('readyToChess:'+JSON.stringify(data));
  });
};

function luoziFive(color,x,y){
  var route = "fivechess.gameFiveChessHandler.drawChess";
  pomelo.request(route, {
    color: color,
    x:x,
    y:y
  }, function(data) {
    console.log('luoziFive:'+JSON.stringify(data));
  });
};

//捕鱼
function enterGameFish(top, bottom, left, right, gameId){
  var route = "area.gameFishHandler.enterGame";
  pomelo.request(route, {
    top: top,
    bottom: bottom,
    left: left,
    right: right,
    gameId: gameId,
    time: Date.now()
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function leaveGameFish(){
  var route = "area.gameFishHandler.leaveGame";
  pomelo.request(route, {}, function(data) {
    alert(JSON.stringify(data));
  });
};

function GameFishChangeR(top, bottom, left, right, gameId){
  var route = "area.gameFishHandler.changeRoom";
  pomelo.request(route, {
    top: top,
    bottom: bottom,
    left: left,
    right: right,
    gameId: gameId,
    time: Date.now()
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function getPlayerInfo(uidArray, sceneId){
  var route = "world.worldHandler.getPlayerInfoForScene";
  pomelo.request(route, {
    uidArray: uidArray,
    sceneId: sceneId
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function setCannonGrade(grade){
  var route = "area.gameFishHandler.setCannonGrade";
  pomelo.request(route, {
    grade: grade
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function fire(angle, x, y){
  var route = "area.gameFishHandler.fire";
  pomelo.request(route, {
    angle: angle,
    x: x,
    y: y
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function useSkill(skill){
  var route = "area.gameFishHandler.useSkill";
  pomelo.request(route, {
    skill: skill
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function getListInfo(cb){
  var route = "chat.chatHandler.getListInfo";
  pomelo.request(route,{

  },function(data){
    alert('getApplyInfo'+JSON.stringify(data));
    cb(data);
  });
};

function getFriendInfo(fid,cb){
  var route = "chat.chatHandler.getFriendInfo";
  pomelo.request(route,{
    fid:fid
  },function(data){
    alert('getFriendInfo'+JSON.stringify(data));
    cb(data);
  });
};

function agreeFriendApply(fid,cb){
  var route = "chat.chatHandler.agreeFriendApply";
  pomelo.request(route,{
    fid:fid
  },function(data){
    alert('agreeFriendApply'+JSON.stringify(data));
    cb(data);
  });
};

function refuseFriend(fid,cb){
  var route = "chat.chatHandler.refuseFriendApply";
  pomelo.request(route,{
    fid:fid
  },function(data){
    alert('refuseFriend'+JSON.stringify(data));
    cb(data);
  });
}

function applyFriend(fid,cb){
  var route = "chat.chatHandler.applyFriend";
  pomelo.request(route,{
    fid:fid
  },function(data){
    alert('agreeFriendApply'+JSON.stringify(data));
    cb(data);
  });
};

function deleteFriendByUid(fid){
  var route = "chat.chatHandler.deleteFriend";
  pomelo.request(route, {
    fid: fid
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function pullBlackByUid(fid){
  var route = "chat.chatHandler.pullBlack";
  pomelo.request(route, {
    fid: fid
  }, function(data) {
    alert(JSON.stringify(data));
  });
};

function removeBlackByUid(fid) {
  var route = "chat.chatHandler.removeBlack";
  pomelo.request(route, {
    fid: fid
  }, function (data) {
    alert(JSON.stringify(data));
  });
};

function chatWithMsg(fid,msg,cb){
  var route = "chat.chatHandler.playerChat";
  pomelo.request(route, {
    target: fid,
    content: msg
  }, function(data) {
    alert(JSON.stringify(data));
    cb(data);
  });
}

function worldChating(msg,cb){
  var route = "chat.chatHandler.hornChat";
  pomelo.request(route, {
    content: msg
  }, function(data) {
    alert(JSON.stringify(data));
    cb(data);
  });
}

function getMail(paging, cb){
  var route = "world.worldHandler.getMailList";
  pomelo.request(route,{
    paging:paging
  },function(data){
    alert('getMailList'+JSON.stringify(data));
    cb(data);
  });
}

function readMailByGmid(gmids,cb){
  var route = "world.worldHandler.readMail";
  pomelo.request(route,{
    gmids: gmids
  },function(data){
    alert('readMail'+JSON.stringify(data));
    cb(data);
  });
}

function delMailByGmid(gmids,cb){
  var route = "world.worldHandler.delMail";
  pomelo.request(route,{
    gmids: gmids
  },function(data){
    alert('dealMail'+JSON.stringify(data));
    cb(data);
  });
}

function signRewad(cb){
  var route = "world.worldHandler.getSignReward";
  pomelo.request(route,{

  }, function (data) {
    cb(data);
  });
}

function getRankList(paging,type,cb){
  var route = "world.worldHandler.getRankingList";
  pomelo.request(route,{
    paging:paging,
    type:type
  }, function (data) {
    cb(data);
  });
}

function payAuthCheck(orderId,cash,trade_id,cb){
  var route = "world.worldHandler.payAuth";
  pomelo.request(route,{
    orderId:orderId,
    cash:cash,
    trade_id:trade_id
  }, function (data) {
    cb(data);
  });
}

function setPlayerInfo(cb){
  var route = "world.worldHandler.setPlayerInfo";
  pomelo.request(route,{
    nickname : '啊啊啊啊啊啊啊啊啊啊啊啊',
    avatar : '',
    coin : 200,
    jewel : 10
  }, function (data) {
    cb(data);
  });
};

function sendForGift(giftNum,target,cb){
  var route = "world.worldHandler.sendGift";
  pomelo.request(route,{
    giftNum: giftNum,
    target: target
  }, function (data) {
    cb(data);
  });
};

function checkOrder(cb){
  var route = "world.worldHandler.checkOrder";
  pomelo.request(route,{
  }, function (data) {
    cb(data);
  });
}

function setAuth(realName,idCard,cb){
  var route = "world.worldHandler.getBankruptcy";
  pomelo.request(route,{
    realName: realName,
    idCard: idCard
  }, function (data) {
    cb(data);
  });
};

function setIndulge(countId,cb){
  var route = "world.worldHandler.indulgeCount";
  pomelo.request(route,{
    countId: countId
  }, function (data) {
    cb(data);
  });
};

function getActivit(cb){
  var route = "world.worldHandler.getActivity";
  pomelo.request(route,{

  }, function (data) {
    cb(data);
  });
};

function kickPlayers(){
  var route = "world.worldHandler.kickOnlinePlayer";
  pomelo.request(route,{

  }, function (data) {
    console.log('kickPlayers:',JSON.stringify(data));
  });
};


var count = 0;
function goExchange(jewels,cb){
  var route = "world.worldHandler.exchangeCoins";

  var countId = setInterval(function () {
    pomelo.request(route, {
      jewels: jewels
    }, function (data) {
      cb(data);
    });
    if(++count == 15){
      clearInterval(countId);
    }
  },198);


};

function openBox(cb){
  var route = "world.worldHandler.openSafeBox";
  pomelo.request(route,{
  }, function (data) {
    cb(data);
  });
};

function createBox(password,cb){
  var route = "world.worldHandler.createSafeBox";
  pomelo.request(route,{
    password:password
  }, function (data) {
    cb(data);
  });
};

function saveToBox(coins,cb){
  var route = "world.worldHandler.saveToSafeBox";
  pomelo.request(route,{
    coins:coins
  }, function (data) {
    cb(data);
  });
};

function getFromBox(password,coins,cb){
  var route = "world.worldHandler.getFromSafeBox";
  for (var i = 0;i<5;i++){
    pomelo.request(route,{
      password:password,
      coins:coins
    }, function (data) {
      cb(data);
    });
  }
};

function setWarGameStop(cb){
  var route = "war.gameWarHandler.setWarGameRest";
  pomelo.request(route,{
  }, function (data) {
    cb(data);
  });

};

function setWarCard(seat,status,cb){
  var route = "war.gameWarHandler.changeCardList";
  pomelo.request(route,{
    seat:seat,
    status:status
  }, function (data) {
    cb(data);
  });

};

function getTest(cid,cb){
  var route = "world.worldHandler.buyCornetID";
  pomelo.request(route,{
    cid:cid
  }, function (data) {
    cb(data);
  });
};

function getColorInfo(){
  var route = "color.gameColorHandler.enterGame";
  pomelo.request(route,{

  }, function (data) {
    alert(JSON.stringify(data));
  });
};

function betColorCoin(){
  var route = "color.gameColorHandler.betColorCoin4IOS";
  pomelo.request(route,{
    fish2 : 2,
    coin : 2
  }, function (data) {
    alert(JSON.stringify(data));
  });
};

function addEvent() {

  /**
   * 经典场相关消息
   */

  //经典场游戏开始
  pomelo.on('onClassicYardStart', function(data) {
      console.log("经典场游戏开始 onClassicYardStart " + JSON.stringify(data));
  });

  //经典场玩家离开
  pomelo.on('onPlayerLeaveClassicYard', function(data) {
    console.log("经典场玩家离开 onPlayerLeaveClassicYard " + JSON.stringify(data));
  });

  //经典场继续游戏
  pomelo.on('onClassicYardContinueGame', function(data) {
    console.log("经典场继续游戏 onClassicYardContinueGame " + JSON.stringify(data));
  });

  //经典场发牌
  pomelo.on('onClassicYardDealCard', function(data) {
      console.log("经典场发牌 onClassicYardDealCard " + JSON.stringify(data));
  });

  //经典场明牌
  pomelo.on('onClassicYardOpenDeal', function(data) {
      console.log("经典场明牌 onClassicYardOpenDeal " + JSON.stringify(data));
  });

  //经典场叫地主
  pomelo.on('onClassicYardCallLord', function(data) {
   console.log("经典场叫地主 onClassicYardCallLord " + JSON.stringify(data));
  });

  //经典场抢地主
  pomelo.on('onClassicYardGrabLord', function(data) {
   console.log("经典场抢地主 onClassicYardGrabLord " + JSON.stringify(data));
  });

  //经典场加倍
  pomelo.on('onClassicYardDoubleRate', function(data) {
   console.log("经典场加倍 onClassicYardDoubleRate " + JSON.stringify(data));
  });

  //经典场超级加倍
  pomelo.on('onClassicYardSuperRate', function(data) {
   console.log("经典场超级加倍 onClassicYardSuperRate " + JSON.stringify(data));
  });

  //经典场托管
  pomelo.on('onClassicYardDeposit', function(data) {
   console.log("经典场托管 onClassicYardDeposit " + JSON.stringify(data));
  });


  //经典场出牌
  pomelo.on('onClassicYardDiscard', function(data) {
   console.log("经典场出牌 onClassicYardDiscard " + JSON.stringify(data));
  });


  //经典场游戏结束
  pomelo.on('onClassicYardGameOver', function(data) {
   console.log("经典场游戏结束 onClassicYardGameOver " + JSON.stringify(data));
  });

  //经典场更新玩家属性
  pomelo.on('OnSetPropInClassicYard', function(data) {
   console.log("经典场更新玩家属性 OnSetPropInClassicYard " + JSON.stringify(data));
  });

  //经典场聊天
  pomelo.on('onChatInClassicYard', function(data) {
   console.log("经典场聊天 onChatInClassicYard " + JSON.stringify(data));
  });

  //经典场互动表情
  pomelo.on('onExpressionInClassicYard', function(data) {
   console.log("经典场聊天 onExpressionInClassicYard " + JSON.stringify(data));
  });

  //经典场更新玩家属性
  pomelo.on('OnSetPropInClassicYard', function(data) {
   console.log("经典场更新玩家属性 OnSetPropInClassicYard " + JSON.stringify(data));
  });



  /**
   * 不洗牌场消息
   */

    //不洗牌场游戏开始
  pomelo.on('onUnshuffleYardStart', function(data) {
    console.log("不洗牌场游戏开始 onUnshuffleYardStart " + JSON.stringify(data));
  });

  //不洗牌场发牌
  pomelo.on('onUnshuffleYardDealCard', function(data) {
    console.log("不洗牌场发牌 onUnshuffleYardDealCard " + JSON.stringify(data));
  });

  //不洗牌场明牌
  pomelo.on('onUnshuffleYardOpenDeal', function(data) {
    console.log("不洗牌场明牌 onUnshuffleYardOpenDeal " + JSON.stringify(data));
  });

  //不洗牌场叫地主
  pomelo.on('onUnshuffleYardCallLord', function(data) {
    console.log("不洗牌场叫地主 onUnshuffleYardCallLord " + JSON.stringify(data));
  });

  //不洗牌场抢地主
  pomelo.on('onUnshuffleYardGrabLord', function(data) {
    console.log("不洗牌场抢地主 onUnshuffleYardGrabLord " + JSON.stringify(data));
  });

  //不洗牌场加倍
  pomelo.on('onUnshuffleYardDoubleRate', function(data) {
    console.log("不洗牌场加倍 onUnshuffleYardDoubleRate " + JSON.stringify(data));
  });

  //不洗牌场超级加倍
  pomelo.on('onUnshuffleYardSuperRate', function(data) {
    console.log("不洗牌场超级加倍 onUnshuffleYardSuperRate " + JSON.stringify(data));
  });

  //不洗牌场托管
  pomelo.on('onUnshuffleYardDeposit', function(data) {
    console.log("不洗牌场托管 onUnshuffleYardDeposit " + JSON.stringify(data));
  });


  //不洗牌场出牌
  pomelo.on('onUnshuffleYardDiscard', function(data) {
    console.log("不洗牌场出牌 onUnshuffleYardDiscard " + JSON.stringify(data));
  });


  //不洗牌场游戏结束
  pomelo.on('onUnshuffleYardGameOver', function(data) {
    console.log("不洗牌场游戏结束 onUnshuffleYardGameOver " + JSON.stringify(data));
  });

  //不洗牌场更新玩家属性
  pomelo.on('OnSetPropInUnshuffleYard', function(data) {
    console.log("不洗牌场更新玩家属性 OnSetPropInUnshuffleYard " + JSON.stringify(data));
  });

  //不洗牌场聊天
  pomelo.on('onChatInUnshuffleYard', function(data) {
    console.log("不洗牌场聊天 onChatInUnshuffleYard " + JSON.stringify(data));
  });

  //不洗牌场玩家离开
  pomelo.on('onPlayerLeaveUnshuffleYard', function(data) {
    console.log("不洗牌场玩家离开 onPlayerLeaveUnshuffleYard " + JSON.stringify(data));
  });

  //不洗牌场继续游戏
  pomelo.on('onUnshuffleYardContinueGame', function(data) {
    console.log("不洗牌场继续游戏 onUnshuffleYardContinueGame " + JSON.stringify(data));
  });

  //不洗牌场更新玩家属性
  pomelo.on('OnSetPropInUnshuffleYard', function(data) {
    console.log("经典场更新玩家属性 OnSetPropInUnshuffleYard " + JSON.stringify(data));
  });

};