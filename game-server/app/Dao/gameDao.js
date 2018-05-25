/**
 * Created by Administrator on 2017/10/31 0031.
 */
var gameDao = module.exports;

var mysql = require('./mysql/mysql');
var utils = require('../../../shared/utils');

/**
 * 记录玩家操作
 * @param uid
 * @param coin
 * @param jewel
 * @param packet
 * @param action
 */
gameDao.recordPlayerAction = function(uid,coin,jewel,packet,action){
    var sql = 'insert into player_action (uid,coin,jewel,packet,`addTime`,action) VALUES (?,?,?,?,?,?)';
    var args = [uid,coin,jewel,packet,utils.toMysqlFormat(new Date()),action];
    mysql.query(sql,args, function (err) {
        if(err){
            console.log("gameDao.recordPlayerAction: ", sql, args, err);
        }

    });
};

/**
 * 记录系统税收
 * @param uid
 * @param gameId
 * @param landLord
 * @param coin
 * @param rate
 */
gameDao.recordSystemTax = function (uid,coin,jewel,packet,remark) {
    var sql = 'insert into system_tax (uid,taxCoin,taxJewel,taxPacket,remark,addTime) VALUES (?,?,?,?,?,?)';
    var args = [uid,coin,jewel,packet,remark,utils.toMysqlFormat(new Date())];
    mysql.query(sql,args, function (err) {
        if(err){
            console.log("gameDao.recordSystemTax: ", sql, args, err);
        }
    });
};

/**
 * 经典场游戏数据记录
 * @param uid
 * @param gameId
 * @param landLord
 * @param coin
 * @param rate
 */
gameDao.recordClassicYard = function (uid,roomId,landLord,coin,rate,openFlag,springFlag) {
    openFlag = openFlag == -1 ? 0:1;
    var sql = 'insert into game_classic (uid,roomId,landLord,coin,rate,openFlag,springFlag,addTime) VALUES (?,?,?,?,?,?,?,?)';
    var args = [uid,roomId,landLord,coin,rate,openFlag,springFlag,utils.toMysqlFormat(new Date())];
    mysql.query(sql,args, function (err) {
        if(err){
            console.log("gameDao.recordClassicYard: ", sql, args, err);
        }
    });
};
