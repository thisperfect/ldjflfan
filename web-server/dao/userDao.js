/**
 * Created by liuxiahui on 2017/11/25.
 */
var mysql = require('./mysql/mysql');
var utils = require('../../shared/utils');
var userDao = module.exports;


/**
 * count user by sim id
 * @param (String) sim_id
 * @param {function} cb Call back function.
 */
userDao.countBySimId = function(simId, cb) {

    var sql = 'select count(*) as count from user where simId = ?';
    var args = [simId];

    mysql.query(sql, args, function(err, res) {

        if (err) {
            cb(err, null);
        }
        else {
            cb(null, res[0].count);
        }
    });
};

/**
 * count user by deviceId
 * @param deviceId
 * @param cb
 */
userDao.countByDeviceID = function(deviceId, cb){
    var sql = 'select count(*) as count from user where deviceId = ?';
    var args = [deviceId];

    mysql.query(sql,args,function(err,res){
        if (err){
            cb(err,null);
        }else {
            cb(null,res[0].count);
        }

    })
};

/**
 * count user by IDCard
 * @param deviceId
 * @param cb
 */
userDao.countByIDCard = function(idcard, cb){
    var sql = 'select count(*) as count from user where idcard = ?';
    var args = [idcard];

    mysql.query(sql,args,function(err,res){

        if (err){
            cb(err,null);
        }else {
            cb(null,res[0].count);
        }

    })
};

/**
 * create a new user
 * @param username
 * @param password
 * @param securityId
 * @param securityAns
 * @param regChannel
 * @param role
 * @param simId
 * @param deviceId
 * @param cb
 */
userDao.createUser = function (username, password, regChannel, role, simId, deviceId, cb) {

    var sql = 'insert into user (username, password,regChannel, role, simId, deviceId, regTime) values ( ?, ?, ?, ?, ?, ?, ?)';
    var args = [username, password, regChannel, role, simId, deviceId,  utils.toMysqlFormat(new Date())];

    mysql.insert(sql, args, function(err, res) {

        if (err) {
            cb(err, null);
            return;
        }
        else {
            cb(null, res.insertId);
        }
    });
};

userDao.createUserByWeChat = function (username, password, openid, cb) {

    var sql = 'insert into user (username, password, regChannel, simId, deviceId, regTime, openid, bindTime, bindStatus) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var args = [username, password, "WeChat", openid, openid, utils.toMysqlFormat(new Date()), openid, utils.toMysqlFormat(new Date()), 2];

    mysql.insert(sql, args, function(err, res) {

        if (err) {
            cb(err, null);
            return;
        }
        else {
            cb(null, res.insertId);
        }
    });
};

userDao.webCreateUser = function (username, password,realName,idCard, regChannel, role,  cb) {

    var sql = 'insert into user (username, password,regChannel, role, realName, idCard, regTime) values ( ?, ?, ?, ?, ?, ?, ?)';
    var regTime = new Date();
    var args = [username, password, regChannel, role, realName, idCard,  utils.toMysqlFormat(regTime)];

    mysql.insert(sql, args, function(err, res) {

        if (err) {
            cb(err, null);
            return;
        }
        else {
            cb(null, res.insertId);
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

/**
 * Get user info by username
 * @param {String} username 唯一标识
 * @param {function} cb
 */
userDao.getUserByPhoneNum = function (phoneNum, cb){

    var sql = 'SELECT * FROM user WHERE phoneNum = ?';

    mysql.query(sql, phoneNum, function(err, res){

        if(err || !res.length) {
            console.log("userDao.getUserByName: ", sql, phoneNum, err, res);
            cb(1, null);
        }
        else {
            cb(null, res[0]);
        }
    });
};

userDao.getUserById = function (uid, cb){

    var sql = 'SELECT user.*, LOCATE(user.username, user.deviceId) type FROM user LEFT JOIN player ON user.uid = player.uid WHERE player.cid = ?';
    var args = [uid];

    mysql.query(sql, args, function(err, res){

        if(err) {
            console.log("userDao.getUserById: ", sql, args, err, res);
            cb(err, null);
        }
        else {
            cb(null, res);
        }
    });
};

/**
 * update password by uid;
 * @param uid
 * @param password
 * @param cb
 */
userDao.updatePwdByUid= function(uid,password,cb){
    var sql = 'update user set password = ? where uid = ?';
    var args = [password,uid];
    mysql.update(sql,args,function(err,res){

        if (err){
            cb(err,null);
            return;
        }else {
            cb(null,res);
        }
    });
};

/**
 * update Device by uid
 * @param userId
 * @param deviceId
 * @param cb
 */
userDao.updateUserDevice = function(uid,deviceId,cb){
    var sql = 'update user set deviceId = ? where uid = ?';
    mysql.update(sql,[deviceId,uid],function(err){

        if (err){
            cb(1);
        }else {
            cb(null);
        }
    });
};

/**
 * delete token by userId
 * @param userId
 * @param cb
 */
userDao.deleteTokenWithUid = function(userId){
    var sql = 'delete from user_token where uid = ?';
    mysql.delete(sql,[userId]);
};

/**
 * creat or inser token depend on uid
 * @param userId
 * @param token
 * @param deviceId
 * @param cb
 */
userDao.createToken = function(userId,token,deviceId,cb){
    var self = this;

    var sql = 'INSERT INTO user_token (uid,token,deviceId,createTime,updateTime) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE token= ? ,deviceId = ? ,updateTime = ?';
    var args = [userId,token,deviceId,utils.toMysqlFormat(new Date),utils.toMysqlFormat(new Date),token,deviceId,utils.toMysqlFormat(new Date())];
    mysql.insert(sql,args,function(err,res){
        if (err){
            cb(err,null);
            return;
        }
        cb(null,res);
        //更新设备
        self.updateUserDevice(userId,deviceId,function(){});
    });

};

/**
 * 通过取到编号获取对应的系统版本
 * @param sys 渠道号
 * @param cb
 */
userDao.getVersionBySys = function (sys,cb) {
    var sql = 'SELECT * FROM version_check WHERE phone_system = ?;';
    mysql.query(sql,[sys],function(err,res){
        if (err || !res.length){
            cb(1,null);
            return;
        }
        cb(null,res[0]);
    });
};

userDao.getGeneralPlayerNow = function (cb) {

    var sql = 'SELECT "今天" day, COUNT(a.uid) userCount, (SUM(coin) + SUM(safe)) coinTotal FROM (SELECT uid FROM user WHERE role != 11) a LEFT JOIN (SELECT uid, coin FROM player) b ON a.uid = b.uid LEFT JOIN (SELECT uid, coin safe FROM safe_box) c ON a.uid = c.uid';

    mysql.query(sql, null, function (err, res) {

        if(err){
            cb(err, null);
        } else {
            cb(null, res);
        }

    });
};

//获取未售出的靓号
userDao.getCornetList = function (cb) {
    var sql = 'SELECT * FROM cornet WHERE reveal = 1;';
    mysql.query(sql, null, function (err, res) {
        if(err){
            cb(err, null);
        } else {
            cb(null, res);
        }

    });
};

//获取封禁的IP地址
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

//获取封禁设备
userDao.getBanDeviceId = function (cb) {

    var sql = 'select deviceId from ban_device';

    mysql.query(sql, null, function (err, res) {

        if(!err && res.length){
            cb(null,res);
        }else {
            cb(1,null);
        }
    });
};

/**
 * 从这往下都是一些工具方法
 * @param cb
 */

userDao.getDeviceId = function (cb) {
    var sql = 'select distinct(deviceId) from user where uid > 102000';
    mysql.query(sql,null, function (err, res) {
        if(err){
            cb(err,res);
        }else {
            cb(null,res);
        }
    });
};

userDao.getUserByDeviceId = function (deviceId,cb) {
    var sql = 'select uid from user where deviceId = ? ';
    mysql.query(sql,[deviceId], function (err, res) {
        if(err){
            cb(err,null);
        }else {
            cb(null,res);
        }
    });
};

userDao.getDiedUid = function (day,cb) {
    var sql = 'SELECT uid FROM user WHERE (uid > 101999 OR uid < 100000) and DATE_FORMAT(lastLoginTime ,"%Y-%m-%d") < DATE_SUB(CURDATE(), INTERVAL '+day+' DAY);';
    mysql.query(sql,null, function (err, res) {
        if(err || !res.length){
            cb(err,null);
        }else {
            cb(null,res);
        }
    });
};

userDao.getUnuseCoin = function (uid,cb) {
    var sql = 'SELECT P.uid, P.coin + IFNULL(S.coin,0) AS coin FROM player P LEFT JOIN safe_box S ON P.uid = S.uid WHERE P.uid = ?;';
    mysql.query(sql,[uid], function (err, res) {
        if(err){
            cb(err);
        }else {
            cb(null,res[0].coin);
        }
    });
};
userDao.getChannelDeviceId = function (args,cb) {
    var sql = 'SELECT deviceId FROM USER WHERE regChannel = ? AND regTime > ? AND regTime < ?;';
    mysql.query(sql,args, function (err, res) {
        if(err){
            cb(1,null);
        }else {
            cb(null,res);
        }
    });
};

userDao.getCoAccount = function (openid, cb) {

    var sql = 'SELECT player.cid uid, user.username, LOCATE(user.username, user.deviceId) type, bindStatus FROM user LEFT JOIN player ON user.uid = player.uid WHERE user.openid = "'+ openid  +'"';

    mysql.query(sql, null, function (err, res) {

        if(err){
            console.log("userDao.getCoAccount: ", sql, null, err, res);
            cb(err, null);
        }else {
            cb(null, res);
        }
    });
};

userDao.getCoAccountForType = function (openid, type, cb) {

    var sql = 'SELECT uid, bindStatus FROM user WHERE openid = "'+ openid  +'" and LOCATE(username, deviceId) = ' + type;

    mysql.query(sql, null, function (err, res) {

        if(err){
            console.log("userDao.getCoAccountForType: ", sql, null, err, res);
            cb(err, null);
        }else {
            cb(null, res);
        }
    });
};

userDao.bindUserForReg = function (username, openid, cb) {

    var sql = 'UPDATE user SET openid = "'+ openid +'" , bindTime = "'+ utils.toMysqlFormat(new Date) +'" , bindStatus = 1 WHERE username = "'+ username +'"';

    mysql.query(sql, null, function (err, res) {

        if(err){
            console.log("userDao.bindUserForReg: ", sql, null, err, res);
            cb(err, null);
        }else {
            cb(null, res);
        }
    });
};

userDao.bindUserForVis = function (uid, openid, cb) {

    var sql = 'UPDATE user SET openid = "'+ openid +'" , bindTime = "'+ utils.toMysqlFormat(new Date) +'" , bindStatus = 1 WHERE uid = "'+ uid +'"';

    mysql.query(sql, null, function (err, res) {

        if(err){
            console.log("userDao.bindUserForVis: ", sql, null, err, res);
            cb(err, null);
        }else {
            cb(null, res);
        }
    });
};

userDao.sendBindEmaiForReg = function (uid, openid, cb) {

    var sql = 'insert into email (uid, title, content, hasConfirm, remark, createTime, validity, isStar) values (?,?,?,?,?,?,?,?)';
    var args = [uid, "游戏账号绑定微信", "请确认: 是否在#维加斯游戏#微信公众号中进行账号绑定操作. 若无误, 请点击[确认]按钮完成绑定. 如过期, 请到微信公众号中重新申请绑定.", 1, openid, utils.toMysqlFormat(new Date), utils.toMysqlFormat(new Date(Date.now()+24*60*60*1000)), 1];

    mysql.query(sql, args, function (err, res) {

        if(err){
            console.log("userDao.sendBindEmaiForReg: ", sql, args, err, res);
            cb(err, null);
        }else {
            cb(null, res);
        }
    });
};

userDao.sendBindEmaiForVis = function (uid, openid, cb) {

    var sql = 'insert into email (uid, title, content, hasConfirm, remark, createTime, validity, isStar) values (?,?,?,?,?,?,?,?)';
    var args = [uid, "游戏账号绑定微信", "请确认: 是否在#维加斯游戏#微信公众号中进行账号绑定操作. 若无误, 请点击[确认]按钮完成绑定. 如过期, 请到微信公众号中重新申请绑定.", 1, openid, utils.toMysqlFormat(new Date), utils.toMysqlFormat(new Date(Date.now()+24*60*60*1000)), 1];

    mysql.query(sql, args, function (err, res) {

        if(err){
            console.log("userDao.sendBindEmaiForVis: ", sql, args, err, res);
            cb(err, null);
        }else {
            cb(null, res);
        }
    });
};

userDao.getEmailUid = function (cb) {
    var sql = 'select distinct(uid) from email';
    mysql.query(sql,null, function (err, res) {
        if(err){
            cb(err,null);
        }else {
            cb(null,res);
        }
    });
};

userDao.countEmailNum = function (uid,cb) {
    var sql = 'select count(*) as count from email where uid = ?';
    mysql.query(sql,[uid], function (err, res) {
        if(err){
            cb(err,null);
        }
        cb(null,res[0].count);
    });
};

userDao.updateLoginPwdByUid = function(uid, password){

    var sql = 'update user set password = ? where uid = ? and LOCATE(user.username, user.deviceId) = 0';
    var args = [password, uid];

    mysql.query(sql,args,function(err,res){

        if (err){
            console.log("userDao.updateLoginPwdByUid: ", sql, args, err, res);
        }
    });
};

userDao.updateSafeboxPwdByUid = function (uid, password) {

    var sql = 'INSERT INTO safe_box (uid, password, open_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = ?';
    var args = [parseInt(uid), password, utils.toMysqlFormat(new Date()), password];

    mysql.query(sql, args, function(err, res){

        if(err){
            console.log("userDao.updateSafeboxPwdByUid: ", sql, args, err, res);
        }
    });
};

userDao.getPreQQ = function (cb) {

    var sql = 'SELECT * FROM qq_group WHERE present = 1;';

    mysql.query(sql, null, function(err, res){

        if(err){
            cb(1,null);
            return;
        }
        cb(null,res[0]);
    });
};

userDao.getHornMsg = function (cb) {
    var sql = 'select * from horn_msg';
    mysql.query(sql,null, function (err,res) {
        if(err){
            cb(1,null);
            return;
        }
        cb(null,res);
    })
};

userDao.delHornById = function (hornId) {
    var sql = 'DELETE FROM horn_msg WHERE id = ?;';

    mysql.query(sql,[hornId], function () {});
};

/**
 * 添加邮件
 * @param uid           玩家id
 * @param title         邮件标题
 * @param content       邮件内容
 * @param prepose       奖励前置条件
 * @param item          奖励内容 [1,20000|2,2]  //1代表金币,2代表钻石.逗号后跟数量
 * @param validity      失效时间
 * @param createTime    创建时间
 * @param cb
 */
userDao.addMailByUid = function (uid, title, content, prepose, item, validity, createTime, cb){

    var sql = 'insert into email (uid, title, content, prepose, item, validity, createTime) values (?,?,?,?,?,?,?)';
    var args = [uid,title,content, prepose,item,validity ? utils.toMysqlFormat(validity).toString() : validity,utils.toMysqlFormat(createTime).toString()];

    mysql.query(sql, args, function (err, res) {

        if(err){
            console.log("mailDao.addMailByUid: ", sql, args, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

userDao.countExtraUser = function (channelNo,cb) {
    var sql = 'SELECT COUNT(*) count FROM `user` WHERE `regChannel` =?;'
    mysql.query(sql,[channelNo],function(err,res){
        if(err){
            cb(1,null);
        }else {
            cb(null,res[0].count);
        }
    });
};


