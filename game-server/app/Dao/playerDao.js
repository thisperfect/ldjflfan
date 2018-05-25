/**
 * Created by liuxiahui on 2017/10/26.
 */
var playerDao = module.exports;

var mysql = require('./mysql/mysql');
var utils = require('../../../shared/utils');

playerDao.setPlayerIncrement = function(uid, optsJson){

    var field = '';
    var args = [];
    var except = ['safeBox','useCoin','bankruptId','fish1Duration'];

    for(var i in optsJson) {
        if(except.indexOf(i) == -1) {
            if (field != '') {
                field += ', ';
            }
            field += i + ' = ' + i + ' + ? ';
            args.push(optsJson[i]);
        }
    }

    if(field != '') {
        var sql = 'update player set '+ field +'where uid = ?';
        args.push(parseInt(uid));

        mysql.query(sql, args, function(err, res){

            if(err){
                console.log("playerDao.setPlayerIncrement: ", sql, args, err, res);
            }
        });
    }
};

/**
 * get Player infomation by userId
 * @param {string} uid
 * @param {Object} success
 * @param {function} fail Callback function
 */
playerDao.getPlayerById = function (uid, cb){

    var sql = 'select player.* ,player_bag.* FROM player left join player_bag on player.uid = player_bag.uid where player.uid = ?';
    mysql.query(sql,parseInt(uid),function (err,res) {
        if(err || !res.length){
            console.log('playerDao.getPlayerById err:%s, sql :%s , uid:%s , err:%s ,res:%s',sql,uid,err,res);
            cb(1,null);
        }else {
            cb(null,res[0]);
        }
    });
};

playerDao.savePlayerLoginData = function(uid, deviceId,ipAddress){

    var usql = 'update user set deviceId = ? where uid = ?';
    var psql = 'update player set lastLoginTime = ?,ipAddress = ? where uid = ?';
    var uargs = [deviceId,uid];
    var pargs = [utils.toMysqlFormat(new Date()),ipAddress,uid];

    mysql.query(usql, uargs, function(err){
        if(err){
            console.log("userDao.setUserDevice: ", usql, uargs, err);
        }
    });

    mysql.query(psql,pargs, function(e){

        if(e){
            console.log("userDao.setIP & Date: ", psql,pargs, e);
        }
    });
};
playerDao.setPlayerValue = function(uid, optsJson){

    var field = '';
    var args = [];
    var except = ['onLine','signId','useCoin','bankruptId','fish1Duration','discount','lastLoginDate','breakCount','timeAdjust','iceToday','clockToday','twiceToday','jewelToday','packetToday'];

    for(var i in optsJson) {
        if(except.indexOf(i) == -1) {
            if(field != '') {
                field += ', ';
            }
            field += i +' =  ? ';
            args.push(optsJson[i]);
        }
    }

    if(field != '') {
        var sql = 'update player set '+ field +'where uid = ?';
        args.push(parseInt(uid));

        mysql.query(sql, args, function(err, res){

            if(err){
                console.log("playerDao.setPlayerValue: ", sql, args, err, res);
            }
        });
    }
};

playerDao.setPlayerIncrement = function(uid, optsJson){

    var field = '';
    var args = [];
    var except = ['safeBox','useCoin','bankruptId','fish1Duration','packetAdd'];

    for(var i in optsJson) {
        if(except.indexOf(i) == -1) {
            if (field != '') {
                field += ', ';
            }
            field += i + ' = ' + i + ' + ? ';
            args.push(optsJson[i]);
        }
    }

    if(field != '') {
        var sql = 'update player set '+ field +'where uid = ?';
        args.push(parseInt(uid));

        mysql.query(sql, args, function(err, res){

            if(err){
                console.log("playerDao.setPlayerIncrement: ", sql, args, err, res);
            }
        });
    }
};

playerDao.recordAgentAction = function (optsJson){

    var field = '';
    var value = '';
    var args = [];
    for(var i in optsJson) {
        if(field != '') {
            field += ', ';
        }
        field += i;

        if(value != '') {
            value += ', ';
        }
        value += '?';

        args.push(optsJson[i]);
    }

    var updateTime = new Date();
    field += ', actionTime';
    value += ', ?';
    args.push(utils.toMysqlFormat(updateTime));

    var sql = 'INSERT INTO agent_action ('+ field +') VALUES ('+ value +')';

    mysql.query(sql, args, function(err, res) {

        if(err){
            console.log("playerDao.recordAgentAction: ", sql, args, err, res);
        }
    });
};

playerDao.clearControl = function () {
    var sql = 'UPDATE player SET underControl = 0 WHERE underControl = 2;';

    mysql.query(sql,null, function (err, res) {
        if(err){
            console.log("playerDao.clearControl: ", sql,err, res);
        }
    });
};

playerDao.getOnlinePlayer = function (cb) {
    var sql = 'SELECT uid FROM player WHERE STATUS != 0;';

    mysql.query(sql,null, function (err, res) {
        if(err || !res.length){
            cb(1,null);
            return;
        }
        cb(null,res);
    });
};
