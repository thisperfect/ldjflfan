/**
 * Created by liuxiahui on 2017/11/1.
 */

const channelUtil = require('../../../util/channelUtil');
const areaService = require('../../../services/areaService');
const utils = require('../../../../../shared/utils');

module.exports = function (app) {
    return new worldRemote(app);
};

class worldRemote {
    constructor(app) {
        this.app = app;
        this.areaService = new areaService(app);
        this.add=this.add.bind(this);
        this.kick=this.kick.bind(this);
        this.getChannelMembers=this.getChannelMembers.bind(this);
        this.sendWorldMsg=this.sendWorldMsg.bind(this);
        this.sendSingleMsg=this.sendSingleMsg.bind(this);
        
    }
    /**
     * add to world channel
     * @param uid
     * @param cb
     */
    async add(uid, cb) {
        let self = this;
        cb(self.areaService.add(uid, channelUtil.getWorldChannelName()));

    }
    /**
     * kick from all channel
     * @param uid
     * @param cb
     */
    async kick(uid, cb) {
        let self = this;
        self.areaService.kick(uid);
        utils.invokeCallback(cb)
    }
    /**
     * @param cb
     */
    async getChannelMembers(cb) {
        let self = this;
        let data = self.areaService.getChannelMembers(channelUtil.getWorldChannelName())
        cb(data)
    }
    /**
     * 世界频道消息
     * @param param     消息参数,route:路径 ,data:消息内容
     * @param cb
     */
    async sendWorldMsg(param, cb) {
        let self = this;
        if (!utils.size(param)) {
            return { code: 1, msg: '参数为空' }
        }
        self.areaService.pushByChannel(channelUtil.getWorldChannelName(), param, (err) => {
            if (err) {
                return cb({ code: 1, msg: '发送失败' });
            } else {
                return cb({ code: 0 });
            }
        });
    }
    /**
    * 发送点对点单人消息
    * @param target    接受对象
    * @param param     消息参数,route:路径 ,data:消息内容
    * @param cb
    */
    async sendSingleMsg(target, param, cb) {
        let sefl = this;
        if (!target || !utils.size(param)) {
            return cb({ code: 1, msg: "参数缺失" })
        }
        self.areaService.pushByPlayerUid(target, param, (err) => {
            if (err) {
                return cb({ code: 1, msg: '发送失败' });
            } else {
                return cb({ code: 0 });
            }
        });
    }
}










// /**
//  * 以前的 
//  */
// /**
//  * Created by liuxiahui on 2017/11/1.
//  */

// var channelUtil = require('../../../util/channelUtil');
// var areaService = require('../../../services/areaService');
// var utils = require('../../../../../shared/utils');

// module.exports = function (app) {
//     return new worldRemote(app);
// };

// var worldRemote = function (app) {
//     this.app = app;
//     this.areaService = new areaService(app);
// };

// var wRemote = worldRemote.prototype;

// /**
//  * add to world channel
//  * @param uid
//  * @param cb
//  */
// wRemote.add = function (uid, cb) {

//     var self = this;
//     cb(self.areaService.add(uid, channelUtil.getWorldChannelName()));

// };

// /**
//  * kick from all channel
//  * @param uid
//  * @param cb
//  */
// wRemote.kick = function (uid, cb) {

//     var self = this;
//     self.areaService.kick(uid);

//     utils.invokeCallback(cb);
// };

// /**
//  * @param cb
//  */
// wRemote.getChannelMembers = function (cb) {
//     var self = this;
//     var data = self.areaService.getChannelMembers(channelUtil.getWorldChannelName());
//     cb(data);
// };

// /**
//  * 世界频道消息
//  * @param param     消息参数,route:路径 ,data:消息内容
//  * @param cb
//  */
// wRemote.sendWorldMsg = function (param, cb) {

//     var self = this;
//     if (!utils.size(param)) {
//         return { code: 1, msg: '参数为空' };
//     }

//     self.areaService.pushByChannel(channelUtil.getWorldChannelName(), param, function (err) {
//         if (err) {
//             return cb({ code: 1, msg: '发送失败' });
//         } else {
//             return cb({ code: 0 });
//         }
//     });
// };

// /**
//  * 发送点对点单人消息
//  * @param target    接受对象
//  * @param param     消息参数,route:路径 ,data:消息内容
//  * @param cb
//  */

// wRemote.sendSingleMsg = function (target, param, cb) {

//     var self = this;

//     if (!target || !utils.size(param)) {
//         return cb({ code: 1, msg: '参数缺失' });
//     }

//     self.areaService.pushByPlayerUid(target, param, function (err) {
//         if (err) {
//             return cb({ code: 1, msg: '发送失败' });
//         } else {
//             return cb({ code: 0 });
//         }
//     });
// };