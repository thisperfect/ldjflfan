-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- Host: 127.0.0.1    Database: doudizhu
-- ------------------------------------------------------
-- Server version	5.7.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `player`
--

DROP TABLE IF EXISTS `player`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player` (
  `uid` int(11) NOT NULL COMMENT '全局主键',
  `avatar` varchar(45) COLLATE utf8_bin DEFAULT 'pic1' COMMENT '头像',
  `nickname` varchar(45) COLLATE utf8_bin DEFAULT NULL COMMENT '昵称',
  `role` tinyint(2) NOT NULL DEFAULT '0' COMMENT '角色:0,普通,1封禁,10管理员',
  `referee` int(2) DEFAULT NULL COMMENT '推荐人uid',
  `coin` bigint(15) NOT NULL DEFAULT '8000' COMMENT '金币',
  `jewel` int(11) NOT NULL DEFAULT '66' COMMENT '钻石',
  `packet` int(11) DEFAULT '0' COMMENT '红包,可直接兑换成钱',
  `charm` int(11) DEFAULT '0' COMMENT '魅力值',
  `level` tinyint(2) DEFAULT '1' COMMENT '等级',
  `experience` int(8) DEFAULT '0' COMMENT '经验值',
  `vipLevel` tinyint(2) DEFAULT '0' COMMENT 'vip等级',
  `vipExperience` int(8) DEFAULT '0' COMMENT 'vip经验值',
  `lastLoginTime` datetime DEFAULT NULL COMMENT '最近登录时间',
  `ipAddress` varchar(30) COLLATE utf8_bin DEFAULT NULL COMMENT '登录ip',
  `status` tinyint(2) DEFAULT '0' COMMENT '玩家状态, 0:离线, 1:大厅',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player`
--

LOCK TABLES `player` WRITE;
/*!40000 ALTER TABLE `player` DISABLE KEYS */;
INSERT INTO `player` VALUES (10200,'pic1','0号',0,NULL,13700,66,0,0,1,0,0,0,'2017-12-20 14:47:48','::ffff:127.0.0.1',2),(10201,'pic1','1号',0,10200,5950,66,0,0,1,0,0,0,'2017-12-20 14:47:37','::ffff:127.0.0.1',2),(10202,'pic1','2号',0,10201,5650,66,0,0,1,0,0,0,'2017-12-20 14:47:27','::ffff:127.0.0.1',2),(10203,'pic1','3号',0,NULL,47870,66,0,0,1,0,0,0,'2017-12-19 16:32:15','::ffff:192.168.0.121',1),(10204,'pic1','4号',0,NULL,24594,66,0,0,1,0,0,0,'2017-12-19 16:23:32','::ffff:192.168.0.121',2),(10205,'pic1','5号',0,NULL,14448,66,0,0,1,0,0,0,'2017-12-19 16:23:38','::ffff:192.168.0.121',2),(10206,'pic1','6号',0,NULL,1000,66,0,0,1,0,0,0,NULL,NULL,0);
/*!40000 ALTER TABLE `player` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-05-28 15:48:00
