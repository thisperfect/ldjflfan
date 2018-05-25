var playerDao = require('../dao/playerDao');
var userDao = require('../dao/userDao');


/**
 * after user login
 * @param req
 * @param res
 */
var afterLogin = function (req, res) {
    var uid = req.uid;
    var token = req.token;

    playerDao.getPlayerById(uid, function(err, player) {

        if (err) {
            res.send({code:1,msg:'未知错误,请重试!'});
            return;
        }

        if (player && player.length == 1) {
            res.send({code:0, uid: uid, token: token});
        }
        else {
            res.send({code:0, uid: uid, token: token});
        }
    });
};

/**
 * before create player
 * @param req
 * @param res
 * @param next
 */
var beforeCreate = function (req, res, next) {
    var uid = req.headers['uid'];
    var token = req.headers['token'];
    var deviceId = req.headers['deviceid'];

    if (!uid || !token) {
        res.send({code:CODE.AUTH.V_TOKEN_OR_UID_MISSING});
        return;
    }
    if(!deviceId){
        res.send({code:CODE.ENTRY.V_USER_SIM_OR_DEVICE_MISSING});
        return;
    }

    userDao.countByDeviceID(deviceId, function (err, count) {
        if (err) {
            return res.send({code:CODE.ENTRY.V_USER_DEVICE_WITH_MAX_UER});
        }

        if (deviceId != '00000000-0000-0000-0000-000000000000' && deviceId != '000000000000000' && count>3) {
            userDao.banPlayer(uid,1);
            return res.send({code:CODE.ENTRY.V_USER_DEVICE_WITH_MAX_UER});
        }

        var tk = Token.parse(token, secret);

        if (!tk || tk.uid != uid) {
            return res.send({code:CODE.AUTH.V_TOKEN_INVALID});
        }

        var dateNow = Number(new Date());       //当前的时间数值
        var timestmap = tk.timestamp;           //token中的时间戳
        var expire = dateNow - timestmap;
        if (expire > expireForWeb){
            //超时重新生成token
            token = Token.create(uid, Date.now(), secret);
            res.send({code:CODE.AUTH.V_TOKEN_EXPIRE,uid: uid,newToken:token});
            return;
        }

        //更新token_user数据库
        userDao.createToken(uid,token,deviceId,function(err){
            if (err){
                res.send({code:CODE.FAIL});
                return;
            }
        });
        req.uid = uid;
        next();
    });
};

/**
 * create player
 * @param req
 * @param res
 */
var create = function(req, res) {

    var body = req.body;
    var nickname = body.nickname;
    var avatar = body.avatar;
    var sex = body.sex;
    var uid = req.uid;

    if (!nickname) {
        res.send({code:CODE.ENTRY.V_PLAYER_NICKNAME_MISSING});
        return;
    }

    if (nickname.length < 4 || nickname.length > 12) {
        res.send({code:CODE.ENTRY.V_PLAYER_NICKNAME_INVALID});
        return;
    }

    if (!sex) {
       sex = 1;         //不传默认为男性
    }

    if (sex != 0 && sex != 1) {
        res.send({code:CODE.ENTRY.V_PLAYER_SEX_INVALID});
        return;
    }

    if (!avatar) {
        res.send({code:CODE.ENTRY.V_PLAYER_AVATAR_MISSING});
        return;
    }

    playerDao.createPlayer(uid, nickname, sex, avatar, function(err) {

        if (err) {
            if (err.errno == 1062) {
                res.send({code:CODE.ENTRY.V_PLAYER_NICKNAME_ALREADY_EXIST});
                return;
            }
            res.send({code:CODE.FAIL});
            return;
        }
        res.send({code:CODE.SUCCESS});
    });
};

var delPic = function (req, res) {
    var path = req.body.path;
    upImg.delFile(path);
    res.send({code:CODE.SUCCESS});
};

var getRankingList = function (req, res) {

    var uid = parseInt(req.headers.uid);
    var type = parseInt(req.body.type || 0);
    var paging = parseInt(req.body.paging || 0);
    var uids = [102000,102008,102025,102003,8888,11999];

    if(!uid){
        res.send({
            code: CODE.FAIL
        });
        return;
    }
    if(uids.indexOf(uid) != -1){                //可获取JB榜

        playerDao.getRankedList(paging, function (err,data) {

            if (err) {
                res.send({
                    code: CODE.FAIL
                });
                return;
            }
            res.send({
                code: CODE.SUCCESS,
                flag: 1,
                data: data
            });
        });

    }else {
        if(paging){                         //既不可以获取JB榜又传分页标识
            res.send({
                code: CODE.SUCCESS,
                flag: 0,
                data: []
            });
        }else {

            switch (type){
                case 1:     //魅力值(充值板块)
                    playerDao.getCharmRankList(function (err,data) {
                        if (err) {
                            res.send({
                                code: CODE.FAIL
                            });
                            return;
                        }
                        res.send({
                            code: CODE.SUCCESS,
                            flag: 0,
                            data: data
                        });
                    });
                    break;

                case 2:     //风云榜
                    playerDao.getBillboardRankList(function (err,data) {
                        if (err) {
                            res.send( {
                                code: CODE.FAIL
                            });
                            return;
                        }
                        res.send({
                            code: CODE.SUCCESS,
                            flag: 0,
                            data: data
                        });
                    });
                    break;

                case 3:     //琅琊榜
                    playerDao.getLangyaRankList(function (err,data) {
                        if (err) {
                            res.send({
                                code: CODE.FAIL
                            });
                            return;
                        }
                        res.send({
                            code: CODE.SUCCESS,
                            flag: 0,
                            data: data
                        });
                    });
                    break;
            }

        }
    }
};


exports.afterLogin = afterLogin;
exports.beforeCreate = beforeCreate;
exports.create = create;
exports.delPic = delPic;
exports.getRankingList = getRankingList;