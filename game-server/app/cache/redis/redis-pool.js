/**
 * Created by liuxiahui on 2017/10/30.
 */
var _poolModule = require('generic-pool');

/*
 * Create mysql connection pool.
 */
var createRedisPool = function(app) {
    var redisConfig = app.get('redis');
    return _poolModule.Pool({
        name: 'redis',
        create: function(callback) {
            var redis = require("redis");
            var client = redis.createClient(redisConfig.port, redisConfig.host, {});
            callback(null, client);
        },
        destroy: function(client) {
            client.end(true);
        },
        max: 10,
        idleTimeoutMillis : 30000,
        log : false
    });
};

exports.createRedisPool = createRedisPool;


