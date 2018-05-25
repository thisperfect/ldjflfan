var express = require('express');
var app = express();
var secretKey = require('../shared/secretKey.json');
var mysql = require('./dao/mysql/mysql');
 var user = require('./core/user');
 var player = require('./core/player');
var jwt = require('jsonwebtoken');


app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.urlencoded());
  app.use(app.router);
  app.set('view engine', 'jade');
  app.set('views', __dirname + '/public');
  app.set('view options', {layout: false});
  app.set('basepath',__dirname + '/public');
});

app.configure('development', function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

mysql.init();

app.all('*',function(req,res,next){
  var token = req.headers.token;
  if(token){
    jwt.verify(token, secretKey.secret, function (err, decode) {
      if (err || decode.exp <= Math.round(new Date().getTime() / 1000)) {

        return res.send({code: 1, msg: '证书失效!'});
        next();
      }

      var uid = decode.uid;
      req.headers.uid = uid;
    });
  }
  //console.log('req.url:%s, body:%s',req.url,JSON.stringify(req.body));
  next();
});

app.post('/user/loginByPhoneNum', user.loginByPhoneNum, player.afterLogin);
//app.post('/user/quickLogin', user.quickLogin, player.afterLogin);
//app.post('/user/register', user.beforeValidate, user.register);
//app.post('/player/create', player.beforeCreate, player.create);
//app.post('/player/uploadPic', player.uploadPic);
//app.post('/player/getPic', player.getPic);
//app.post('/player/getRankingList', player.getRankingList);
//app.post('/user/confirmUser',user.beforeValidate,user.confirmUser);
//app.post('/user/resetPassword',user.beforeReset,user.resetPassword);
//app.post('/user/webRegister',user.webRegister);
//app.post('/activity/addActivity',activity.addActivity);
//app.post('/user/checkVersion',user.checkVersion);
//app.post('/user/getAllPlayersCoin',user.getAllPlayersCoin);
//app.post('/user/getCornetList',user.getCornetList);
//app.post('/user/webSendMsg',user.webSendMsg);


process.on('uncaughtException', function (err) {
  console.error("Caught exception:", err.stack);
});
process.on('unhandledRejection', function (reason, p) {
  console.error("Unhandled Rejection at: Promise ", p, " reason: ", reason.stack);
});

app.listen(3006);

console.log("Web server has started.\nPlease log on http://127.0.0.1:3006/index.html");


