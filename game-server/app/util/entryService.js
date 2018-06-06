/**
 * Created by Administrator on 2017/10/12 0012.
 */

var entryService = module.exports;

var userDao = require('../dao/userDao');
var PlayerCache = require('../cache/playerCache');
var Player = require('../domain/player');

entryService.auth = function(uid, deviceId,ip, cb) {

    //检查设备和IP是否封禁
    userDao.checkBan(deviceId,ip,function (banFlag) {
        if(banFlag) {
            return cb({code: 1, msg: '非法的设备!'});
        }

        userDao.getUserById(uid, function(err, user) {

            if (err) {
                return cb({code:1,msg:'获取玩家失败!'});
            }

            if (user && user.length == 1) {

                // if(user[0].deviceId != deviceId) {
                //     return cb({code:1,msg:'新设备请重新登录!'});
                // }

                cb({code:0});
            }
            else {
                cb({code:1,msg:'非法的玩家!'});
            }
        });
    });
};

/**
 * 获取玩家信息
 * @param uid
 * @param cb
 */
entryService.enter = function (uid,loginIP,cb) {
    Player.getPlayerDaoData(uid,function (err,playerInfo) {
        console.log('getPlayerDaoData err:%s,res:%s',err,JSON.stringify(playerInfo));
        var isFirst = false,signId = 0,bankruptId = 0;
        if(err || !playerInfo){
            return cb({code:1,msg:'该用户不存在!'});
        }

        if(playerInfo.role == 1){
            return cb({code:1,msg:'用户已被封禁!'});
        }

        if(new Date(playerInfo.lastLoginTime).toDateString() != new Date().toDateString()){   //首次登录
            isFirst = true;
            signId = 1;
            bankruptId = 3;
        }
        playerInfo.isFirst = isFirst;
        playerInfo.signId = signId;
        playerInfo.loginIP = loginIP;
        playerInfo.bankruptId = bankruptId;
        PlayerCache.createPlayer(toJSON4Cache(playerInfo), function (err) {
            if(err){
                cb({code:1,msg:'缓存数据异常,请重试!'});
            }else {
                cb({code:0,playerInfo:toJSON4Login(playerInfo)});
            }
        });
    });
};

var getSignId = function () {
    var sample = 0;
    var probability = dataApi.signReward.findByAttr('probability');
    var len = probability.length;

    for (var i = 0; i< len; i++){
        sample += probability[i];
    }

    var signId = dataApi.signReward.findMax('probability')['id'];
    var random = Math.floor(Math.random() * sample + 1);

    for(var i = 0; i < len; i++){
        random -= probability[i];
        if (random <= 0){
            signId = dataApi.signReward.findBy("probability",probability[i])[0]['id'];
            break;
        }
    }
    return signId;
};



var toJSON4Cache = function(opts) {
    return {
        uid : parseInt(opts['uid']),
        nickname : opts['nickname'],
        avatar : opts['avatar'],
        coin : parseInt(opts['coin']),
        jewel : parseInt(opts['jewel']),
        packet : parseInt(opts['packet']),
        charm : parseInt(opts['charm']),
        level : parseInt(opts['level']),
        experience : parseInt(opts['experience']),
        vipLevel : parseInt(opts['vipLevel']),
        vipExperience : parseInt(opts['vipExperience']),
        role : parseInt(opts['role']),
        loginIP : opts['loginIP'],
        superCard : parseInt(opts['superCard']),
        cardMarker : parseInt(opts['cardMarker']),
        markerTime : new Date(opts['markerTime']).valueOf(),
        signId : parseInt(opts['signId']),
        bankruptId : parseInt(opts['bankruptId']),
        status : parseInt(opts['status'])
    };
};

var toJSON4Login = function(opts) {
    return {
        uid : parseInt(opts['uid']),
        nickname : opts['nickname'],
        avatar : opts['avatar'],
        coin : parseInt(opts['coin']),
        jewel : parseInt(opts['jewel']),
        packet : parseInt(opts['packet']),
        charm : parseInt(opts['charm']),
        level : parseInt(opts['level']),
        experience : parseInt(opts['experience']),
        vipLevel : parseInt(opts['vipLevel']),
        vipExperience : parseInt(opts['vipExperience']),
        role : parseInt(opts['role']),
        superCard : parseInt(opts['superCard']),
        cardMarker : parseInt(opts['cardMarker']),
        markerTime : new Date(opts['markerTime']).valueOf(),
        signId : parseInt(opts['signId']),
        bankruptId : parseInt(opts['bankruptId']),
        status : parseInt(opts['status']),
        unreadMail : parseInt(opts['unreadMail']) || 0,
        isFirst : opts['isFirst']
    };
};
