/**
 * Created by liuxiahui on 2017/11/1.
 */

var dispatcher = require('../util/dispatcher');
var utils = require('../util/utils');

var areaService = function(app) {
    this.app = app;
    this.uidMap = {};
    this.channelMap = {};
};

module.exports = areaService;

/**
 * Add player into the channel
 *
 * @param {String} uid         user id
 * @param {String} playerName  player's role name
 * @param {String} channelName channel name
 * @return
 */
areaService.prototype.add = function(uid, channelName) {

    var sid = getSidByUid(uid, this.app);

    if(!sid) {
        return {code:1, msg:'无连接服务器!'};
    }

    if(checkDuplicate(this, uid, channelName)) {
        return {code:1, msg:'玩家已存在!'};
    }

    var channel = this.app.get('channelService').getChannel(channelName, true);
    if(!channel) {
        return {code:1, msg:'无该服务器!'};
    }

    channel.add(uid, sid);
    addRecord(this, uid, sid, channelName);

    return {code:0};
};

areaService.prototype.getChannelMembers = function(channelName) {

    var channel = this.app.get('channelService').getChannel(channelName, true);
    if(!channel) {
        return [];
    }

    return channel.getMembers();
};

/**
 * User leaves the channel
 *
 * @param  {String} uid         user id
 * @param  {String} channelName channel name
 */
areaService.prototype.leave = function(uid, channelName) {
    var record = this.uidMap[uid];
    var channel = this.app.get('channelService').getChannel(channelName, true);
    if(channel && record) {
        channel.leave(uid, record.sid);
    }

    removeRecord(this, uid, channelName);
};

/**
 * Kick user from area service.
 * This operation would remove the user from all channels and
 * clear all the records of the user.
 *
 * @param  {String} uid user id
 */
areaService.prototype.kick = function(uid) {
    var channelNames = this.channelMap[uid];
    var record = this.uidMap[uid];

    if(channelNames && record) {
        // remove user from channels
        var channel;
        for(var name in channelNames) {
            channel = this.app.get('channelService').getChannel(name);

            if(channel) {
                channel.leave(uid, record.sid);
                if (!channel.userAmount){
                    channel.destroy();
                }
            }
        }
    }

    clearRecords(this, uid);
};

/**
 * Push message by the specified channel
 *
 * @param  {String}   channelName channel name
 * @param  {Object}   msg         message json object
 * @param  {Function} cb          callback function
 */
areaService.prototype.pushByChannel = function(channelName, msg, cb) {
    var channel = this.app.get('channelService').getChannel(channelName);
    if(!channel) {
        if (cb){
            cb(1,null);
        }
        return;
    }

    channel.pushMessage(msg.route, msg, function(err){
        if (err){
            cb(1);
        }else {
            cb(null);
        }
    });
};

/**
 * Push message by the specified channel
 *
 * @param  {String}   channelName channel name
 * @param  {Object}   msg         message json object
 * @param  {Function} cb          callback function
 */
areaService.prototype.pushByChannelWithoutSelf = function(uid, channelName, msg, cb) {

    var self = this;

    var channel = self.app.get('channelService').getChannel(channelName);
    if(!channel) {
        if(cb){
            cb(1);
        }
        return;
    }

    var channelMember = channel.getMembers();

    if(channelMember.length <= 1) {
        if(cb){

            cb(1);
        }
        return;
    }

    var uidArray = [];

    channelMember.forEach(function(item) {
        if(parseInt(item) != parseInt(uid)) {
            var record = self.uidMap[parseInt(item)];

            if(!record) {
                return;
            }

            if (!self.getUserConnectorId(parseInt(item)) || self.getUserConnectorId(parseInt(item)) != record.sid){
                return
            }

            uidArray.push({uid: record.uid, sid: record.sid});
        }
    });

    this.app.get('channelService').pushMessageByUids(msg.route, msg, uidArray, function(err, res){

        if (err){
            cb(1);
        }else {
            cb(null);
        }
    });
};

/**
 * Push message to the specified player
 *
 * @param  {String}   uid
 * @param  {Object}   msg        message json object
 * @param  {Function} cb         callback
 */
areaService.prototype.pushByPlayerUid = function(uid, msg, cb) {

    var record = this.uidMap[uid];

    if(!record) {
        if (cb){

            cb(1);
        }
        return;
    }

    if (!this.getUserConnectorId(uid) || this.getUserConnectorId(uid) != record.sid){
        if (cb){

            cb(1);
        }
        return
    }

    this.app.get('channelService').pushMessageByUids(msg.route, msg, [{uid: record.uid, sid: record.sid}], function(err, res){

        if (err){
            cb(1);
        }else {
            cb(null);
        }
    });
};

areaService.prototype.getUserConnectorId = function(uid) {

    return getSidByUid(uid, this.app);
};

/**
 * Cehck whether the user has already in the channel
 */
var checkDuplicate = function(service, uid, channelName) {
    return !!service.channelMap[uid] && !!service.channelMap[uid][channelName];
};

/**
 * Add records for the specified user
 */
var addRecord = function(service, uid, sid, channelName) {
    var record = {uid: uid, sid: sid};
    service.uidMap[uid] = record;
    var item = service.channelMap[uid];
    if(!item) {
        item = service.channelMap[uid] = {};
    }
    item[channelName] = 1;
};

/**
 * Remove records for the specified user and channel pair
 */
var removeRecord = function(service, uid, channelName) {
    delete service.channelMap[uid][channelName];
    if(utils.size(service.channelMap[uid])) {
        return;
    }

    // if user not in any channel then clear his records
    clearRecords(service, uid);
};

/**
 * Clear all records of the user
 */
var clearRecords = function(service, uid) {
    delete service.channelMap[uid];

    var record = service.uidMap[uid];
    if(!record) {
        return;
    }

    delete service.uidMap[uid];
};

/**
 * Get the connector server id assosiated with the uid
 */
var getSidByUid = function(uid, app) {
    var connector = dispatcher.dispatch(uid.toString(), app.getServersByType('connector'));
    if(connector) {
        return connector.id;
    }
    return null;
};