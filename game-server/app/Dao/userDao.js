/**
 * Created by liuxiahui on 2017/10/18.
 */
var userDao = module.exports;
var utils = require('../../../shared/utils');
var mysql = require('./mysql/mysql');

/**
 * get user infomation by userId
 * @param {String} uid UserId
 * @param {function} cb Callback function
 */
userDao.getUserById = function (uid, cb){

    var sql = 'select * from user where uid = ?';
    var args = [parseInt(uid)];

    mysql.query(sql, args, function(err, res){

        if(err){
            console.log("userDao.getUserById: ", sql, args, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

/**
 * 玩家登录时更新必要信息
 * @param userId
 * @param deviceId
 * @param cb
 */
userDao.setUserLoginValue = function(uid,deviceId,ip){

    var usql = 'update user set deviceId = ?, IPAddress = ? where uid = ?';
    var psql = 'update player set lastLoginTime = ? where uid = ?';
    var args = [deviceId,ip,uid];

    mysql.query(usql, args, function(err,res){

        if(err){
            console.log("userDao.setUserLoginValue: ", usql, args, err, res);
        }
    });

    mysql.query(psql, [utils.toMysqlFormat(new Date()),uid], function(err,res){

        if(err){
            console.log("userDao.setLastLoginTime: ", psql, err, res);
        }
    });
};


/**
 * count user by IDCard
 * @param deviceId
 * @param cb
 */
userDao.countByIDCard = function(idcard, cb){

    var sql = 'select count(*) as count from user where idcard = ?';
    var args = [idcard];

    mysql.query(sql, args, function(err,res){

        if (err){
            console.log("userDao.countByIDCard: ", sql, args, err, res);
            cb(err,null);
        }else {
            cb(null,res[0].count);
        }

    })
};

userDao.setAuthen = function (uid, realname, idcard, cb) {

    var sql = 'update user set realname = ?, idcard = ? where uid = ? ';
    var args = [realname, idcard, uid];

    mysql.update(sql, args, function (err, res) {

        if(err){
            console.log("userDao.setAuthen: ", sql, args, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

/**
 * count user by IDCard
 * @param deviceId
 * @param cb
 */
userDao.countByIDCard = function(idcard, cb){

    var sql = 'select count(*) as count from user where idcard = ?';
    var args = [idcard];

    mysql.query(sql, args, function(err,res){

        if (err){
            console.log("userDao.countByIDCard: ", sql, args, err, res);
            cb(err,null);
        }else {
            cb(null,res[0].count);
        }

    })
};

userDao.setAuthen = function (uid, realname, idcard, cb) {

    var sql = 'update user set realname = ?, idcard = ? where uid = ? ';
    var args = [realname, idcard, uid];

    mysql.update(sql, args, function (err, res) {

        if(err){
            console.log("userDao.setAuthen: ", sql, args, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

userDao.updateUserDevice = function(uid,deviceId,cb){

    var sql = 'update user set deviceId = ? where uid = ?';
    var args = [deviceId,uid];

    mysql.update(sql, args, function(err,res){

        if (err){
            console.log("userDao.updateUserDevice: ", sql, args, err, res);
            cb(err,null);
            return;
        }else {
            cb(null,res);
        }
    });
};

userDao.getTokenWithUid = function(userId,cb){

    var sql = 'select token from user_token where uid = ?';
    var args = [userId];

    mysql.query(sql, args, function(err,res){

        if (err){
            console.log("userDao.getTokenWithUid: ", sql, args, err, res);
            cb(err,null);
            return;
        }else {
            cb(null,res);
        }
    });
};

userDao.banPlayer = function (uid, role) {

    var sql = 'UPDATE user SET role = ? where uid = ?';
    var args = [role, uid];

    mysql.query(sql, args, function (err, res) {

        if(err){
            console.log("userDao.banPlayer: ", sql, args, err, res);
        }
    });
};

userDao.getBanIP = function (cb) {

    var sql = 'select ip_address from ban_ip';

    mysql.query(sql, null, function (err, res) {

        if(!err && res.length){
            cb(null,res);
        }else {
            cb(1,null);
        }
    });
};

userDao.banIP = function (ip, operate) {

    var sql = '';
    var args = null;
    switch (operate) {
        case "封禁IP":
            sql = 'INSERT INTO ban_ip (ip_address, add_time) VALUES (?, ?)';
            args = [ip, utils.toMysqlFormat(new Date())];
            break;
        case "解禁IP":
            sql = 'DELETE FROM ban_ip WHERE ip_address = ?';
            args = [ip];
            break;
    }

    mysql.query(sql, args, function (err, res) {

        if(err){
            console.log("userDao.banIP: ", sql, args, err, res);
        }
    });
};

//获取封禁设备
userDao.checkBan = function (deviceId,ip,cb) {

    var sql = 'select id from ban_list where deviceId = ? or ipAddress = ?';

    mysql.query(sql, [deviceId,ip], function (err,res) {

        if(err || res.length){
            cb(true);
        }else {
            cb(false);
        }
    });
};

userDao.getCornetByCid = function (cid, cb) {
    var sql = 'SELECT * FROM cornet WHERE cid = ? AND available = 0;';

    mysql.query(sql, [cid], function (err, res) {

        if(err || !res.length){
            cb(1,null);
            return;
        }else {
            cb(null,res[0]);
        }
    });
};

userDao.setCidState = function (uid, cid, cb) {
    var sql = 'UPDATE cornet SET available = 1, guid = ? WHERE cid = ?';
    mysql.update(sql,[uid,cid], function (err) {
        if (err){
            cb(1,null);
            return;
        }
        cb(null,1);
    });
};

userDao.changeUIDStop = function (cid,uid,cb) {
    var tables = ['user','user_token','player','player_bag','player_action','email','reward_mail','recharge_status','tietie','game_fish','game_war','game_color','game_battle','safe_box'];
    var args = [cid,uid];
    var len = tables.length;
    tables.forEach(function (table,index) {
        var sql = "UPDATE "+table+" set uid =? WHERE uid = ?;";
        mysql.update(sql,args, function (err,res) {
            if (err){
                cb(1,null);
                return;
            }
        });
        if (index==len -1){
            var corSql = 'UPDATE cornet SET available = 1 WHERE uid = ?';
            mysql.update(corSql,[cid], function (err, res) {
                if (err){
                    cb(1,null);
                    return;
                }else {
                    cb(null,1);
                }
            });
        }
    });

};

userDao.bindUserConfirm = function (uid) {

    var sql = 'UPDATE user SET bindStatus = 2 WHERE uid = "'+ uid +'" and ISNULL(openid) = 0 and bindStatus = 1';

    mysql.query(sql, null, function (err, res) {

        if(err){
            console.log("userDao.bindUserConfirm: ", sql, null, err, res);
        }
    });
};

