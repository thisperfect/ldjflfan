var mysqlConfig = require('../../../shared/mysql');
var mysql = require('mysql');

var env = process.env.NODE_ENV || 'development';
if(mysqlConfig[env]) {
  mysqlConfig = mysqlConfig[env];
}

/*
 * Create mysql connection pool.建立连接池
 */

exports.createMysqlPool= module.exports.createMysqlPool = function(){
  return mysql.createPool({
    host: mysqlConfig.host,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database
  });
};

//console.log(pool);



/*

var client;
var createMysqlPool = function(){
  return _poolModule.Pool({
    name     : 'mysql',
    create   : function(callback) {

      client = handleDisConnection(client);
      console.log('1---cs',client.state);
      client.on('error', function(err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST'){
         client = handleDisConnection(client);
        }
        console.log('2--Lost conn',client.state);
      });
      console.log('3--Lost conn, client.state:',client.state);
      callback(null, client);
    },
    destroy  : function(client) { client.end(); },
    max      : 8,
    idleTimeoutMillis : 30000,
    log : false
  });
};

function handleDisConnection(client){
  if (client != undefined){
    console.log('4--cs',client.state);
  }
 return client = mysql.createConnection({
    host: mysqlConfig.host,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database
  });
}
*/

//exports.createMysqlPool = createMysqlPool;
