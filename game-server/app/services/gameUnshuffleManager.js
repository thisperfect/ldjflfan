/**
 * Created by Administrator on 2017/12/10 0010.
 */

const UnshuffleYard = require('../domain/gameEntity/unshuffleYard');
const EventEmitter = require('events').EventEmitter;
const Player = require('../domain/player');


var gameUnshuffleManager = function (app) {

    this.app = app;
    this.event = new EventEmitter();

    this.activeRoomMap = { 1: [], 2: [], 3: [] };        // {gameId : [roomId]};
    this.fullRoomMap = { 1: [], 2: [], 3: [] };          // {gameId : [roomId]};
    this.roomMap = {};                                  // {roomId : {unshuffleYard:null} };
    this.classicCount = { 1: 0, 2: 0, 3: 0 };            // totalPlayer
    this.playerMap = {};                                // {uid : roomId}

    this.work();
};

module.exports = gameUnshuffleManager;

var unshuffleManager = gameUnshuffleManager.prototype;

unshuffleManager.work = function () {
    addEvent(this);
};

unshuffleManager.addPlayer = function (uid, gameId, openFlag, data, cb) {

    var self = this;
    console.log(self.playerMap[uid], "游戏");
    if (self.playerMap[uid]) {                // todo:应该重新放回游戏中,待处理
        return cb({ code: 1, msg: '已经在游戏中!' });
    }

    //我的加验证游戏是否重复登陆其他游戏
    Player.getPlayerCacheData(uid, function (err, data) {
        // console.log('经典场获取玩家缓存数据 data:%s', JSON.stringify(data));
        if (err) {
            return cb({ code: 1, msg: '获取玩家数据失败!' });
        }
        if (parseInt(data.role) == 1) {
            return cb({ code: 1, msg: '玩家已被封禁!' });
        }
        console.log('经典场获取玩家缓存数据 data:%s', data.status);

        if (data.status == 2) {
            return cb({ code: 1, msg: '您已经在其他游戏中!' });
        }
        //查找空闲房间或者穿建空闲房间
        getAvailableRoom(self, uid, gameId, openFlag, data, function (res) {
            cb(res);
        });
    });

};

unshuffleManager.kickPlayer = function (uid) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    delete self.playerMap[uid];

    var gameId = unshuffleYard.getGameId();
    self.classicCount[gameId]--;
    var playerNum = unshuffleYard.getPlayerNum();

    if (playerNum == 1) {
        unshuffleYard.close();
        delete self.roomMap[roomId];
        self.fullRoomMap[gameId].splice(this.fullRoomMap[gameId].indexOf(roomId), 1);
    }
    unshuffleYard.kickPlayer(uid);
};

unshuffleManager.continueGame = function (uid, openFlag, cb) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return cb({ code: 1, msg: "已不再游戏房中!" });
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return cb({ code: 1, msg: "已不再游戏中!" });
    }

    var playerNum = unshuffleYard.getPlayerNum();
    var gameStatus = unshuffleYard.getGameStatus();

    if (gameStatus != 4 || playerNum != 3) {    //走换桌程序
        self.changeTable(uid, openFlag, function (res) {
            cb(res);
        });
    } else {                 //继续游戏
        unshuffleYard.continueGame(uid);
    }

};

unshuffleManager.changeTable = function (uid, openFlag, cb) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return cb({ code: 1, msg: "已不再游戏房中!" });
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return cb({ code: 1, msg: "已不再游戏中!" });
    }

    var gameId = unshuffleYard.getGameStatus();
    var playerNum = unshuffleYard.getPlayerNum();

    if (playerNum == 1) {
        unshuffleYard.close();
        delete self.roomMap[roomId];
        self.fullRoomMap[gameId].splice(this.fullRoomMap[gameId].indexOf(roomId), 1);
    }

    delete self.playerMap[uid];
    unshuffleYard.kickPlayer(uid);

    Player.getPlayerCacheData(uid, function (err, data) {
        console.log('经典场获取玩家缓存数据 data:%s', JSON.stringify(data));
        if (err) {
            return cb({ code: 1, msg: '获取玩家数据失败!' });
        }

        if (parseInt(data.role) == 1) {
            return cb({ code: 1, msg: '玩家已被封禁!' });
        }

        getAvailableRoom(self, uid, gameId, openFlag, data, function (res) {
            cb(res);
        });
    });
};

unshuffleManager.openDeal = function (uid) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.openDeal(uid);

};

unshuffleManager.callLandlord = function (uid, callFlag) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.callLandlord(uid, callFlag);

};

unshuffleManager.grabLandlord = function (uid, grabFlag) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.grabLandlord(uid, grabFlag);

};

unshuffleManager.doubleRate = function (uid, doubleFlag) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.doubleRate(uid, doubleFlag);

};

unshuffleManager.superRate = function (uid) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.superRate(uid);

};

unshuffleManager.deposit = function (uid) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.deposit(uid);

};

unshuffleManager.dealCard = function (uid, cards, cb) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return cb({ code: 1, msg: '非法的操作' });
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return cb({ code: 1, msg: '非法的操作' });
    }

    unshuffleYard.dealCard(uid, cards, 1, function (res) {
        cb(res);
    });

};

unshuffleManager.updatePlayerRole = function (uid, role) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.updatePlayerRole(uid, role);
};

unshuffleManager.updatePlayerProp = function (uid, propInfo) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.updatePlayerProp(uid, propInfo);
};

unshuffleManager.chatInUnshuffle = function (uid, target, content) {

    var self = this;
    var roomId = self.playerMap.uid;

    if (!roomId) {
        return;
    }

    var unshuffleYard = self.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {
        return;
    }

    unshuffleYard.chatInUnshuffle(uid, target, content);
};

var getAvailableRoom = function (manager, uid, gameId, openFlag, data, cb) {

    var roomId = 0;
    console.log('man actr:%s', JSON.stringify(manager.activeRoomMap[gameId]));
    if (manager.activeRoomMap[gameId].length) {       //有空闲房间
        roomId = manager.activeRoomMap[gameId][0];
    } else {                                         //添加房间
        roomId = uid + new Date();
        manager.activeRoomMap[gameId].push(roomId);
        manager.roomMap[roomId] = { unshuffleYard: null };
    }

    var unshuffleYard = manager.roomMap[roomId].unshuffleYard;

    if (!unshuffleYard) {               //房间未初始化,创建一个新的房间
        var point = 20; //底分
        switch (gameId) {
            case 1:
                point = 25;
                break;
            case 2:
                point = 60;
                break;
            case 3:
                point = 150;
                break;
        }

        unshuffleYard = new UnshuffleYard(manager.app, manager.event, gameId, point, roomId);

        manager.roomMap[roomId].unshuffleYard = unshuffleYard;
    }

    var playerNum = unshuffleYard.getPlayerNum();

    if (playerNum == 2) {     //针对房间处理

        manager.fullRoomMap[gameId].push(roomId);
        manager.activeRoomMap[gameId].splice(manager.activeRoomMap[gameId].indexOf(roomId), 1);

    }

    unshuffleYard.addPlayer(uid, openFlag, data, function (res) {

        if (res.code != 1) {  //进入成功
            manager.classicCount[gameId]++;
            manager.playerMap[uid] = roomId;
        }
        cb(res);
    });

};

var addEvent = function (Manager) {

    Manager.event.on('playerChangeTable', function (uid, openFlag) {                //监听到有玩家换桌,同一房间的已经点击继续游戏的玩家都执行换桌流程

        Manager.changeTable(uid, openFlag, function (res) {
            if (res.code == 1) {
                console.log('监听到换桌执行失败了', JSON.stringify(res));
            }
        });
    });

    Manager.event.on('playerLeave', function (playerReady, playerOpen) {             //监听到有玩家退出,同一房间的已经点击继续游戏的玩家都执行换桌流程

        if (playerReady && playerReady.length) {
            playerReady.forEach(function (changeUid) {
                var openFlag = false;
                if (playerOpen.indexOf(changeUid)) {
                    openFlag = true;
                }
                Manager.changeTable(uid, openFlag, function (res) {
                    if (res.code == 1) {
                        console.log('监听到有玩家离开,执行换桌失败了', JSON.stringify(res));
                    }
                });

            });
        }
    });

};