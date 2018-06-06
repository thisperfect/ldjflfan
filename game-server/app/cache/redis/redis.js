/**
 * Created by Administrator on 2017/10/31 0031.
 */
// mysql CRUD
var redisclient = module.exports;

var _pool;

var NND = {};

/*
 * Innit sql connection pool
 * @param {Object} app The app for the server.
 */
NND.init = function(app){

    _pool = require('./redis-pool').createRedisPool(app);
};


NND.set = function(key, args, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[set] '+err.stack);
            return;
        }

        client.set(key, args, function(err, res){
            _pool.release(client);
            cb(err, res);

        });

    })

};

NND.incrby = function(key, inc, cb) {

    _pool.acquire(function(err, client){
        if (!!err) {
            console.error('[incrby] '+err.stack);
            return;
        }

        client.incrby(key, inc, function(err, res){
            _pool.release(client);
            cb(err, res);
        });
    })
};

NND.exists = function(key, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[exists] '+err.stack);
            return;
        }

        client.exists(key, function(err, res){
            _pool.release(client);

            cb(err, res);
        });
    })
};

NND.ttl = function(key, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[ttl] '+err.stack);
            return;
        }

        client.ttl(key, function(err, res){
            _pool.release(client);
            cb(err, res);

        });

    })


};

NND.flushall = function(cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[set] '+err.stack);
            return;
        }

        client.flushall(function(err, res){
            _pool.release(client);
            cb(err, res);

        });

    })

};

NND.get = function(key, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[get] '+err.stack);
            return;
        }

        client.get(key, function(err, res){
            _pool.release(client);
            cb(err, res);
        });
    })
};


NND.rpush = function(args, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[rpush] '+err.stack);
            return;
        }

        client.rpush(args, function(err, res){
            _pool.release(client);
            cb(err, res);

        });

    })

};


NND.lpush = function(args, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[rpush] '+err.stack);
            return;
        }

        client.lpush(args, function(err, res){
            _pool.release(client);
            cb(err, res);

        });

    })

};

NND.expire = function(key, value, seconds, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[expire] '+err.stack);
            return;
        }

        client.set(key, value, function(err, res){
            client.expire(key, seconds, function(err, res){
                _pool.release(client);
                if(err) {
                    console.error("Failed to publish EXPIRE:::: "+err);
                }
                cb(err, res);
            });
        });

    })

};

NND.expOnly = function(key, seconds, cb) {

    _pool.acquire(function(err, client){

        if (!!err) {
            console.error('[expire] '+err.stack);
            return;
        }

        client.expire(key, seconds, function(err, res){
            _pool.release(client);
            if(err) {
                console.error("Failed to publish EXPIRE:::: "+err);
            }
            cb(err, res);
        });
    })
};

NND.sadd = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[sadd] '+err.stack);
            return;
        }
        client.sadd(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.scard = function(key, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[scard] '+err.stack);
            return;
        }
        client.scard(key, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.smembers = function(key, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[smembers] '+err.stack);
            return;
        }
        client.smembers(key, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.sismember = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[sismember] '+err.stack);
            return;
        }

        client.sismember(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.srandmember = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[srandmember] '+err.stack);
            return;
        }

        client.srandmember(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};


NND.srem = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[srem] '+err.stack);
            return;
        }

        client.srem(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.llen = function(key, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[llen] '+err.stack);
            return;
        }

        client.llen(key, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};


NND.lindex =  function(key, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[lindex] '+err.stack);
            return;
        }

        client.lindex(key, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.zscan = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zscan] '+err.stack);
            return;
        }
        client.zscan(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.zadd = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zadderr] '+err.stack);
            return;
        }
        client.zadd(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });
};


NND.zincrby = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zincrby] '+err.stack);
            return;
        }
        client.zincrby(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};

NND.zrem = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zrem] '+err.stack);
            return;
        }
        client.zrem(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });


}

NND.zcard = function(key, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zrem] '+err.stack);
            return;
        }
        client.zcard(key, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });


};

NND.zscore = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zscore] '+err.stack);
            return;
        }
        client.zscore(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};


NND.zrange = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zrange] '+err.stack);
            return;
        }
        client.zrange(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });

    });

};


NND.lpop = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[lpop] '+err.stack);
            return;
        }
        client.lpop(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

}


NND.rpop = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[lpop] '+err.stack);
            return;
        }
        client.rpop(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.lrem = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[lrem] '+err.stack);
            return;
        }
        client.lrem(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.lrange = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[lrange] '+err.stack);
            return;
        }
        client.lrange(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.ltrim = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[lrange] '+err.stack);
            return;
        }
        client.ltrim(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.zrevrangebyscore = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zrevrangebyscore] '+err.stack);
            return;
        }
        client.zrevrangebyscore(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.zremrangebyrank = function(args, cb) {

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[zrevrangebyscore] '+err.stack);
            return;
        }
        client.zremrangebyrank(args, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.del = function(key, cb) {

    _pool.acquire(function(err, client) {
        if (!!err) {
            console.error('[del] '+err.stack);
            return;
        }
        client.del(key, function (err, res) {
            _pool.release(client);
            cb(err, res);
        });
    });

};

NND.hset = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hset] '+err.stack);
            return;
        }
        client.hset(args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hmset = function(key, args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hmset] '+err.stack);
            return;
        }
        client.hmset(key, args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hget = function(key, args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hget] '+err.stack);
            return;
        }
        client.hget(key, args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hmget = function(key, args, cb){

    _pool.acquire(function(err, client) {
        if (!!err) {
            console.error('[hmget] '+err.stack);
            return;
        }
        client.hmget(key, args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hgetall = function(key, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hgetall] '+err.stack);
            return;
        }
        client.hgetall(key, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hincrby = function(key, args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hincrby] '+err.stack);
            return;
        }
        client.hincrby(key, args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hincrbyUint = function(args, cb) {

    _pool.acquire(function(err, client) {
        _pool.release(client);

        if (!!err) {
            console.error('[hincrbyUint] '+err.stack);
            return;
        }
        client.hincrby(args, function (err, res) {
            if (err && parseInt(res) < 0){
                args[2] = 0 - parseInt(res);
                client.hincrby(args, function (error, equation) {
                    //_pool.release(client);
                    console.log("hincrby Uint modify equation num", args[2]);
                    cb(error, equation);
                });
                return;
            }
            cb(err, res);
        });
    });
};

NND.hdel = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hdel] '+err.stack);
            return;
        }
        client.hdel(args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        })
    })
};

NND.hvals = function(args, cb){

    _pool.acquire(function(err, client) {

        if (!!err) {
            console.error('[hvals] '+err.stack);
            return;
        }
        client.hvals(args, function (err, res) {
            _pool.release(client);

            cb(err, res);
        });
    });
};

/**
 * Close connection pool.
 */
NND.shutdown = function(){
    _pool.destroyAllNow();
};

/**
 * init database
 */
redisclient.init = function(app) {
    if (!!_pool){
        return redisclient;
    } else {
        NND.init(app);
        //NND.flushall(function(){});
        redisclient.srandmember = NND.srandmember;
        redisclient.sismember = NND.sismember;
        redisclient.sadd = NND.sadd;
        redisclient.scard = NND.scard;
        redisclient.srem = NND.srem;
        redisclient.smembers = NND.smembers;
        redisclient.zadd = NND.zadd;
        redisclient.zincrby = NND.zincrby;
        redisclient.zscore = NND.zscore;
        redisclient.zcard = NND.zcard;
        redisclient.zrange = NND.zrange;
        redisclient.zremrangebyrank = NND.zremrangebyrank;
        redisclient.zscan = NND.zscan;
        redisclient.get = NND.get;
        redisclient.set = NND.set;
        redisclient.incrby = NND.incrby;
        redisclient.exists = NND.exists;
        redisclient.expire = NND.expire;
        redisclient.expOnly = NND.expOnly;
        redisclient.del = NND.del;
        redisclient.rpush = NND.rpush;
        redisclient.lpush = NND.lpush;
        redisclient.llen = NND.llen;
        redisclient.lindex = NND.lindex;
        redisclient.lrange = NND.lrange;
        redisclient.ltrim = NND.ltrim;
        redisclient.zrem = NND.zrem;
        redisclient.hmget = NND.hmget;
        redisclient.hmset = NND.hmset;
        redisclient.hset = NND.hset;
        redisclient.hget = NND.hget;
        redisclient.hdel = NND.hdel;
        redisclient.hvals = NND.hvals;
        redisclient.hgetall = NND.hgetall;
        redisclient.hincrby = NND.hincrby;
        redisclient.hincrbyUint = NND.hincrbyUint;
        redisclient.ttl = NND.ttl;
        redisclient.lrem = NND.lrem;
        redisclient.lpop = NND.lpop;
        redisclient.rpop = NND.rpop;
        redisclient.zrevrangebyscore = NND.zrevrangebyscore;
        return redisclient;
    }
};


/**
 * shutdown database
 */
redisclient.shutdown = function() {
    NND.shutdown();
};