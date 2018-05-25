/**
 * Created by liuxiahui on 2017/10/26.
 */

var redis = require('./redis/redis');

var playerCache = module.exports;

var consts = 'DDZ_PLAYER::';

playerCache.isExist = function(uid, cb) {

    var key = consts+uid;

    redis.exists(key, function(err, res) {

        if(err){
            console.log("playerCache.isExist: ", key, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

playerCache.createPlayer = function(player, cb) {

    var key = consts+player.uid;
    var args = player;

    redis.hmset(key, args, function(err, res) {

        if(err){
            console.log("playerCache.createPlayer: ", key, args, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

playerCache.getPlayerById = function(uid, cb) {

    var key = consts+uid;

    redis.hgetall(key, function(err, res) {

        if(err){
            console.log("playerCache.getPlayerById: ", key, err, res);
            cb(1, null);
        } else {
            cb(null, res);
        }
    });
};

playerCache.setPlayerValue = function(uid, optsJson) {

    var key = consts+uid;
    var args = [];
    for(var i in optsJson) {
        args = args.concat([i, optsJson[i]]);
    }

    if(args.length != 0) {
        redis.hmset(key, args, function(err, res) {

            if(err){
                console.log("playerCache.setPlayerValue: ", key, args, err, res);
            }
        });
    }
};

playerCache.getPlayerValue = function(uid, fieldArray, cb) {

    var key = consts+uid;
    var args = fieldArray;

    redis.hmget(key, args, function(err, res) {

        if(err){
            console.log("playerCache.getPlayerValue: ", key, args, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

playerCache.setPlayerIncrement = function(uid, optsJson) {

    var key = consts+uid;

    for(var i in optsJson) {
        var args = [i, optsJson[i]];

        redis.hincrby(key, args, function(err, res) {

            if(err){
                console.log("playerCache.setPlayerIncrement: ", key, args, err, res);
            }
        });
    }
};



