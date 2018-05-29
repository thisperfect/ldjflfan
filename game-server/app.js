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
    // console.log("111-哈哈哈哈哈哈哈哈哈哈哈哈");

    // app.enable('systemMonitor');

    app.loadConfig('mysql', app.getBase() + '/../shared/mysql.json');
    var dbClient = require('./app/dao/mysql/mysql').init(app);
    app.set('dbclient', dbClient);

    app.loadConfig('redis', app.getBase() + '/../shared/redis.json');
    var redisclient = require('./app/cache/redis/redis').init(app);
    app.set('redisclient', redisclient);
    // console.log("222-哈哈哈哈哈哈哈哈哈哈哈哈");

});

app.configure('production|development', 'gate', function(){
    // console.log("gate-哈哈哈哈哈哈哈哈哈哈哈哈");

    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            useProtobuf : true,
        });
});

app.configure('production|development', 'connector', function(){
    // console.log("connector-哈哈哈哈哈哈哈哈哈哈哈哈");
    
    //<!--设置内部connector组建 心跳时长 通信协议-->
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            heartbeat : 10,
            publishRoute: 'connector.entryHandler.publish',
            subscribeRoute: 'connector.entryHandler.subscribe',
            useProtobuf: true //enable useProtobuf 我加的
        });
});

app.configure('production|development', 'world', function() {
    // console.log("world-哈哈哈哈哈哈哈哈哈哈哈哈");

    app.filter(pomelo.filters.serial(6000));
});

app.configure('production|development', 'classic', function() {
    // console.log("classic-哈哈哈哈哈哈哈哈哈哈哈哈");

    app.set('gameClassicManager', new gameClassicManager(app));

});
app.configure('production|development', 'unshuffle', function() {
    // console.log("unshuffle-哈哈哈哈哈哈哈哈哈哈哈哈");

    app.set('gameUnshuffleManager', new gameUnshuffleManager(app));

});

// start app
app.start();
process.on('uncaughtException', function (err) {
    console.error(' Caught exception:%s ,stack:%s ',JSON.stringify(err), err.stack);
});