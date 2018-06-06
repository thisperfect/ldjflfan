let jwt = require('jsonwebtoken');
let secretKey = require('../../../../../shared/secretKey.json');
let entryService = require('../../../util/entryService');
let Player = require('../../../domain/player');
let gameDao = require('../../../dao/gameDao');


module.exports = function(app) {
  return new Handler(app);
};

let Handler = function(app) {
  this.app = app;
};

let handler = Handler.prototype;

let bindSession = function(self, session, uid){

    session.bind(uid);        //传进的uid给了session
    session.set('areaId', 0);
    session.pushAll(function(err) {
        /*if(err) {
            console.error('set world for session service failed! error is : %j', err.stack);
        }*/
    });
    session.on('closed', onUserLeave.bind(null, self.app));			//监听到closed方法就会调用离开的方法
};

/**
 * New client entry.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	let self = this;
	let token = msg.token;
	let sessionService = self.app.get('sessionService');		// 用来管理session的一个对象
	let loginIP = self.app.sessionService.getClientAddressBySessionId(session.id).ip;

	console.log('connecter -> token:',token);

	if(!token){
		return next(null, {
			code: 1,
			msg:'必要的信息缺失!'
		});
	}

	jwt.verify(token, secretKey.secret, function (err, decode) {

		if (err || decode.exp <= Math.round(new Date().getTime() / 1000)) {

			return next(null, {code: 1, msg: 'token失效,请重新登录!'});
		}

		let uid = decode.uid;
		let deviceId = decode.deviceId;

		//校验设备和uid
		entryService.auth(uid,deviceId,loginIP,function (data) {
			if(data.code){
				return	next(null,{code:data.code,msg:data.msg});
			}

			if(!!sessionService.getByUid(uid)) {
				sessionService.kick(uid, "login by other", function() {});		//剔出前一个玩家
			}

			entryService.enter(uid,loginIP, function (data) {							//登录服务,玩家信息获取
				if(data.code){
					return next(null,{code:data.code,msg:data.msg});
				}
				let playerInfo = data.playerInfo;

                bindSession(self,session,uid);													//绑定UID到session

                self.app.rpc.world.worldRemote.add(session,uid, function(res){		            //进入游戏世界
                    console.log('add world session:%s, code:%s',session,JSON.stringify(res));
                    if (res.code != 0) {
                        return next(null, {
                                    code: 1,
                                    msg : '进入游戏失败!'
                        });

                    }

                    if(playerInfo.isFirst && playerInfo.isFirst == true) {			                    //初次登录初始化一些奖励,比如破产补助

                    }

                    let vipLevel= parseInt(playerInfo['vipLevel']);					                    //VIP玩家推送喇叭消息
                    if( vipLevel > 0){

                        let nickname = value['nickname'] ? value['nickname']:'玩家_'+uid;
                        let content ='欢迎ID为'+ uid +'的玩家【<color=#ffff00>VIP'+vipLevel+'</color>】用户【<color=#ffff00> '+nickname+' </color>】回到了游戏,祝您游戏愉快!';

                        let param = {
                            route: 'onHorn',
                            data: {
                                msg: content,
                                sendId: uid
                            }
                        };

                        setTimeout(function () {
                            self.app.rpc.world.worldRemote.sendWorldMsg(session,param, function () {});
                        },2000);
                    }

                    Player.saveLoginData(uid,deviceId,loginIP);		//保存玩家登录数据,lastLoginTime,ip,deviceId

                    gameDao.recordPlayerAction(uid,playerInfo.coin,playerInfo.jewel,playerInfo.packet,'玩家登录');

                    next(null, {
                        code: 0,
                        playerInfo: playerInfo
                    });
                });

			});
        });
	});
};


/**
 * User log out
 * 玩家退出处理,	1:世界大厅,2:普通场,3:竞技场
 * 如果在游戏中退出需要做特殊处理
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
let onUserLeave = function(app, session) {
    if(!session || !session.uid) {
        return;
    }

    let uid = session.uid;
    console.log('uid onUserLeave!',uid);

    app.rpc.classic.gameClassicRemote.kick(session, uid, function() {});
    app.rpc.unshuffle.gameUnshuffleRemote.kick(session, uid, function() {});

    //退出世界大厅
    app.rpc.world.worldRemote.kick(session, uid, function() {});

    Player.getValue(uid, null, function(data) {
        console.log('onleave getValue data:',JSON.stringify(data));
        if(!data.code && data.player){
            let playerInfo = data.player;
            gameDao.recordPlayerAction(uid,playerInfo.coin,playerInfo.jewel,playerInfo.packet,'玩家退出');
        }
    });
};


/**
 * Publish route for mqtt connector.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.publish = function(msg, session, next) {
	let result = {
		topic: 'publish',
		payload: JSON.stringify({code: 200, msg: 'publish message is ok.'})
	};
    next(null, result);
};

/**
 * Subscribe route for mqtt connector.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.subscribe = function(msg, session, next) {
	let result = {
		topic: 'subscribe',
		payload: JSON.stringify({code: 200, msg: 'subscribe message is ok.'})
	};
  next(null, result);
};