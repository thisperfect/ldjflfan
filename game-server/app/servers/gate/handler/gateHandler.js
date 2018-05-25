var dispatcher = require('../../../util/dispatcher');
var jwt = require('jsonwebtoken');
var secretKey = require('../../../../../shared/secretKey.json');

module.exports = function(app) {
    console.log('0.gate -> app:%s',app);
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function(msg, session, next) {
    var token = msg.token;
    var self = this;
    if(!token) {
        next(null, {
            code: '1',
            msg:'参数缺失!'
        });
    }else {
        jwt.verify(token, secretKey.secret, function (err, decode) {

            if (err || decode.exp <= Math.round(new Date().getTime() / 1000)) {

                return next(null, {code: 1, msg: '证书失效!'});
            }

            var uid = decode.uid;


            // get all connectors

            var connectors = self.app.getServersByType('connector');        //根据服务类型获取服务器信息
            console.log('gate -> connectors:%s',JSON.stringify(connectors));
            if(!connectors || connectors.length === 0) {
                next(null, {
                    code: 1,
                    msg:'服务不可用,请重试!'
                });
                return;
            }
            // select connector
            var res = dispatcher.dispatch(uid.toString(), connectors);
            console.log('gate -> res:%s',JSON.stringify(res));
            next(null, {
                code:0,
                host: res.host,
                port: res.clientPort
            });
        });
    }
};
