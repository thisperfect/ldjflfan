var pomelo = require('pomelo');
var gameClassicManager = require('./app/services/gameClassicManager');
var gameUnshuffleManager = require('./app/services/gameUnshuffleManager');

/**
 * Init app for client.
 */
var app = pomelo.createApp();       //创建应用
app.set('name', 'DouDiZhuServer');  //设置应用名字

// app configuration

app.configure('production|development', function() {

    // app.enable('systemMonitor');

    app.loadConfig('mysql', app.getBase() + '/../shared/mysql.json');
    var dbClient = require('./app/dao/mysql/mysql').init(app);
    app.set('dbclient', dbClient);

    app.loadConfig('redis', app.getBase() + '/../shared/redis.json');
    var redisclient = require('./app/cache/redis/redis').init(app);
    app.set('redisclient', redisclient);

});

app.configure('production|development', 'gate', function(){

    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            useProtobuf : true
        });
});

app.configure('production|development', 'connector', function(){
    //<!--设置内部connector组建 心跳时长 通信协议-->
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            heartbeat : 10,
            publishRoute: 'connector.entryHandler.publish',
            subscribeRoute: 'connector.entryHandler.subscribe'
        });
});

app.configure('production|development', 'world', function() {

    app.filter(pomelo.filters.serial(6000));
});

app.configure('production|development', 'classic', function() {

    app.set('gameClassicManager', new gameClassicManager(app));

});
app.configure('production|development', 'unshuffle', function() {

    app.set('gameUnshuffleManager', new gameUnshuffleManager(app));

});

// start app
app.start();

process.on('uncaughtException', function (err) {
    console.error(' Caught exception:%s ,stack:%s ',JSON.stringify(err), err.stack);
});