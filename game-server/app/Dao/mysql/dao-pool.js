/**
 * Created by liuxiahui on 2017/10/30.
 */
//var _poolModule = require('generic-pool');

var mysqlConfig = require('../../../../shared/mysql');
var mysql = require('mysql');

var env = process.env.NODE_ENV || 'development';
if(mysqlConfig[env]) {
    mysqlConfig = mysqlConfig[env];
}

/*
 * Create mysql connection pool.
 */

exports.createMysqlPool= module.exports.createMysqlPool = function(){
    return mysql.createPool({
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        connectionLimit: 20
    });
};