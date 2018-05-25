var ChannelUtil = module.exports;

var GLOBAL_CHANNEL_NAME = 'DouDiZhu_';
var World = 'World';                      //世界大厅
var ClassicYard = 'ClassicYard_';         //经典,普通场
var UnshuffleYard = 'UnshuffleYard_';     //不洗牌,普通场
var LaiziYard = 'LaiziYard_';             //癞子场
var RedPacket = 'RedPacket_';             //红包场
var ArenaYard = 'ArenaYard_';             //竞技场,比赛场

ChannelUtil.getWorldChannelName = function() {
  return GLOBAL_CHANNEL_NAME + World;
};

ChannelUtil.getClassicYardChannelName = function(roomId) {
  return GLOBAL_CHANNEL_NAME + ClassicYard + roomId;
}

ChannelUtil.getUnshuffleYardChannelName = function(roomId) {
  return GLOBAL_CHANNEL_NAME + UnshuffleYard + roomId;
};

ChannelUtil.getLaiziYardChannelName = function(roomId) {
  return GLOBAL_CHANNEL_NAME + LaiziYard + roomId;
};

ChannelUtil.getRedPacketChannelName = function(roomId) {
  return GLOBAL_CHANNEL_NAME + RedPacket + roomId;
};

ChannelUtil.getArenaYardChannelName = function(roomId) {
  return GLOBAL_CHANNEL_NAME + ArenaYard + roomId;
};
