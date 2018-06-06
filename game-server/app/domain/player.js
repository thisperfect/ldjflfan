/**
 * Created by liuxiahui on 2017/10/26.
 */

const playerDao = require('../dao/playerDao');

const playerCache = require('../cache/playerCache');

const Player = module.exports;



/**
 * 从缓存中获取
 * @param uid
 * @param cb
 */
Player.getPlayerCacheData = function (uid,cb) {
    playerCache.getPlayerById(uid,function (err,player) {
        console.log('playerInfo cache err:%s ,player:%s',err,JSON.stringify(player));
        if(err){
            return cb(1,null);
        }else {

            cb(null,player);

        }
    });
};

Player.getPlayerDaoData = function (uid,cb) {
    playerDao.getPlayerById(uid,function (err,res) {
        if(err){
            return cb(1,null);
        }else {
            return cb(null,res);
        }
    });
};

/**
 * 登录进世界之后保存数据到缓存
 * @param uid
 * @param playerInfo  //uid,coin,jewel,packet,charm,level,experience,vipLevel,vipExperience,lastLoginTime,ipAddress,status
 */
Player.syncDataCache = function (uid,playerInfo,cb) {
    delete playerInfo.isFirst;      //把不需要的拿掉
    playerCache.createPlayer(playerInfo, function(err) {
        if (err) {
            cb(500);
        }else {
            // cb(CODE.SUCCESS, toJSON4Login(player));
            cb(200);
        }


    });
};

/**
 * 保存玩家登录数据
 * @param uid
 * @param optJson
 */
Player.saveLoginData = function (uid,deviceId,loginIP) {
    playerDao.savePlayerLoginData(uid,deviceId,loginIP);
};

Player.setIncrementValue = function(uid, optsJson) {
    playerCache.setPlayerIncrement(uid, optsJson);
    playerDao.setPlayerIncrement(uid, optsJson);
};

Player.setIncrementValueForDao = function(uid, optsJson) {
    playerDao.setPlayerIncrement(uid, optsJson);
};

Player.setIncrementValueForCache = function(uid, optsJson) {
    playerCache.setPlayerIncrement(uid, optsJson);
};

Player.setValue = function(uid, optsJson) {
    playerCache.setPlayerValue(uid, optsJson);
    playerDao.setPlayerValue(uid, optsJson);
};

Player.setValueForDao = function(uid, optsJson) {
    playerDao.setPlayerValue(uid, optsJson);
};

Player.setValueForCache = function(uid, optsJson) {
    playerCache.setPlayerValue(uid, optsJson);
};

Player.getValue = function(uid, fieldArray, cb) {

    if(!!fieldArray && fieldArray.length > 0) {       //取单独的值,即这个数组包含的值
        playerCache.getPlayerValue(uid, fieldArray, function(err, value) {

            if(err) {
                cb({code :1});
            }

            cb({code : 0, value : value});
        });
    }
    else {                                          //取所有的值
        this.getPlayerCacheData(uid, function(err, player) {

            if(err) {

                cb({code :1});
            }
            else {
                cb({code : 0,player:player});
            }

        });
    }
};

Player.getInfo = function(target, sceneId, cb) {
    var fields = dataApi.playerInfo.findById(sceneId)['fields'];
    getPlayerById(target, function(code, player) {

        if(code == CODE.SUCCESS) {
            for(var i in player) {
                if(fields.indexOf(i) == -1) {
                    delete player[i];
                }
            }

            cb({code : CODE.SUCCESS, playerInfo : player});
        }
        else {
            cb({code : code});
        }
    });
};

Player.setBag = function(uid, optsJson) {
    playerCache.setPlayerIncrement(uid, optsJson);
    playerDao.setPlayerBag(uid, optsJson);
};

Player.setBagForDao = function(uid, optsJson) {
    playerDao.setPlayerBag(uid, optsJson);
};

var toJSON4Cache = function(opts) {
    return {
        uid : parseInt(opts['uid']),
        nickname : opts['nickname'],
        avatar : opts['avatar'],
        coin : parseInt(opts['coin']),
        useCoin : parseInt(opts['useCoin']),
        jewel : parseInt(opts['jewel']),
        charm : parseInt(opts['charm']),
        level : parseInt(opts['level']),
        experience : parseInt(opts['experience']),
        vipLevel : parseInt(opts['vipLevel']),
        vipExperience : parseInt(opts['vipExperience']),
        role : parseInt(opts['role']),
        ipAddress : opts['ipAddress'],
        signId : parseInt(opts['signId']),
        bankruptId : parseInt(opts['bankruptId']),
        status : parseInt(opts['status'])
    };
};

