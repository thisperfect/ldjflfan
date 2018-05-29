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
-- Table structure for table `player_action`
--

DROP TABLE IF EXISTS `player_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player_action` (
  `id` bigint(15) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL COMMENT '全局唯一主键',
  `coin` bigint(15) DEFAULT NULL COMMENT '记录金币,正数可能是记录或加,负数表示扣去',
  `jewel` int(11) DEFAULT NULL COMMENT '记录钻石,正数可能是记录或加,负数表示扣去',
  `packet` int(11) DEFAULT '0' COMMENT '红包',
  `addTime` datetime NOT NULL COMMENT '记录时间',
  `action` varchar(50) COLLATE utf8_bin NOT NULL COMMENT '玩家行为',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_action`
--

LOCK TABLES `player_action` WRITE;
/*!40000 ALTER TABLE `player_action` DISABLE KEYS */;
INSERT INTO `player_action` VALUES (1,10200,16000,66,0,'2017-12-20 10:20:23','玩家登录'),(2,10200,16000,66,NULL,'2017-12-20 10:24:17','离开经典场1_1513736438272'),(3,10200,16000,66,0,'2017-12-20 10:24:17','玩家退出'),(4,10200,16000,66,0,'2017-12-20 10:24:25','玩家登录'),(5,10200,16000,66,0,'2017-12-20 10:24:39','玩家退出'),(6,10200,16000,66,0,'2017-12-20 10:24:41','玩家登录'),(7,10202,8000,66,0,'2017-12-20 10:25:42','玩家登录'),(8,10201,8000,66,0,'2017-12-20 10:26:05','玩家登录'),(9,10200,16000,66,0,'2017-12-20 10:26:14','玩家登录'),(10,10201,7760,66,NULL,'2017-12-20 10:26:19','进入经典场1_1513736757514'),(11,10202,7760,66,NULL,'2017-12-20 10:26:19','进入经典场1_1513736757514'),(12,10200,15760,66,NULL,'2017-12-20 10:26:19','进入经典场1_1513736757514'),(13,10200,15760,66,0,'2017-12-20 10:26:34','玩家退出'),(14,10200,15810,66,NULL,'2017-12-20 10:29:08','离开经典场1_1513736757514'),(15,10202,7660,66,NULL,'2017-12-20 10:58:10','离开经典场1_1513736757514'),(16,10202,7860,66,0,'2017-12-20 11:11:07','玩家登录'),(17,10201,7810,66,0,'2017-12-20 11:11:21','玩家登录'),(18,10200,15810,66,0,'2017-12-20 11:11:41','玩家登录'),(19,10201,7570,66,NULL,'2017-12-20 11:11:45','进入经典场1_10202_1513739471245'),(20,10200,15570,66,NULL,'2017-12-20 11:11:45','进入经典场1_10202_1513739471245'),(21,10202,7620,66,NULL,'2017-12-20 11:11:45','进入经典场1_10202_1513739471245'),(22,10200,15570,66,0,'2017-12-20 11:12:01','玩家退出'),(23,10200,15520,66,NULL,'2017-12-20 11:14:20','离开经典场1_10202_1513739471245'),(24,10202,7595,66,NULL,'2017-12-20 11:16:35','离开经典场1_10202_1513739471245'),(25,10200,15620,66,0,'2017-12-20 11:23:42','玩家登录'),(26,10201,7545,66,0,'2017-12-20 11:24:01','玩家登录'),(27,10202,7595,66,0,'2017-12-20 11:24:16','玩家登录'),(28,10200,15380,66,NULL,'2017-12-20 11:24:24','进入经典场1_10200_1513740228125'),(29,10201,7305,66,NULL,'2017-12-20 11:24:24','进入经典场1_10200_1513740228125'),(30,10202,7355,66,NULL,'2017-12-20 11:24:24','进入经典场1_10200_1513740228125'),(31,10200,15380,66,0,'2017-12-20 11:24:45','玩家退出'),(32,10200,15280,66,NULL,'2017-12-20 11:26:51','离开经典场1_10200_1513740228125'),(33,10200,15480,66,0,'2017-12-20 11:31:10','玩家登录'),(34,10201,7255,66,0,'2017-12-20 11:31:21','玩家登录'),(35,10202,7305,66,0,'2017-12-20 11:31:31','玩家登录'),(36,10200,15240,66,NULL,'2017-12-20 11:31:35','进入经典场1_102001513740674558'),(37,10201,7015,66,NULL,'2017-12-20 11:31:35','进入经典场1_102001513740674558'),(38,10202,7065,66,NULL,'2017-12-20 11:31:35','进入经典场1_102001513740674558'),(39,10201,7015,66,0,'2017-12-20 11:32:34','玩家退出'),(40,10201,6965,66,NULL,'2017-12-20 11:34:17','离开经典场1_102001513740674558'),(41,10200,15215,66,NULL,'2017-12-20 11:35:14','离开经典场1_102001513740674558'),(42,10200,15215,66,0,'2017-12-20 11:56:30','玩家登录'),(43,10201,7065,66,0,'2017-12-20 11:56:51','玩家登录'),(44,10202,7040,66,0,'2017-12-20 11:57:06','玩家登录'),(45,10200,14975,66,NULL,'2017-12-20 11:57:13','进入经典场1_102001513742195411'),(46,10201,6825,66,NULL,'2017-12-20 11:57:13','进入经典场1_102001513742195411'),(47,10202,6800,66,NULL,'2017-12-20 11:57:13','进入经典场1_102001513742195411'),(48,10201,6825,66,0,'2017-12-20 11:58:24','玩家退出'),(49,10201,6850,66,NULL,'2017-12-20 11:59:53','离开经典场1_102001513742195411'),(50,10200,15000,66,0,'2017-12-20 13:56:26','玩家登录'),(51,10201,6850,66,0,'2017-12-20 13:56:39','玩家登录'),(52,10202,6850,66,0,'2017-12-20 13:56:59','玩家登录'),(53,10200,14760,66,NULL,'2017-12-20 13:57:04','进入经典场1_102001513749391010'),(54,10201,6610,66,NULL,'2017-12-20 13:57:04','进入经典场1_102001513749391010'),(55,10202,6610,66,NULL,'2017-12-20 13:57:04','进入经典场1_102001513749391010'),(56,10202,6610,66,0,'2017-12-20 13:57:19','玩家退出'),(57,10202,6510,66,NULL,'2017-12-20 13:59:31','离开经典场1_102001513749391010'),(58,10200,14660,66,NULL,'2017-12-20 13:59:50','离开经典场1_102001513749391010'),(59,10200,14660,66,0,'2017-12-20 14:11:59','玩家登录'),(60,10201,6810,66,0,'2017-12-20 14:12:10','玩家登录'),(61,10202,6510,66,0,'2017-12-20 14:12:28','玩家登录'),(62,10200,14420,66,NULL,'2017-12-20 14:12:34','进入经典场1_102001513750322731'),(63,10201,6570,66,NULL,'2017-12-20 14:12:34','进入经典场1_102001513750322731'),(64,10202,6270,66,NULL,'2017-12-20 14:12:34','进入经典场1_102001513750322731'),(65,10202,6270,66,0,'2017-12-20 14:13:01','玩家退出'),(66,10202,6320,66,NULL,'2017-12-20 14:15:23','离开经典场1_102001513750322731'),(67,10202,6320,66,0,'2017-12-20 14:19:05','玩家登录'),(68,10201,6620,66,0,'2017-12-20 14:19:15','玩家登录'),(69,10200,14520,66,0,'2017-12-20 14:19:40','玩家登录'),(70,10200,14280,66,NULL,'2017-12-20 14:19:44','进入经典场1_102021513750748328'),(71,10201,6380,66,NULL,'2017-12-20 14:19:44','进入经典场1_102021513750748328'),(72,10202,6080,66,NULL,'2017-12-20 14:19:44','进入经典场1_102021513750748328'),(73,10200,14280,66,0,'2017-12-20 14:20:28','玩家退出'),(74,10200,14255,66,NULL,'2017-12-20 14:22:25','离开经典场1_102021513750748328'),(75,10202,6055,66,NULL,'2017-12-20 14:28:17','离开经典场1_102021513750748328'),(76,10201,6430,66,0,'2017-12-20 14:39:47','玩家登录'),(77,10200,14255,66,0,'2017-12-20 14:39:59','玩家登录'),(78,10202,6055,66,0,'2017-12-20 14:40:14','玩家登录'),(79,10200,14015,66,NULL,'2017-12-20 14:40:22','进入经典场1_102011513751991788'),(80,10201,6190,66,NULL,'2017-12-20 14:40:22','进入经典场1_102011513751991788'),(81,10202,5815,66,NULL,'2017-12-20 14:40:22','进入经典场1_102011513751991788'),(82,10202,5790,66,NULL,'2017-12-20 14:42:18','离开经典场1_102011513751991788'),(83,10200,13990,66,NULL,'2017-12-20 14:43:23','离开经典场1_102011513751991788'),(84,10201,6140,66,NULL,'2017-12-20 14:43:44','离开经典场1_102011513751991788'),(85,10202,5790,66,0,'2017-12-20 14:47:27','玩家登录'),(86,10201,6240,66,0,'2017-12-20 14:47:37','玩家登录'),(87,10200,13990,66,0,'2017-12-20 14:47:48','玩家登录'),(88,10201,6000,66,NULL,'2017-12-20 14:47:52','进入经典场1_102021513752451119'),(89,10200,13750,66,NULL,'2017-12-20 14:47:52','进入经典场1_102021513752451119'),(90,10202,5550,66,NULL,'2017-12-20 14:47:52','进入经典场1_102021513752451119'),(91,10201,6000,66,0,'2017-12-20 14:49:39','玩家退出'),(92,10201,5950,66,NULL,'2017-12-20 14:49:41','离开经典场1_102021513752451119'),(93,10202,5450,66,NULL,'2017-12-20 14:50:08','离开经典场1_102021513752451119'),(94,10200,13700,66,NULL,'2017-12-20 14:50:17','离开经典场1_102021513752451119'),(95,10200,13700,66,NULL,'2017-12-20 14:59:30','离开经典场1_102021513752608828'),(96,10200,13700,66,0,'2017-12-20 14:59:30','玩家退出'),(97,10202,5650,66,NULL,'2017-12-20 15:00:24','离开经典场1_102021513752608828'),(98,10202,5650,66,0,'2017-12-20 15:00:24','玩家退出');
/*!40000 ALTER TABLE `player_action` ENABLE KEYS */;
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
