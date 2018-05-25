var mysql = require('./mysql/mysql');

var playerDao = module.exports;

//Array 数组乱序
if (!Array.prototype.shuffle) {
    Array.prototype.shuffle = function() {
        for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
        return this;
    };
}

/**
 * create player
 * @param uid
 * @param nickname
 * @param sex
 * @param avatar
 * @param cb
 */
playerDao.createPlayer = function(uid, nickname, sex, avatar, cb){

    var self = this;
    var sql = 'insert into player (uid,cid,nickname, sex, avatar) values (?, ?, ?, ?, ?)';
    var args = [uid, uid, nickname, sex, avatar];

    mysql.insert(sql, args, function(err){
        if(err){
                cb(err, null);
            }
        else {
            self.equipBag(uid, cb)
        }
    });
};

playerDao.equipBag = function(uid, cb){

    var sql = 'insert into player_bag (uid) values (?)';
    var args = [uid];

    mysql.insert(sql, args, function(err, res){

        if(err){
            cb(err, null);
        } else {
            cb(null, JSON.stringify(res.affectedRows));
        }
    });
};

/**
 * get player info by id
 * @param pid
 * @param cb
 */
playerDao.getPlayerById = function(pid, cb){

    var sql = 'select * from player where uid = ?';
    var args = [pid];

    mysql.query(sql, args, function(err, res){

        if(err){
            cb(err, null);
        } else {
            cb(null, res);
        }
    });

};

playerDao.saveOrderPlayer = function(columns, callback){

    var rs = [];

    rs.push('(\'' + columns.join("\',\'") + '\')');     //从末尾插入数据(把传进来的参数数组columns分隔成一个用括号包起来的用逗号分隔的一个字符串然后推入rs数组中)

    var sql = 'INSERT INTO user_orders (id, uid, cash, source, trade_id, trade_no, charge_account, stats, pay_date) VALUES ' + rs.join(",");

    mysql.insert(sql, [], function(err){

        if(err !== null){

            callback(err);

        } else {

            callback(null);
        }

    });
};

playerDao.getOrderAlready = function(tradeNo, callback){

    var sql = 'select * from user_orders where trade_no = ?';
    mysql.query(sql,[tradeNo], function(err, res){
        if (err || res.length){
            callback(500);
        }else {
            callback(200);
        }
    });
};

/**
 * 排行榜相关
 **/

/**
 * 魅力值排行榜
 * 5天内充值最多的
 */
playerDao.getCharmRankList = function (cb) {

    var sql = 'SELECT P.uid,P.nickname,P.avatar,P.level,FLOOR(O.cash/10) charm FROM player P,(SELECT uid,role FROM `user` WHERE  role != 1) AS U ,(SELECT uid,SUM(cash) AS cash FROM user_orders WHERE DATE_FORMAT(`pay_date`,"%Y-%m-%d") > DATE_SUB(CURDATE(), INTERVAL 5 DAY) GROUP BY uid ORDER BY cash DESC LIMIT 50) AS O WHERE P.uid = O.uid AND P.uid = U.uid;';

    mysql.query(sql,null, function (err, rankData) {

        if(err){
            console.log("playerDao.getCharmRankList: ", sql, null, err, res);
            cb(1, null);
        } else {
            playerDao.getCidPlayerList(function (err,cids) {
                if(!err || cids.length){
                    rankData = cids.shuffle().concat(rankData).slice(0,50);
                }
                cb(null,rankData);
            });
        }
    });
};

/**
 * 风云榜
 * 5天内赠送礼物最多
 */
playerDao.getBillboardRankList = function (cb) {

    var sql = 'SELECT P.uid,P.nickname,P.avatar,P.level FROM player P,(SELECT guest,SUM(guideFee) guideFee FROM game_fivechess  WHERE winner != `owner` AND guest != 0 AND sbFlag = 1 AND DATE_FORMAT(`addTime`,"%Y-%m-%d") > DATE_SUB(CURDATE(), INTERVAL 5 DAY) GROUP BY guest ORDER BY guideFee DESC LIMIT 50) AS F,(SELECT uid,role,isBusiness FROM `user` WHERE role != 1 AND role != 11 AND role != 5 AND isBusiness !=1) AS U1 WHERE P.uid = F.guest AND U1.uid = F.guest;';

    mysql.query(sql,null, function (err, rankData) {

        if(err){
            console.log("playerDao.getBillboardRankList: ", sql, null, err, res);
            cb(1, null);
        } else {
            playerDao.getCidPlayerList(function (err,cids) {
                if(!err || cids.length){
                    rankData = cids.shuffle().concat(rankData).slice(0,50);
                }
                cb(null,rankData);
            });
        }

    });
};

/**
 * 琅琊榜
 */
playerDao.getLangyaRankList = function (cb) {

    var sql = 'SELECT P.uid,P.nickname,P.avatar,P.level FROM player P,(SELECT uid,role,isBusiness FROM `user` WHERE role = 2 AND role != 1) AS U WHERE P.uid = U.uid GROUP BY P.uid ORDER BY P.coin DESC LIMIT 50;';

    mysql.query(sql,null, function (err, rankData) {

        if(err){
            console.log("playerDao.getLangyaRankList: ", sql, null, err, res);
            cb(1, null);
        } else {
            playerDao.getCidPlayerList(function (err,cids) {
                if(!err || cids.length){
                    rankData = cids.shuffle().concat(rankData).slice(0,50);
                }
                cb(null,rankData);
            });
        }
    });
};

/**
 * 短号排行榜
 * @param cb
 */
playerDao.getCidPlayerList = function (cb) {
    var sql = 'SELECT P.uid,P.nickname,P.avatar,P.level FROM player P,(SELECT uid,role,isBusiness FROM `user` WHERE role = 5 OR isBusiness = 1 AND role != 1 AND uid<100000) AS U WHERE P.uid = U.uid AND P.cid<100000;';
    mysql.query(sql,null, function (err, res) {

        if(err){
            console.log("playerDao.getCidPlayerList: ", sql, null, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }
    });
};

/**
 * JB排行榜
 *
 */
playerDao.getRankedList = function (paging,cb) {

    /* 不包括保险箱的金币
     var sql = 'SELECT uid, nickname, avatar, coin, level FROM player ORDER BY coin DESC LIMIT 50;';
     */

    var sql = 'SELECT P.uid, P.nickname, P.avatar, P.level,P.coin + IFNULL(S.coin,0) AS coin FROM player P LEFT JOIN safe_box S ON P.uid = S.uid RIGHT JOIN `user` U ON U.uid = P.uid AND U.role != 1 ORDER BY coin DESC LIMIT ?,50;';

    /*vip等级
     var sql = 'SELECT uid, nickname, avatar, coin, vipLevel level FROM player WHERE vipLevel < 8 ORDER BY vipLevel DESC LIMIT 50;';*/

    //var sql = 'SELECT zz.* FROM (SELECT @i:=0) it, (SELECT b.cid uid, FORMAT(a.coin, 0) coin, b.nickname, b.vipLevel LEVEL FROM (SELECT x.* FROM (SELECT uid, SUM(coin) coin FROM player_action WHERE DATE_FORMAT(ADDTIME ,"%Y-%m-%d") = CURDATE() AND ACTION REGEXP "^捕鱼游戏: (收入|消耗)" GROUP BY uid) X INNER JOIN (SELECT * FROM USER WHERE role != 1 AND role != 11) Y ON x.uid = y.uid ORDER BY coin DESC LIMIT 50) a LEFT JOIN player b ON a.uid = b.uid) zz;';

    mysql.query(sql,[paging], function (err, res) {

        if(err){
            console.log("playerDao.getRankedList: ", sql, null, err, res);
            cb(err, null);
        } else {
            cb(null, res);
        }

    });
};
