/**
 * Created by Administrator on 2017/11/4 0004.
 */

var ClassicYard = require('../domain/gameEntity/classicYard');
var EventEmitter = require('events').EventEmitter;
var gameConf = require('../../config/gameConf');
var Player = require('../domain/player');
var util = require('../util/utils');


var gameClassicManager = function (app) {

    this.app = app;
    this.event = new EventEmitter();

    this.activeRoomMap = { 1: [], 2: [], 3: [] };        // {gameId : [roomId]};
    this.fullRoomMap = { 1: [], 2: [], 3: [] };          // {gameId : [roomId]};
    this.roomMap = {};                                  // {roomId : {classicYard:null} };
    this.classicCount = { 1: 0, 2: 0, 3: 0 };            // totalPlayer
    this.playerMap = {};                                // {uid : roomId}

    this.work();
};

module.exports = gameClassicManager;

var classicManager = gameClassicManager.prototype;

classicManager.work = function () {
    addEvent(this);
};

classicManager.addPlayer = function (uid, gameId, openFlag, data, cb) {

    var self = this;

    if (self.playerMap[uid]) {                // todo:应该重新放回游戏中,待处理; 20171225这一块已经放在重连的接口了.不需要在这里处理
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

classicManager.kickPlayer = function (uid) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var record = self.roomMap[roomId];

    if (!record) {        //无游戏实体,则需要清除该条记录
        delete self.playerMap[uid];
        for (var i in this.activeRoomMap) {
            if (self.activeRoomMap[i].indexOf(roomId) != -1) {
                self.activeRoomMap[i].splice(self.activeRoomMap[i].indexOf(roomId), 1);
            }
        }
        for (var i in this.fullRoomMap) {
            if (self.fullRoomMap[i].indexOf(roomId) != -1) {
                self.fullRoomMap[i].splice(self.fullRoomMap[i].indexOf(roomId), 1);
            }
        }
        return;
    }

    var classicYard = record['classicYard'];

    if (!classicYard) return delete self.playerMap[uid];

    var gameStatus = classicYard.getGameStatus();

    if (gameStatus == 0 || gameStatus == 4) {        //如果是初始状态则直接走离开程序

        var gameId = classicYard.getGameId();
        delete self.playerMap[uid];
        self.classicCount[gameId]--;
        var playerNum = classicYard.getPlayerNum();
        if (playerNum == 1) {
            classicYard.close();
            delete self.roomMap[roomId];
            self.activeRoomMap[gameId].splice(self.activeRoomMap[gameId].indexOf(roomId), 1);
            self.fullRoomMap[gameId].splice(self.fullRoomMap[gameId].indexOf(roomId), 1);
        } else {
            classicYard.kickPlayer(uid);
        }
    }

};

classicManager.continueGame = function (uid, openFlag, cb) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return cb({ code: 1, msg: "已不再游戏房中!" });
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return cb({ code: 1, msg: "已不再游戏中!" });
    }

    var playerNum = classicYard.getPlayerNum();
    var gameStatus = classicYard.getGameStatus();
    console.log('96 continueGame playerNum:%s,gameStatus:%s', playerNum, gameStatus);
    if (gameStatus != 4 || playerNum != 3) {    //走换桌程序
        console.log('98----- changeTable');
        self.changeTable(uid, openFlag, function (res) {
            cb(res);
        });
    } else {                 //继续游戏
        classicYard.continueGame(uid, openFlag);
        cb({ code: 0 });
    }

};

classicManager.changeTable = function (uid, openFlag, cb) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return cb({ code: 1, msg: "已不再游戏房中!" });
    }
    console.log('116 manager change roomId:%s ,roomNum:%s,table:%s', roomId, util.size(self.roomMap), self.roomMap[roomId]);
    console.log('117 manager tableinfo:%s', self.roomMap[roomId]);
    var classicYard = null;

    if (!self.roomMap[roomId].classicYard) {
        return cb({ code: 1, msg: "已不再游戏中!" });
    } else {
        classicYard = self.roomMap[roomId].classicYard;
    }

    var gameId = classicYard.getGameId();
    var playerNum = classicYard.getPlayerNum();
    console.log('147 playerNum:%s , gameId:%s', playerNum, gameId);
    delete self.playerMap[uid];
    if (playerNum == 1) {
        classicYard.close();
        delete self.roomMap[roomId];
        self.fullRoomMap[gameId].splice(self.fullRoomMap[gameId].indexOf(roomId), 1);
    } else {
        classicYard.kickPlayer(uid);
    }

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

classicManager.reconnectGame = function (uid, roomId, cb) {
    var self = this;
    var userRid = self.playerMap[uid];
    console.log('158 reconnectGame rid:%s, roomId:%s', userRid, roomId);
    if (!userRid || userRid != roomId) {
        return cb({ code: 1, msg: '进房出错!' });
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return cb({ code: 1, msg: "游戏已结束1!" });
    }

    var playerNum = classicYard.getPlayerNum();
    var gameStatus = classicYard.getGameStatus();
    console.log('96 continueGame playerNum:%s,gameStatus:%s', playerNum, gameStatus);
    if (gameStatus != 3 || playerNum != 3) {    //走换桌程序
        return cb({ code: 1, msg: "游戏已结束2!" });
    }

    classicYard.reconnectGame(uid, cb);
};

classicManager.openDeal = function (uid) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.openDeal(uid);

};

classicManager.callLandlord = function (uid, callFlag) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    if (classicYard.getGameStatus() != 2) {
        console.log('callLord status != 2');
        return;
    }

    classicYard.callLandlord(uid, callFlag);

};

classicManager.grabLandlord = function (uid, grabFlag) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.grabLandlord(uid, grabFlag);

};

classicManager.doubleRate = function (uid, doubleFlag) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.doubleRate(uid, doubleFlag);

};

classicManager.superRate = function (uid) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.superRate(uid);

};

classicManager.deposit = function (uid) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.deposit(uid);

};

classicManager.dealCard = function (uid, cards) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.dealCard(uid, cards, 1);

};

classicManager.updatePlayerRole = function (uid, role) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.updatePlayerRole(uid, role);
};

classicManager.updatePlayerProp = function (uid, propInfo) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.updatePlayerProp(uid, propInfo);
};

classicManager.useExpression = function (uid, target, content) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.useExpression(uid, target, content);
};

classicManager.chatInClassic = function (uid, content) {

    var self = this;
    var roomId = self.playerMap[uid];

    if (!roomId) {
        return;
    }

    var classicYard = self.roomMap[roomId].classicYard;

    if (!classicYard) {
        return;
    }

    classicYard.chatInClassic(uid, content);
};

var getAvailableRoom = function (manager, uid, gameId, openFlag, data, cb) {
    var roomId = null;
    console.log('410 available uid:%s, gameId:%s, actr:%s', uid, gameId, JSON.stringify(manager.activeRoomMap[gameId]));
    if (manager.activeRoomMap[gameId].length) {       //有空闲房间
        roomId = manager.activeRoomMap[gameId][0];
    } else {                                         //添加房间
        roomId = uid + '' + new Date().valueOf();
        manager.activeRoomMap[gameId].push(roomId);
        manager.roomMap[roomId] = { classicYard: null };
    }

    var record = manager.roomMap[roomId];
    console.log('avai 420 roomId:%s, record:%s', roomId, record);
    if (!record) {
        return cb({ code: 1, msg: '获取房间信息错误!' });
    }

    var classicYard = record['classicYard'];
    console.log('avai 426 classicYard:%s', classicYard);
    if (!classicYard || classicYard == undefined) {               //房间未初始化,创建一个新的房间
        var point = 25; //底分
        switch (gameId) {
            case 1:
                point = parseInt(gameConf.classicYardPoint1);
                break;
            case 2:
                point = parseInt(gameConf.classicYardPoint2);
                break;
            case 3:
                point = parseInt(gameConf.classicYardPoint2);
                break;
        }

        classicYard = new ClassicYard(manager.app, manager.event, gameId, point, roomId);
        console.log('428 classicYard:%s', classicYard);
        manager.roomMap[roomId].classicYard = classicYard;
    }

    var playerNum = classicYard.getPlayerNum();

    if (playerNum == 2) {     //针对房间处理

        manager.fullRoomMap[gameId].push(roomId);
        manager.activeRoomMap[gameId].splice(manager.activeRoomMap[gameId].indexOf(roomId), 1);

    }
    // /**
    //      * 我加的 验证房间人数少于三人无法开启游戏
    //      */
    // if (playerNum < 3) {
    //     return cb({ code: 1, msg: '人数少于三人无法开启游戏!' });
    // }
    classicYard.addPlayer(uid, openFlag, data, function (res) {

        if (res.code != 1) {  //进入成功
            manager.classicCount[gameId]++;
            manager.playerMap[uid] = roomId;
        }
        cb(res);
    });

};

var addEvent = function (Manager) {

    Manager.event.on('playerChangeTable', function (uid, openFlag) {                //监听到有玩家换桌,同一房间的已经点击继续游戏的玩家都执行换桌流程
        console.log('超时执行换桌 uid:%s ,openFlag:%s,', uid, openFlag);
        Manager.changeTable(uid, openFlag, function (res) {
            if (res.code == 1) {
                console.log('监听到换桌执行失败了', JSON.stringify(res));
            }
        });
    });

    Manager.event.on('removePlayer', function (uid) {                //把强退玩家移除
        console.log('removePlayer uid:%s :%s,', uid);
        Manager.kickPlayer(uid);
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

    Manager.event.on('classicClose', function (playerArray) {                //监听到牌不对时,需要关闭场次
        console.log('classicClose:', JSON.stringify(playerArray));
        playerArray.forEach(function (uid) {
            Manager.kickPlayer(uid);
        })

    });

};