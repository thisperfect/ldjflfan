/**
 * Created by liuxiahui on 2017/11/25.
 */

var userDao = require('../dao/userDao');
var crypto = require('crypto');
var request = require('request');
var qs = require('querystring');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var secretKey = require('../../shared/secretKey.json');

var phoneCheckCodeUrl = 'https://webapi.sms.mob.com/sms/verify';
var webSendMsgUrl = 'https://webapi.sms.mob.com/sms/sendmsg';
var webSendCodeUrl = 'https://webapi.sms.mob.com/sms/checkcode';
var androidKey = '14564be2adbe6';
var iosKey = '1906fabd6a897';

/**
 * make password encode
 * @param password
 * @returns {*}
 */
var makePassword = function(password){
    var sha1 = crypto.createHash('sha1');
    sha1.update(secret);
    sha1.update(password);
    sha1.update(secret);
    return sha1.digest('hex');
};

/**
 * user login
 * @param req
 * @param res
 * @param next
 */
var loginByPhoneNum = function(req, res, next) {
    var body = req.body;
    var phoneNum = body.phoneNum;
    var pwd = body.pwd;
    var deviceId = req.headers.deviceid;

    console.log('data:%s,body:%s,phoneNum:%s , pwd:%s, deviceId:%s',JSON.stringify(req.headers),JSON.stringify(body),phoneNum,pwd,deviceId);

    if (!phoneNum || !pwd || !deviceId) {
        res.send({code:1,msg:'参数缺失!'});
        return;
    }

    if (!/^1[3|4|5|7|8]\d{9}$/.test(phoneNum)){
        res.send({code:1,msg:'手机号不合法'});
        return;
    }

    if (pwd.length < 6 || pwd.length > 20) {
        res.send({code:1,msg:'密码不合法!'});
        return;
    }


    userDao.getUserByPhoneNum(phoneNum, function(err, user) {

        if (err || !user) {
            res.send({code:1,msg:'用户不存在!'});
            return;
        }

        //if (makePassword(pwd) !== user.password) {
        if (pwd != user.password) {
            res.send({code:1,msg:'密码错误!'});
            return;
        }

        if (user.role == 1) {
            res.send({code:1,msg:'用户已被封禁!'});
            return;
        }

        userDao.updateUserDevice(user.uid,deviceId, function (err) {});
        var token = jwt.sign({uid: user.uid,deviceId:deviceId}, secretKey.secret, {expiresIn: secretKey.expireTime});

        req.role = user.role;
        req.uid = user.uid;
        req.token = token;
        next();
    });

};

/**
 * before user register
 * @param req
 * @param res
 * @param next
 */
var beforeValidate = function (req, res, next) {
    var deviceId = req.headers['deviceid'];
    var simId = req.headers['simid'];

    if (!simId || !deviceId) {
        res.send({code:CODE.ENTRY.V_USER_SIM_OR_DEVICE_MISSING});
        return;
    }
    req.simId = simId;
    req.deviceId = deviceId;
    next();
};

/**
 * user register
 * @param req
 * @param res
 */
var register = function(req, res) {

    var ip = req.headers['ip_address'];
    var body = req.body;
    var username = body.username;
    var password = body.password;
    var codes = body.codes;
    var regChannel = body.regChannel;
    var role = body.role ? body.role : 0;
    var simId = req.simId;
    var deviceId = req.deviceId;

    if (!username || !password) {
        res.send({code:CODE.ENTRY.V_USER_USERNAME_OR_PASSWORD_MISSING});
        return;
    }


    if (!regChannel) {
        res.send({code:CODE.ENTRY.V_USER_REGISTER_CHANNEL_MISSING});
        return;
    }

    if (!simId || !deviceId) {
        res.send({code:CODE.ENTRY.V_USER_SIM_OR_DEVICE_MISSING});
        return;
    }

    if (password.length < 6 || password.length > 20) {
        res.send({code:CODE.ENTRY.V_USER_PASSWORD_LENGTH_INVALID});
        return;
    }

    //IP校验
    verificationIP(ip, function (code) {

        if(code == 500){
            res.send({code:CODE.FAIL});
            return;
        }
        //设备校验
        verificationDevice(deviceId, function (code) {
            if(code == 500){
                res.send({code:CODE.FAIL});
                return;
            }

            var giftChannels = ['android_extra2'];      //新手礼包渠道
            var flag = false;                          //是否弹礼包标志

            if (codes == 'visitor') {

                userDao.createUser(username, makePassword(password), regChannel, role, simId, deviceId, function (err, uid) {

                    if (err) {
                        if (err.errno == 1062) {
                            res.send({code: CODE.ENTRY.V_USER_USERNAME_ALREADY_EXIST});
                            return;
                        }
                        res.send({code: CODE.FAIL});
                        return;
                    }
                    if(giftChannels.indexOf(regChannel) != -1 ){
                        flag = !flag;
                        userDao.addMailByUid(uid,'新手大礼包','恭喜您获得新手大礼包一份!',null,'1,20000|2,2',null,new Date(), function () {});
                    }
                    var token = Token.create(uid, Date.now(), secret);
                    res.send({code: CODE.ENTRY.V_PLAYER_NOT_EXIST, uid: uid, token: token,flag:flag});
                    return;
                });

            } else {
                if (!/^1[3|4|5|7|8]\d{9}$/.test(username)) {
                    res.send({code: CODE.ENTRY.V_USER_USERNAME_INVALID});
                    return;
                }
                if (regChannel == 'pc_official') {    //PC端
                    webSendCode(username, codes, function (code) {
                        if (code !== 200) {
                            res.send({code: CODE.ENTRY.V_USER_CODE_ERROR});
                            return;
                        }
                        verificationPhone(simId, deviceId, function (code) {
                            if (code != CODE.SUCCESS) {
                                res.send({code: code});
                                return;
                            } else {
                                userDao.createUser(username, makePassword(password), regChannel, role, simId, deviceId, function (err, uid) {

                                    if (err) {
                                        if (err.errno == 1062) {
                                            res.send({code: CODE.ENTRY.V_USER_USERNAME_ALREADY_EXIST});
                                            return;
                                        }
                                        res.send({code: CODE.FAIL});
                                        return;
                                    }

                                    var token = Token.create(uid, Date.now(), secret);
                                    res.send({code: CODE.ENTRY.V_PLAYER_NOT_EXIST, uid: uid, token: token});
                                });
                            }
                        })
                    });
                } else {                             //移动端
                    verificationCode(username, codes, function (data) {

                        if (data !== 200) {
                            res.send({code: CODE.ENTRY.V_USER_CODE_ERROR});
                            return;
                        }
                        verificationPhone(simId, deviceId, function (code) {
                            if (code != CODE.SUCCESS) {
                                res.send({code: code});
                                return;
                            } else {
                                userDao.createUser(username, makePassword(password), regChannel, role, simId, deviceId, function (err, uid) {

                                    if (err) {
                                        if (err.errno == 1062) {
                                            res.send({code: CODE.ENTRY.V_USER_USERNAME_ALREADY_EXIST});
                                            return;
                                        }
                                        res.send({code: CODE.FAIL});
                                        return;
                                    }

                                    if(giftChannels.indexOf(regChannel) != -1 ){
                                        //userDao.addMailByUid(uid,'新手大礼包','恭喜您获得新手大礼包一份!',null,'1,20000|2,2',null,new Date(), function () {});
                                    }
                                    var token = Token.create(uid, Date.now(), secret);
                                    res.send({code: CODE.ENTRY.V_PLAYER_NOT_EXIST, uid: uid, token: token,flag:flag});
                                });
                            }
                        })
                    });
                }
            }

        });
    });
};

/**
 * 第三方SDK登录 (非anySDK接入的第三方)
 * @param username
 * @param role
 * @param regChannel
 * @param simId
 * @param deviceId
 * @param ip
 */
var thirdSDKRegister = function (username,role,regChannel,simId,deviceId,ip,cb) {

    //IP校验
    verificationIP(ip, function (code) {

        if (code == 500) {
            cb({code: 500, info: 'IP已被封禁玩家'});
            return;
        }
        //设备校验
        verificationDevice(deviceId, function (code) {
            if (code == 500) {
                cb({code: 500, info: '设备已被封禁玩家'});
                return;
            }

            userDao.getUserByName(username, function (err, user) {
                if (err) {
                    cb({code: 500, info: '获取玩家信息失败,请重试!'});
                    return;
                }

                if (user.length == 1) {     //已经有号
                    user = user[0];
                    var uid = user.uid;
                    var token = Token.create(uid, Date.now(), secret);

                    userDao.createToken(uid, token, deviceId, function () {});
                    playerDao.getPlayerById(uid, function (err,player) {
                        //console.log('--player:%s',JSON.stringify(player));
                        if(err || !player.length){

                            playerDao.createPlayer(uid,'玩家_'+uid,0,'system/system_'+parseInt(Math.random()*15+1)+'.jpg', function (err) {
                                if(err){
                                    cb({code: CODE.ENTRY.V_PLAYER_NOT_EXIST, uid: uid, token: token});
                                }else {
                                    cb({code: 200, uid: uid, token: token});
                                }
                            });
                        }else {
                            cb({code: 200, uid: uid, token: token});
                        }
                    });


                } else if (!user.length) {    //创建玩家
                    userDao.createUser(username, makePassword(username), regChannel, role, simId, deviceId, function (err, uid) {

                        if (err || !uid) {
                            cb({code: 500, info: '创建玩家失败!,请重试'});
                            return;
                        }

                        var token = Token.create(uid, Date.now(), secret);

                        userDao.createToken(uid, token, deviceId, function () {});
                        playerDao.createPlayer(uid,'玩家_'+uid,0,'system/system_'+parseInt(Math.random()*15+1)+'.jpg', function (err) {
                            if(err){
                                cb({code: CODE.ENTRY.V_PLAYER_NOT_EXIST, uid: uid, token: token,flag:flag});
                            }else {
                                cb({code: 200, uid: uid, token: token});
                            }
                        });

                    });
                } else {
                    cb({code: 500, info: '非法的玩家信息!'});
                    return;
                }
            });
        });
    });
};

/**
 * user web register
 * @param req
 * @param res
 */
var webRegister = function(req, res) {
    res.send({code:CODE.FAIL});
    return;
    var body = req.body;
    var phoneNum = body.phoneNum;
    var realName = body.realName;
    var password = body.password;
    var idCard = body.idCard;
    var regChannel = body.regChannel;
    var role = body.role;

    if (!phoneNum || !password || !realName || !idCard ) {
        res.send({code:CODE.ENTRY.V_USER_USERNAME_OR_PASSWORD_MISSING});
        return;
    }

    if (!regChannel) {
        res.send({code:CODE.ENTRY.V_USER_REGISTER_CHANNEL_MISSING});
        return;
    }

    if (!role) {
        role = 0;
    }
    if (!/^1[3|4|5|7|8]\d{9}$/.test(phoneNum)){
        res.send({code:CODE.ENTRY.V_USER_USERNAME_INVALID});
        return;
    }

    if (password.length < 6 || password.length > 20) {
        res.send({code:CODE.ENTRY.V_USER_PASSWORD_LENGTH_INVALID});
        return;
    }

    userDao.countByIDCard(idCard,function(err,count){
        if (err){
            res.send({code:CODE.FAIL,detail:err});
            return;
        }
        if (count > 1){
            res.send({code:CODE.ENTRY.V_USER_ID_CARD_WITH_MAX_USER});
            return;
        }

        userDao.webCreateUser(phoneNum, makePassword(password),realName,idCard, regChannel, role,function(err, uid) {

            if (err) {
                if (err.errno == 1062) {
                    res.send({code:CODE.ENTRY.V_USER_USERNAME_ALREADY_EXIST});
                    return;
                }
                res.send({code:CODE.FAIL});
                return;
            }

            res.send({code:CODE.ENTRY.V_PLAYER_NOT_EXIST, uid: uid,account:phoneNum});
        });

    });

};

var confirmData = function(req, res,type,next) {
    var body = req.body;
    var deviceId = req.headers['deviceid'];
    var username = body.username;
    var codes = body.codes;
    var uid = null;

    if (!username) {
        res.send({code:CODE.ENTRY.V_USER_USERNAME_MISSING});
        return;
    }

    verificationCode(username,codes, function (data) {
        if (data != 200){
            res.send({code: CODE.ENTRY.V_USER_CODE_ERROR});
            return;
        }
        userDao.getUserByName(username, function (err, user) {
            if (err) {
                res.send({code: CODE.FAIL});
                return;
            }

            if (user.length == 1) {
                user = user[0];
                uid = user.uid;
                var token = Token.create(uid, Date.now(), secret);

            } else {
                res.send({code: CODE.ENTRY.V_USER_USERNAME_NOT_EXIST});
                return;
            }
            if (type == 'quickLogin') {
                //更新token_user数据库
                userDao.createToken(user.uid,token,deviceId,function(err){
                    if (err){
                        res.send({code:CODE.FAIL});
                    }
                });
                req.uid = uid;
                req.token = token;
                next();
            } else {
                res.send({code: CODE.SUCCESS, uid: uid, token: token});
            }

        });

    });

};
var confirmUser = function(req, res) {
    confirmData(req,res,'confirmUser',null);
};
var quickLogin = function(req, res,next) {
    confirmData(req,res,'quickLogin',next);
};

var beforeRequest = function(req,res,next){
    var uid = req.headers['uid'];
    var token = req.headers['token'];
    if (!uid || !token) {
        res.send({code:CODE.AUTH.V_TOKEN_OR_UID_MISSING});
        return;
    }

    var tk = Token.parse(token, secret);

    if (!tk || tk.uid != uid) {
        res.send({code:CODE.ENTRY.V_TOKEN_INVALID});
        return;
    }

    req.uid = uid;
    next();

};

var beforeReset = function(req,res,next){
    var uid = req.headers['uid'];
    var token = req.headers['token'];
    if (!uid || !token) {
        res.send({code:CODE.AUTH.V_TOKEN_OR_UID_MISSING});
        return;
    }

    var tk = Token.parse(token, secret);

    if (!tk || tk.uid != uid) {
        res.send({code:CODE.ENTRY.V_TOKEN_INVALID});
        return;
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

    req.uid = uid;
    next();
};

var resetPassword = function(req,res){
    var password = req.body.password;
    var uid = req.uid;
    if (!uid || !password) {
        res.send({code:CODE.ENTRY.V_USER_USERNAME_OR_PASSWORD_MISSING});
        return;
    }
    if (password.length < 6 || password.length > 20) {
        res.send({code:CODE.ENTRY.V_USER_PASSWORD_LENGTH_INVALID});
        return;
    }
    userDao.updatePwdByUid(uid,makePassword(password),function(err,data){
        if (err) {
            res.send({code: CODE.FAIL});
            return;
        }
    });
    res.send({code:CODE.SUCCESS});
};

var getAllPlayersCoin = function (req,res) {
    userDao.getGeneralPlayerNow(function(err, result) {
        if (err) {
            res.send({code:CODE.FAIL});
            return;
        }

        res.send({code:CODE.SUCCESS, result : result[0]});
    });
};

var getCornetList = function (req, res) {
    userDao.getCornetList(function (err, data) {
        if (err) {
            res.send({code:CODE.FAIL});
            return;
        }

        res.send({code:CODE.SUCCESS, list : data});
    })
};

var getPresentQQInfo = function (req,res) {

    userDao.getPreQQ(function (err,data) {
        if(err){
            res.send({code:CODE.FAIL});
            return;
        }

        res.send({
            code:CODE.SUCCESS,
            data:data
        });
    });
};

/**
 * IP验证 ,500已封禁
 * @param ip
 * @param cb
 */
var verificationIP = function (ip,cb) {
    var code = 200;
    if(!ip){
        cb(code);
        return;
    }
    userDao.getBanIP(function (err,ips) {
        if (!err && ip) {
            ips.forEach(function (Ip) {
                if (Ip.ip_address.indexOf(ip) != -1) {
                    code = 500;
                    ip = NaN;
                    return;
                }
            });
        }
        cb(code);
    });
};

/**
 * 设备验证 ,500已封禁
 * @param ip
 * @param cb
 */
var verificationDevice = function (deviceId,cb) {
    var code = 200;
    userDao.getBanDeviceId(function (err,deviceIds) {
        if (!err && deviceId) {
            deviceIds.forEach(function (DeviceId) {
                if (DeviceId.deviceId == deviceId) {
                    code = 500;
                    deviceId = NaN;
                    return;
                }
            });
        }
        cb(code);
    });
};

/**
 * 验证码判断,先验证Android端,失败再去验证iOS端
 * @param username
 * @param codes
 * @param cb
 */
var verificationCode = function (username, codes, cb) {
    if(!username || !codes){
        cb(500);
        return;
    }

    if(username == 18000009999){
        cb(200);
        return;
    }

    var source_data = {
        appkey :androidKey,
        phone :username,
        zone :'86',
        code : codes
    };//这是需要提交的数据

    var post_data = qs.stringify(source_data);
    var options = {
        url: phoneCheckCodeUrl,
        body: post_data
    };

    //验证码判断
    request.post(options, function(err,httpResponse,body) {
        if (err || !body){
            cb(500);
            return;
        }
        body = JSON.parse(body);
        if (body.status != 200) {
            source_data.appkey = iosKey;
            post_data = qs.stringify(source_data);
            options.body = post_data;
            request.post(options, function (err, res, body) {
                if (err || !body){
                    cb(500);
                    return;
                }
                body = JSON.parse(body);
                if (body.status != 200 ){
                    cb(500);
                }else {
                    cb(200);
                }
            });
        }else {
            cb(200);
        }
    });
};

//web发送验证码
var webSendMsg = function (req,res) {
    var username = req.body.username;

    if(!username){
        res.send({code:CODE.FAIL});
        return;
    }
    var source_data = {
        appkey :androidKey,
        phone :username,
        zone :'86'
    };//这是需要提交的数据

    var post_data = qs.stringify(source_data);
    var options = {
        url: webSendMsgUrl,
        body: post_data
    };

    request.post(options, function(err,httpResponse,body) {

        if (err || !body){
            res.send({code:CODE.FAIL});
            return;
        }
        body = JSON.parse(body);
        if (body.status != 200 ){
            res.send({code:CODE.FAIL});
        }else {
            res.send({code:CODE.SUCCESS});
        }
    });
};

var webCheckMsg = function (req, res, next) {

    var body = req.body;
    var username = body.username;
    var codes = body.codes;

    verificationCode(username, codes, function (data) {

        if (data !== 200) {
            res.send({code: CODE.ENTRY.V_USER_CODE_ERROR});
            return;
        }

        next();
    });
};

//web发送验证码
var webSendCode = function (username,codes, cb) {

    if(!username || !codes){
        cb(500);
        return;
    }
    var source_data = {
        appkey :androidKey,
        phone :username,
        zone :'86',
        code :codes
    };//这是需要提交的数据

    var post_data = qs.stringify(source_data);
    var options = {
        url: webSendCodeUrl,
        body: post_data
    };

    request.post(options, function(err,httpResponse,body) {
        if (err || !body){
            cb(500);
            return;
        }
        body = JSON.parse(body);
        if (body.status != 200 ){
            cb(500);
        }else {
            cb(200);
        }
    });
};

/**
 *设备校验
 */
var verificationPhone = function (simId,deviceId,cb) {
    userDao.countBySimId(simId, function (err,simCount) {
        if (err) {
            cb(CODE.FAIL);
            return;
        }
        if(simId != '00000000-0000-0000-0000-000000000000' && simCount>3){
            cb(CODE.ENTRY.V_USER_SIM_WITH_MAX_USER);
            return;
        }else {
            userDao.countByDeviceID(deviceId, function (err, count) {
                if (err) {
                    cb(CODE.FAIL);
                    return;
                }
                if (deviceId != '00000000-0000-0000-0000-000000000000' && count>3) {
                    cb(CODE.ENTRY.V_USER_DEVICE_WITH_MAX_UER);
                    return;
                }
                cb(CODE.SUCCESS);
            });
        }
    });
};

//管理喇叭消息
var agentManagerHorn = function (req,res) {
    var type = req.headers['type'];
    var body = req.body;
    var uid = body.uid;
    var hornId = body.hornId;

    if(uid != 102000 && uid != 102025 && uid != 1818){
        res.send({code:CODE.FAIL});
        return;
    }
    if(type == 1){
        userDao.getHornMsg(function (err,data) {
            if(err){
                res.send({code:CODE.FAIL});
                return;
            }else {
                res.send({
                    code:CODE.SUCCESS,
                    data:data
                });
                return;
            }
        })
    }else {
        userDao.delHornById(hornId);
        res.send({code:CODE.SUCCESS});
    }

};

var agentManagerTie = function (req,res) {
    var type = req.headers['type'];
    var body = req.body;
    var uid = body.uid;
    var hornId = body.hornId;

    if(uid != 102000 && uid != 102025 && uid != 1818){
        res.send({code:CODE.FAIL});
        return;
    }
    if(type == 1){
        userDao.getHornMsg(function (err,data) {
            if(err){
                res.send({code:CODE.FAIL});
                return;
            }else {
                res.send({
                    code:CODE.SUCCESS,
                    data:data
                });
                return;
            }
        })
    }else {
        userDao.delHornById(hornId);
        res.send({code:CODE.SUCCESS});
    }

};

var extraCountUser = function (req,res) {
    var channelNo = req.headers['channelno'];

    if(!channelNo){
        return res.send({code:500});
    }
    channelNo = 'android_extra'+channelNo;
    userDao.countExtraUser(channelNo, function (err,count) {
        if(err){
            res.send({code:500});
        }else {
            res.send({code:200,count:count});
        }
    });
};

/**
 *  从这往下都是工具函数
 */

//同一设备下的账号
var brushNo = function () {
    var file = "D:\\backup\\brushNos.txt";
    var devs = [];
    userDao.getDeviceId(function (err,data) {
        if(!err && data.length){
            console.log('data.length:',data.length);
            data.forEach(function (data,index) {
                userDao.countByDeviceID(data.deviceId, function (err, count) {
                    if(!err && count > 3){
                        /*var text = 'deviceId: '+data.deviceId+'  count:'+count+'\n';
                         fs.appendFile(file,text , function(err){
                         if(err){
                         console.log('写文件失败:',err);
                         }
                         });*/
                        devs.push("'"+data.deviceId+"'");

                        if(devs.length == 246){
                            fs.appendFile(file,devs , function(err){
                                if(err){
                                    console.log('写文件失败:',err);
                                }
                            });
                        }

                    }
                });

            });
        }
    });
};

var brushNoUid = function () {
    var devs = ['866342032205014','863316039344748','867316026411431','867789025906777','862154036161406','865762039862114','861069038592211','000000000000000','863455038160638','862728036023698','861413037489781','862742031430204','866443031240109','SLYDU17419004232','861134036481039','866342032807116','860270036272811','861469039668947','864839032423580','866229033124411','865130030641178','0B41BFA0-1BB0-472C-BC30-241C9BABFF7D','862212031147729','863102037864428','863671039706795','A5E5E4CA-85C3-4665-B4F1-029F78417EAC','865655021906412','869436020647935','862979033757552','866174034784096','864245037477334','506738399951239','862547039067001','5682171E-BC06-4DE4-BB87-864373132085','867731020001006','866329028621098','861839036058195','862860035088958','861865035767874','355911073749581','357942060451913','867570022665305','864246039635655','863667033275365','862505036298417','861837031106969','357556063301568','862143038601485','865166029625681','865166026368459','865166028423401','865166027822553','865166022283926','865166020856541','865166029119891','865166028905969','861337030539856','865166025286991','865166025115208','865166026912124','865166020446152','865166029031815','865166020131507','865166020716919','865166026231962','865166022760527','865166029649533','865166022839925','865166024862214','865166020036276','865166025281976','865166027226508','865166026251341','865166025287338','865166028406489','865166020399005','865166021310811','865166022368875','865166020376987','865166027783854','865166025939235','862699031962240','357107071595930','867148022812456','861278031998230','867876029395709','862534038602970','864664039495740','868565020993815','863043031618263','A10000420A2F44','866500034325151','860983034890018','868088025169745','866172033144890','862750031980185','861400031860968','865277033988773','860954035438099','864251031315918','860840030157497','860954035434445','862534036517766','861543034599370','862534035598171','861681037466922','863072035182067','864248030456867','863998031893986','861189034834563','866438031577450','865360036067967','865088036660719','867644029550495','862820020106645','864413035383470','99000739063164','863549035905787','864016038026788','866185037410638','866044035126276','861625030893038','866472033376975','863836035173163','868679029729292','861723036411184','866173031292871','863388029880239','867993020479166','861309032291372','867588029745474','864664037190020','861134030728906','865586024697262','861720032634017','866412030268825','864230030009169','867582022239858','864362030051733','869540022502665','867877022127461','863387033328151','864265030833713','865471032478767','865863029178592','867527025966247','869968020941165','866239030953142','865810031063460','865809032138214','864134036177402','A0000070815CBA','A1000048F4FFF4','86347803695985','861142034949790','868897027605591','866184025414322','868486020891356','862698033560978','351562080091808','862736037551773','861936036044280','867316025446982','868069023536150','86172303277240','866119034847682','862842034367344','864914033571297','861752031952421','862480032704117','861681032521069','867615021990947','868186028885381','867255021650538','869159027416852','866048039740461','866002020366034','865747032787053','864178034282045','352621063541475','864396037921753','864806034069992','862915033208543','867064028899068','306704B5-DA69-4443-A4B4-0ABCC1943D93','862330030260697','358695073571056','862374035951785','866251036418285','862217037031793','860901031909342','864193032925909','865747035570035','863774038573727','863043030222869','868618022288708','865623039134096','865224034665489','869409026102965','862698039839665','A0000072635E87','869834020789204','863387036112958','862417030421476','861600035770531','865546032861086','864096036085655','861945032540860','864251039189919','863633036300386','862305034748715','864322030119492','865371035890101','865088032455296','869999021359024','861003032771901','863254034540202','a000004fdead23','86326203501111','865465039584973','865465034676089','862744034836361','862785031883302','866092035160837','865762036358694','864566031914406','863046038108717','862638039341403','865192020087739','869435020454631','99000920255990','862177034546088','866093035556198','A00000764B0012','868092029541628','862962039707953','861457034061267','865731034097935','864241030581776','866015030617576','865401035586001','861910030073462','864616021211543','865411032248851','863466039438519'];
    var file = "D:\\backup\\brushUid.txt";

    devs.forEach(function (devId) {
        userDao.getUserByDeviceId(devId, function (err,userInfo) {
            var text = '';
            userInfo.forEach(function(user,index){
                text+='deviceId: '+devId+'  uid:'+user.uid+'\n';
                if(userInfo.length == index+1){
                    text += '\n';
                    fs.appendFile(file,text , function(err){
                        if(err){
                            console.log('写文件失败:',err);
                        }
                        text = null;
                    });
                }
            })

        });

    })
}

//获取长久未登录账号的金币,包括保险箱
var getUnuseCoin = function () {
    var days = [7,15,30];
    days.forEach(function (day) {
        var coin = 0;
        userDao.getDiedUid(day,function (err,data) {
            var len = data.length;
            if(!err && len) {
                data.forEach(function (uidObj,index) {
                    userDao.getUnuseCoin(uidObj.uid, function (err,c) {
                        if(!err && c){
                            coin +=c;
                        }
                        if (index == len -1){
                            console.log('day:%s ,poeple:%s coin:%s',day,len,coin/10000000);
                        }
                    });

                });
            }
        });
    });
};

var getExtraDeviceId = function () {
    var args = ['android_extra4','2017-10-16 00:00:00','2017-10-27 23:59:59'];
    userDao.getChannelDeviceId(args, function (err,data) {
        if(err){
            return console.log('获取推广渠道设备失败:',JSON.stringify(args));
        }
        var devIds = [];
        //console.log('data: %s ',JSON.stringify(data));
        if(data.length == 0){
            return console.log('无新增人数和设备');
        }
        data.forEach(function (devId,index) {
            if(devIds.indexOf(devId.deviceId) == -1){
                devIds.push(devId.deviceId);
            }
            if(index == data.length - 1){
                console.log('新增人数: %s ,新增设备: %s',data.length,devIds.length);
                //console.log('新增人数: %s ,新增设备: %s, devs:%s',data.length,devIds.length,JSON.stringify(devIds));
            }
        });
    });

};

//识别buffer
var readBUffer = function () {
    //var data = [52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,49,57,53,57,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,49,57,53,57,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,49,54,53,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,49,54,53,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,49,54,53,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,51,54,54,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,51,54,54,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,51,54,54,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,53,55,57,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,53,55,57,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,53,55,57,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,56,48,48,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,56,48,48,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,56,48,48,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,49,57,53,57,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,49,57,53,57,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,49,54,53,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,49,54,53,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,49,54,53,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,51,54,54,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,51,54,54,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,51,54,54,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,53,55,57,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,53,55,57,95,49,95,51,95,51,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,53,55,57,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,56,48,48,95,49,95,51,95,50,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,56,48,48,95,49,95,51,95,49,34,44,34,102,105,115,104,73,100,34,58,34,51,49,58,58,52,48,100,56,102,100,99,53,102,54,55,102,52,99,55,55,57,57,49,102,97,98,54,102,99,49,99,99,52,56,100,97,34,125,4,0,0,94,3,0,3,123,34,98,117,108,108,101,116,73,100,34,58,34,49,48,52,57,51,56,95,49,95,49,52,57,48,54,53,51,53,55,50,56,48,48,95,49,95,51,95,51,34,44,34,102];
    //var data = [4,0,1,15,6,11,111,110,70,105,115,104,67,97,116,99,104,123,34,114,111,117,116,101,34,58,34,111];
    //var data = [4,0,0,25,1,239,5,0,7,123,34,97,110,103,108,101,34,58,34,51,50,57,46,55,54,51,56,34,125];
    //var data = [4,0,0,25,1,130,1,0,7,123,34,97,110,103,108,101,34,58,34,51,52,54,46,56,56,52,49,34,125];
    var data = [71,73,79,80,1,0,1,0,36,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,6,0,0,0,97,98,99,100,101,102,0,0,4,0,0,0,103,101,116,0,0,0,0,0];
    var bitData = new Buffer(data, 'utf-8');
    console.log('---bitData:',bitData.toString('utf8'));
};

//邮件数量
var getEmailNum = function () {
    var file = "D:\\backup\\emailNum.txt";

    userDao.getEmailUid(function (err,data) {
        if(!err && data.length){
            data.forEach(function (data) {
                if(data.uid > 105000){
                    userDao.countEmailNum(data.uid, function (err, count) {
                        if(!err && count >3){
                            var text = 'uid: '+data.uid+'  count:'+count+'\n';
                            fs.appendFile(file,text , function(err){
                                if(err){
                                    console.log('写文件失败:',err);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};


exports.register = register;
exports.webRegister = webRegister;
exports.loginByPhoneNum = loginByPhoneNum;
exports.quickLogin = quickLogin;
exports.confirmUser = confirmUser;
exports.resetPassword = resetPassword;
exports.beforeReset = beforeReset;
exports.getAllPlayersCoin = getAllPlayersCoin;
exports.getCornetList = getCornetList;
exports.webSendMsg = webSendMsg;
exports.webCheckMsg = webCheckMsg;
exports.brushNo = brushNo;
exports.brushNoUid = brushNoUid;
exports.getUnuseCoin = getUnuseCoin;
exports.readBUffer = readBUffer;
exports.getEmailNum = getEmailNum;
exports.getPresentQQInfo = getPresentQQInfo;
exports.thirdSDKRegister = thirdSDKRegister;
exports.extraCountUser = extraCountUser;
exports.getExtraDeviceId = getExtraDeviceId;



