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
-- Table structure for table `player_bag`
--

DROP TABLE IF EXISTS `player_bag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player_bag` (
  `uid` int(11) NOT NULL COMMENT '全局主键',
  `superCard` int(11) DEFAULT '0' COMMENT '超级加倍卡',
  `cardMarker` tinyint(2) DEFAULT '0' COMMENT '记牌器',
  `flower` int(11) DEFAULT '0' COMMENT '鲜花,50金币,增加10点魅力值',
  `brick` int(11) DEFAULT '0' COMMENT '砖头,特效.20金币',
  `bomb` int(11) DEFAULT '0' COMMENT '炸弹,特效.20金币',
  `markerTime` datetime DEFAULT NULL COMMENT '记牌器截止时间',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_bag`
--

LOCK TABLES `player_bag` WRITE;
/*!40000 ALTER TABLE `player_bag` DISABLE KEYS */;
INSERT INTO `player_bag` VALUES (10200,100,1,160,100,100,'2018-10-26 00:00:00'),(10201,100,1,100,100,100,'2018-10-26 00:00:00'),(10202,100,1,100,100,100,'2018-10-26 00:00:00'),(10203,100,1,100,100,100,'2018-10-26 00:00:00'),(10204,100,1,100,100,100,'2018-10-26 00:00:00'),(10205,100,1,100,100,100,'2018-10-26 00:00:00'),(10206,100,1,100,100,100,'2018-10-26 00:00:00');
/*!40000 ALTER TABLE `player_bag` ENABLE KEYS */;
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
