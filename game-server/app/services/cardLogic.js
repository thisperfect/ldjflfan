//数组中最小值

var cardType = require('./cardType');

if(!Array.prototype.min){
    Array.prototype.min = function(){
        return Math.min.apply({},this)
    };
}

//Array 数组乱序
if (!Array.prototype.shuffle) {
    Array.prototype.shuffle = function() {
        for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
        return this;
    };
}

var Card = function () {
    // 约定：
    // 扑克牌54张，分别包含普通牌52张：A、2-10、J、Q、K （以上每种牌4个花色）小王大王：Swang、Bwang
    // 普通牌4种花色：方块、梅花、红心、黑桃，分别对应花色id 0-3，用于手牌花色排序，小王大王的花色是Swang、Bwang
    // id从0-53，按照每张牌4种花色排序，如：黑桃A、梅花A、红心A、方块A、黑桃2....

    // 获取牌的点数 A, 2-10 ,J Q K , Swang Bwang ,在算地主牌型的时候用到 todo:算点数有问题,牌型A不对,需要处理
    this.getPoint = function (id) {
        id = parseInt(id);
        var point = Math.floor(id / 4);

        if (id >= 0 && id <= 51) {
            if (point = 0) {
                return 'A'
            } else if (point >= 2 && point <= 10) {
                return point.toString();
            } else {
                switch (point) {
                    case 11:
                        return 'J';
                        break;
                    case 12:
                        return 'Q';
                        break;
                    case 13:
                        return 'K';
                        break;
                    default:
                        throw '牌id不合法'
                }
            }
        } else if (id === 52) {
            return 'Swang';
        } else if (id === 53) {
            return 'Bwang';
        } else {
            throw '牌id不合法';
        }
    };
    // 获取牌的花色 0-3
    this.getSuits = function (id) {
        id = parseInt(id);
        var suits = Math.ceil(id % 4);

        if (id >= 0 && id <= 51) {
            return suits.toString();
        } else if (id === 52) {
            return 'Swang';
        } else if (id === 53) {
            return 'Bwang';
        } else {
            throw '牌id不合法';
        }
    };
    // 获取牌权重 1-15
    this.getWeight = function (id) {
        id = parseInt(id);

        if (id >= 0 && id <= 7) {
            return Math.ceil((id + 1) / 4) + 11;
        } else if (id >= 8 && id <= 51) {
            return Math.ceil((id + 1) / 4) - 2;
        } else if (id == 52) {
            return 14;
        } else if (id == 53) {
            return 15;
        } else {
            console.log('73 id:%s 牌不合法',id);
            throw '牌id不合法'
        }
    }
};

var doudizhu = function () {
    // ================  私有  ==================
    var cardsArr = new Array();
    // ================  公有  ==================
    // 获取当前的扑克牌id数组
    this.getCards = function () {
        return cardsArr
    };

    // 单张牌对象
    this.cardInfo = new Card();

    // 洗牌算法，返回乱序的扑克id数组
    this.getShuffleCards = function () {
        var i = 1;
        cardsArr = [];

        cardsArr[0] = 0;
        while (i <= 53) {
            var rnd = Math.floor(Math.random() * (i + 1));
            cardsArr[i] = cardsArr[rnd];
            cardsArr[rnd] = i;
            i++
        }
        return cardsArr
    };

    /**
     * 发牌 返回一个对象记录发牌情况，分别是：3组17张的随机牌、1组3张的地主牌
     * 为使牌更加随机，三人轮流发牌，剩下3张为地主牌
     * @returns {{player0: Array, player1: Array, player2: Array, leaveCards: Array}}
     */
    this.dealCards = function (players) {
        players = players.shuffle();
        console.log('125   ---:',JSON.stringify(players));
        var resJson = {leaveCards:[]};
        var p1 = [],p2 = [],p3 = [];


        cardsArr.forEach(function (card, index) {
            if (index <= 50) {
                switch (index % 3) {
                    case 0:
                        p1.push(card);
                        break;
                    case 1:
                        p2.push(card);
                        break;
                    default:
                        p3.push(card);
                        break;
                }
            } else {
                resJson.leaveCards.push(card)
            }
        });

        resJson[players[0]] = p1;
        resJson[players[1]] = p2;
        resJson[players[2]] = p3;
        console.log('resJson:%s',JSON.stringify(resJson));
        return resJson;
    };

    // 不洗牌玩法发牌
    // 1.首先生成 1-N 炸
    // 2.分配给 3个人
    // 3.然后杂牌一次性补足够
    this.unShuffleCards = function () {

        var cards0 = [];
        var cards1 = [];
        var cards2 = [];
        var leaveCards = [];

        var boomNum = parseInt(Math.random() * 9);       // 0-8副炸弹
        var pickBoom = [1,2,3,4,5,6,7,8,9,10,11,12,13].shuffle();  // 从3,4,5...Q,K,A,2选出来要多少副炸弹
        console.log('ddz boomNum:%s , pickBoom:%s',boomNum,pickBoom);
        if(boomNum){                       //有选到炸弹
            var boomArr = pickBoom.slice(0,boomNum);

            var fireCards = [];

            boomArr.forEach(function (boom) {       //把所有的炸弹找出
                var fs = boomCard(boom);
                //console.log('boom:%s, fs:%s',boom,JSON.stringify(fs));
                fireCards = fireCards.concat(fs);
            });

            fireCards.forEach(function (fcard) {    //要发的牌中把炸弹挑出
                cardsArr.splice(cardsArr.indexOf(fcard),1);
            });
            //console.log('\n ddz boomArr:%s , fireCards:%s ,cardsArr:%s',JSON.stringify(boomArr),JSON.stringify(fireCards),JSON.stringify(cardsArr));
            boomArr.forEach(function (cardWei) {
                switch (cardWei%3){
                    case 0:{
                        if(cards0.length <3){
                            cards0 = cards0.concat(boomCard(cardWei));
                        }else {
                            cardsArr = cardsArr.concat(boomCard(cardWei));
                        }
                        break;
                    }
                    case 1:{
                        if(cards1.length <3){
                            cards1 = cards1.concat(boomCard(cardWei));
                        }else {
                            cardsArr = cardsArr.concat(boomCard(cardWei));
                        }
                        break;
                    }
                    default:{
                        if(cards2.length <3){
                            cards2 = cards2.concat(boomCard(cardWei));
                        }else {
                            cardsArr = cardsArr.concat(boomCard(cardWei));
                        }
                        break;
                    }

                }
            });
        }

        var wangZha = Math.random();

        if( wangZha > 0.7){         //出王炸
            console.log('wanzha');
            cardsArr.splice(cardsArr.indexOf(52),1);
            cardsArr.splice(cardsArr.indexOf(53),1);
            if(wangZha > 0.9){      //王炸留底牌
                console.log('dipai wanzha');
                leaveCards = leaveCards.concat([52,53]).concat(cardsArr.splice(0,1));
                var len0 = 17 - cards0.length;
                var len1 = 17 - cards1.length;
                //var len2 = 17 - cards1.length;
                cards0 = cards0.concat(cardsArr.slice(0,len0));
                cards1 = cards1.concat(cardsArr.slice(len0,len0+len1));
                cards2 = cards2.concat(cardsArr.slice(len0+len1));
            }else {                 //王炸给玩家
                cards0 = cards0.concat([52,53]);
                leaveCards = leaveCards.concat(cardsArr.splice(0,3));
                var len0 = 17 - cards0.length;
                var len1 = 17 - cards1.length;
                //var len2 = 17 - cards1.length;
                cards0 = cards0.concat(cardsArr.slice(0,len0));
                cards1 = cards1.concat(cardsArr.slice(len0,len0+len1));
                cards2 = cards2.concat(cardsArr.slice(len0+len1));
            }

        }else {                     //不给王炸
            leaveCards = leaveCards.concat(cardsArr.splice(0,3));
            var len0 = 17 - cards0.length;
            var len1 = 17 - cards1.length;
            //var len2 = 17 - cards1.length;
            cards0 = cards0.concat(cardsArr.slice(0,len0));
            cards1 = cards1.concat(cardsArr.slice(len0,len0+len1));
            cards2 = cards2.concat(cardsArr.slice(len0+len1));
        }
        var cardShuffle = [cards0,cards1,cards2].shuffle();
        return {
            'player0': cardShuffle[0],
            'player1': cardShuffle[1],
            'player2': cardShuffle[2],
            'leaveCards': leaveCards
        }
    };

    // 出牌类型判断，接收出牌的id数组
    // 返回一个对象，用来表示：
    // 牌类型 c0 : 不能出 / cw : 王炸 /cz : 炸弹 / c1 : 单排 / c2: 对子 / c3 : 三张不带 / c4 : 炸弹 / c33 : 飞机/ c31 : 三带一 / c32 : 三带二 / c123 : 顺子 / c1122 : 连对
    //       c331 : 飞机带单 / c332 : 飞机带对 / c333: 三飞机 / c3331 :三飞机带单 / c3332: 飞机带对子 /c41 : 四带两单牌 / c42 : 四带两对
    //cardType : 牌类型 ; cardTypeWeight:牌类型权重(1:普通牌,2:炸弹,3:王炸); groupCardsWeight:  当前扑克牌组权重（最小权重为 1）;
    this.getCardType = function (arr) {
        if(!arr || !arr.length){
            return null;
        }

        //  牌数组原始长度
        var arrLength = parseInt(arr.length);
        // 出牌数限制
        if (arrLength <= 0 || arrLength >= 17) {
            return false
        }
        // 过滤掉重复id、非正整数id、大于53的id
        var arr1 = arr.filter(function (id, index, self) {
            return (self.indexOf(id) === index && Math.abs(parseInt(id)) === id && index <= 53)
        });
        // 过滤完毕，若数组长度有变，则说明数组不合法
        if (arr1.length !== arrLength) {
            console.log('307 arr:%s 牌不合法 ,arr1.length:%s,arrLength:%s',JSON.stringify(arr),arr1.length,arrLength);
            throw '牌id不合法'
        }

        // 对牌权重数组进行排序
        //arr.sort(function(a,b){return a - b});
        var weiArr = [];        //保存牌权重数组

        arr.forEach(function (card) {
            weiArr.push(getWeight(card));
        });

        weiArr.sort(function (a,b) {return a - b;});

        var cardItem = {};      //{card1:len1,card2:len2 ...}
        weiArr.forEach(function(card){
            if(cardItem[card]){
                cardItem[card]++;
            }else{
                cardItem[card] = 1;
            }
        });
        console.log('weiArr:%s,cardItem:%s,arrLength:%s',JSON.stringify(weiArr),JSON.stringify(cardItem),arrLength);
        switch (arrLength) {       //根据牌数量来区分可能是什么牌型
            case 1:
            {    // c1 (单张或者单王)
                return { // 单条
                    cardType: 'c1',
                    cardTypeWeight: 1,
                    groupCardsWeight: {len: 1, wei: weiArr[0]}
                };
                break;
            }
            case 2:
            {        //c2,cw (对子或王炸)
                if (cardType.isDanC2(weiArr)) {
                    return { // 对子
                        cardType: 'c2',
                        cardTypeWeight: 1,
                        groupCardsWeight: {len: 2, wei: weiArr[0]}
                    }
                } else if (cardType.isWangZha(cardItem)) {
                    return { // 王炸
                        cardType: 'cw',
                        cardTypeWeight: 3,
                        groupCardsWeight: {len: 2, wei: 15}
                    }
                } else {
                    return false;
                }
                break;
            }
            case 3:
            {    //c3 (3张)
                var isC3 = cardType.isJustC3(cardItem);
                if (isC3 && isC3.len == 1) {
                    return { // 三条
                        cardType: 'c3',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC3
                    }
                } else {
                    return false;
                }
                break;
            }

            case 4:
            {    //c31,c4 (3带1,炸弹)

                if (cardType.isC4(cardItem)) {
                    return { // 炸弹
                        cardType: 'c4',
                        cardTypeWeight: 2,
                        groupCardsWeight: {len: 2, wei: weiArr[0]}
                    }
                }

                var isC31 = cardType.isC31(cardItem);
                if (isC31) {
                    return { // 三带1
                        cardType: 'c31',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                } else {
                    return false;
                }
                break;
            }

            case 5:
            {        // c123,c32 (顺子,3带2)

                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC32 = cardType.isC32(cardItem);
                if (isC32) {
                    return { // 三带2
                        cardType: 'c32',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC32
                    }
                }
                return false;
                break;
            }

            case 6:
            {        //c123,c41 (顺子,4带2单牌)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                }

                var isC3 = cardType.isJustC3(cardItem);
                if (isC3 && isC3.len == 2) {
                    return { // 纯三张
                        cardType: 'c3',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC3
                    }
                }


                var isC41 = cardType.isC41(cardItem);
                if (isC41) {
                    return { // 4带2单牌
                        cardType: 'c41',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC41
                    }
                }

                return false;
                break;
            }

            case 7:
            {        //c123  (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                } else {
                    return false;
                }
                break;
            }

            case 8:     //c123,c31,c1122,c42 (顺子,飞机,连队,四带二对子)
            {
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC31 = cardType.isC31(cardItem);
                if(isC31){
                    return { // 顺子
                        cardType: 'c31',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                }

                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                }

                var isC42 = cardType.isC42(cardItem);
                if (isC42) {
                    return { // 4带2对子
                        cardType: 'c42',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC42
                    }
                }

                return false;
                break;
            }

            case 9:
            {        //c123,c42 (顺子,四带二对子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC3 = cardType.isJustC3(cardItem);
                if (isC3 && isC3.len == 3) {
                    return { // 飞机
                        cardType: 'c3',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC3
                    }
                }

                return false;
                break;
            }

            case 10:
            {        //c123 (顺子)
                console.log('10----------1');
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }
                console.log('10----------2');
                var isC32 = cardType.isC32(cardItem);
                if (isC32) {
                    return { // 三带2
                        cardType: 'c32',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC32
                    }
                }
                console.log('10----------3');
                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                } else {
                    return false;
                }


                break;
            }

            case 11:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                } else {
                    return false;
                }
                break;
            }

            case 12:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                }

                var isC31 = cardType.isC31(cardItem);
                if (isC31) {
                    return { // 三带1
                        cardType: 'c31',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                }

                var isC3 = cardType.isJustC3(cardItem);
                if (isC3 && isC3.len == 4) {
                    return { // 飞机
                        cardType: 'c3',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                }
                return false;

                break;
            }

            case 13:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                } else {
                    return false;
                }
                break;
            }

            case 14:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                } else {
                    return false;
                }
                break;
            }

            case 15:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC32 = cardType.isC32(cardItem);
                if (isC32) {
                    return { // 三带1
                        cardType: 'c31',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC32
                    }
                }
                var isC3 = cardType.isJustC3(cardItem);
                if (isC3 && isC3.len == 5) {
                    return { // 飞机
                        cardType: 'c3',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                }
                return false;

                break;
            }

            case 16:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC31 = cardType.isC31(cardItem);
                if (isC31) {
                    return { // 三带1
                        cardType: 'c31',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                }

                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                }

                return false;
                break;
            }

            case 17:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }
                return false;
                break;
            }

            case 18:
            {        //c123 (顺子)
                var isC123 = cardType.isC123(weiArr);
                if (isC123) {
                    return { // 顺子
                        cardType: 'c123',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC123
                    }
                }

                var isC1122 = cardType.isC1122(cardItem);
                if (isC1122) {
                    return { // 连对
                        cardType: 'c1122',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC1122
                    }
                }

                var isC3 = cardType.isJustC3(cardItem);
                if (isC3 && isC3.len == 6) {
                    return { // 飞机
                        cardType: 'c3',
                        cardTypeWeight: 1,
                        groupCardsWeight: isC31
                    }
                }
                return false;
            }

        }
    };

    // 压牌，判断是否能够进行压牌
    // 返回布尔值
    this.beat = function (prevArr, nextArr) {
        var prevArrType = this.getCardType(prevArr);
        var nextArrType = this.getCardType(nextArr);
        console.log('513 preT:%s,nexT:%s',JSON.stringify(prevArrType),JSON.stringify(nextArrType));
        // 保证牌都是合法的
        if (prevArrType && nextArrType) {
            // 如果牌类型权重一致
            if (prevArrType.cardTypeWeight === nextArrType.cardTypeWeight) {
                // 如果牌组合类型、长度一致
                if (prevArr.length === nextArr.length && prevArrType.cardType === nextArrType.cardType) {
                    // 判断牌组合权重
                    return prevArrType.groupCardsWeight.wei < nextArrType.groupCardsWeight.wei
                }
            } else if (prevArrType.cardTypeWeight < nextArrType.cardTypeWeight) { // 如果新牌类型权重更大
                return true;
            }
        }
        return false;
    };

    /**
     * 对地主牌信息进行详解
     * @param cards
     * @returns {} 2倍牌型:Tonghua,Shunzi,Tonghuashun,Sanzhang,Daiwang, 4倍牌型:Wangzha
     */
    this.leaveCardsInfo = function (cards) {
        var cardsInfo = {cards: cards, rate: 1, type: null};
        // this.cardInfo = new Card();
        if (cards.length < 3) {
            return 0;
        } else {

            //1.判断有几张王
            var weights = [];    //牌型权重数组
            var colors = [];    //花色数组
            var Swang = false, Bwang = false;
            cards.forEach(function (card) {
                weights.push(getWeight(card));
                colors.push(getSuits(card));
            });

            weights.forEach(function (point) {
                if (point == '14') {
                    Swang = true;
                }
                if (point == '15') {
                    Bwang = true;
                }
            });
            weights.sort(function (a, b) {
                return a - b
            });
            if (Swang) {  //小王
                if (Bwang) { //王炸
                    cardsInfo.rate = 4;
                    cardsInfo.type = 'Wangzha';
                } else {
                    cardsInfo.rate = 2;
                    cardsInfo.type = 'Swang';
                }

            } else if (Bwang) {    //大王
                cardsInfo.rate = 2;
                cardsInfo.type = 'Bwang';

            } else {        //不带王
                //2.判断是否三张
                if (weights[0] == weights[1] && weights[1] == weights[2]) {
                    cardsInfo.rate = 3;
                    cardsInfo.type = 'Sanzhang';
                } else {
                    //3.判断是否同花
                    if (colors[0] == colors [1] && colors[1] == colors[2]) {
                        //3.1判断是否同花顺
                        if(JSON.stringify(weights) == JSON.stringify([1,12,13]) || ((weights[0] + 1 == weights[1] && weights[1] + 1 == weights[2]) && JSON.stringify(weights) != JSON.stringify([11,12,13]))){
                            cardsInfo.rate = 3;
                            cardsInfo.type = 'Tonghuashun';
                        } else {
                            cardsInfo.rate = 2;
                            cardsInfo.type = 'Tonghua';
                        }
                    } else {//4.判断是否顺子

                        // a+1 = b && b+1 = c; 除去k,A,2 [11,12,13] 包括 A,2 3[1,12,13]
                        if(JSON.stringify(weights) == JSON.stringify([1,12,13]) || ((weights[0] + 1 == weights[1] && weights[1] + 1 == weights[2]) && JSON.stringify(weights) != JSON.stringify([11,12,13]))){
                            cardsInfo.rate = 2;
                            cardsInfo.type = 'Shunzi';
                        }
                    }
                }
            }
        }
        return cardsInfo;
    };

    //选牌,可以压过之前的牌
    this.selCard = function (comCard, cards) {
        console.log('selcard 854 comCard:%s,cards:%s',JSON.stringify(comCard),JSON.stringify(cards));
        var outCard = [];         //可以出的牌
        var cardWeis = [];        //所有牌的权重数组,顺序和牌数组一样

        cards.forEach(function (card) {
            cardWeis.push(getWeight(card));
        });

        var cardWeiArr = [].concat(cardWeis);   //作为参数拿去排序的

        if (comCard && comCard.length) {     //有需互相比较的牌
            var comLen = comCard.length;
            var comInfo = this.getCardType([].concat(comCard));
            //console.log('611 comCard:%s,comInfo:%s,cards:%s',JSON.stringify(comCard),JSON.stringify(comInfo),JSON.stringify(cards));
            if (comInfo && size(comInfo)) {             //牌是合法的
                switch (comInfo.cardType) {
                    case 'cw': {     //王炸 2
                        return outCard;
                        break;
                    }
                    case 'c4': {     //炸弹 4
                        var weiValue = repeatCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        cardWeis.forEach(function (cardWei, index) {
                            if (cardWei == weiValue) {
                                outCard.push(cards[index]);
                            }
                        });
                        if (outCard.length > comLen) outCard = outCard.slice(0, comLen);

                        return outCard;
                        break;
                    }
                    case 'c1': {     //单牌 1
                        var weiValue = repeatCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        //console.log('631 c1 type weiValue:%s',JSON.stringify(weiValue));
                        cardWeis.forEach(function (cardWei, index) {
                            if (cardWei == weiValue) {
                                outCard.push(cards[index]);
                            }
                        });
                        if (outCard.length > comLen) outCard = outCard.slice(0, comLen);
                        break;
                    }
                    case 'c2': {     //对子 2
                        var weiValue = repeatCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        //console.log('642 c2 type weiValue:%s',JSON.stringify(weiValue));
                        cardWeis.forEach(function (cardWei, index) {
                            if (cardWei == weiValue) {
                                outCard.push(cards[index]);
                            }
                        });

                        if (outCard.length > comLen) outCard = outCard.slice(0, comLen);
                        break;
                    }
                    case 'c3': {     //三张 3
                        var weiArr = threeCard(cardWeiArr, comInfo.groupCardsWeight, comLen, comInfo.cardType);  //返回数组
                        if (weiArr && weiArr.length*3 == comLen) {


                            weiArr.forEach(function (wei) {
                                outCard.push(cardWeis.indexOf(wei));
                            });

                            if (outCard.length != comLen) outCard = [];

                        }

                        break;
                    }
                    case 'c31': {    //三带单 4
                        var weiJson = threeCard(cardWeiArr, comInfo.groupCardsWeight, comLen, comInfo.cardType);
                        if (weiJson.cm && weiJson.cf) {
                            cardWeis.forEach(function (cardWei, index) {
                                if (cardWei == weiJson.cm) {
                                    outCard.push(cards[index]);
                                }
                            });

                            if (outCard.length > 3) {
                                outCard = outCard.slice(0, 3);
                            }
                            cardWeis.forEach(function (cardWei, index) {
                                if (cardWei == weiJson.cf) {
                                    outCard.push(cards[index]);
                                }
                            });

                            if (outCard.length != comLen) outCard = [];
                        }
                        break;
                    }
                    case 'c32': {    //三带对 5
                        var weiJson = threeCard(cardWeiArr, comInfo.groupCardsWeight, comLen, comInfo.cardType);
                        if (weiJson.cm && weiJson.cf) {
                            cardWeis.forEach(function (cardWei, index) {
                                if (cardWei == weiJson.cm) {
                                    outCard.push(cards[index]);
                                }
                            });

                            if (outCard.length > 3) {
                                outCard = outCard.slice(0, 3);
                            }
                            cardWeis.forEach(function (cardWei, index) {
                                if (cardWei == weiJson.cf) {
                                    outCard.push(cards[index]);
                                }
                            });

                            if (outCard.length != comLen) outCard = [];
                        }
                        break;
                    }
                    case 'c123': {   //顺子 >= 5
                        var weiJson = straightCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        if (size(weiJson) && weiJson.len && weiJson.weiArr) {
                            if (weiJson.len > comLen) {
                                weiJson.weiArr = weiJson.weiArr.slice(0, comLen);
                            }
                            weiJson.weiArr.forEach(function (wei) {
                                outCard.push(cardWeis.indexOf(wei));
                            });

                            if (outCard.length > comLen) outCard = outCard.slice(0, comLen);

                        }
                        break;
                    }
                    case 'c1122': {   //连对 >= 6
                        var weiArr = straightCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        if (weiArr && weiArr.length == comLen) {


                            weiArr.forEach(function (wei) {
                                outCard.push(cardWeis.indexOf(wei));
                            });

                            if (outCard.length > comLen) outCard = outCard.slice(0, comLen);

                        }
                        break;
                    }

                    case 'c41': {    //四代两单 6

                        var weiJson = fourBandCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        if (weiJson && weiJson.cm && weiJson.cf) {
                            weiJson.cm.forEach(function (card) {
                                outCard.push(cardWeis.indexOf(card));
                            });

                            weiJson.cf.forEach(function (card) {
                                outCard.push(cardWeis.indexOf(card));
                            });

                            if (outCard.length != comLen) outCard = [];


                        }

                        break;
                    }
                    case 'c42': {   //飞机带两队 10

                        var weiJson = fourBandCard(cardWeiArr, comInfo.groupCardsWeight.wei, comLen, comInfo.cardType);
                        if (weiJson && weiJson.cm && weiJson.cf) {
                            weiJson.cm.forEach(function (card) {
                                outCard.push(cardWeis.indexOf(card));
                            });

                            weiJson.cf.forEach(function (card) {
                                outCard.push(cardWeis.indexOf(card));
                            });

                            if (outCard.length != comLen) outCard = [];

                            break;
                        }
                    }
                }
            } else {
                console.log('上一手牌不合法!');
            }

        } else {         //没有需要比较的牌,则直接按照最小的牌出起
            var minWeight = cardWeiArr.min();       //最小权重值
            var minWeiLen = 0;
            cardWeis.forEach(function (cardWei, index) {
                if (cardWei == minWeight) {
                    minWeiLen++;
                    outCard.push(cards[index]);
                }
            });
            if (minWeiLen > 3) {          //这是炸弹,既然托管就这样出吧

            }
        }

        if (!outCard || !outCard.length && comInfo.cardType == 1) {        //要比的牌不是炸弹的话,正常的压不过,就查找是否有炸弹
            var weiValue = repeatCard(cardWeiArr, 0, 4, 'cz');
            if (weiValue && weiValue != 15) {       //普通炸弹
                cardWeis.forEach(function (cardWei, index) {
                    if (cardWei == weiValue) {
                        outCard.push(cards[index]);
                    }
                });
                if (outCard.length != 4) outCard = [];
            }else if(weiValue && weiValue == 15){   //王炸
                cardWeis.forEach(function (cardWei, index) {
                    if (cardWei == 14 || cardWei == 15) {
                        outCard.push(cards[index]);
                    }
                });
                if (outCard.length != 2) outCard = [];
            }

        }
        console.log('866--selCard:%s ,lastHand:%s, haveCards:%s,comInfo:%s',JSON.stringify(outCard),JSON.stringify(comCard),JSON.stringify(cards),JSON.stringify(comInfo));
        return outCard;
    };
};

module.exports = new doudizhu();

/**
 * 重复牌型
 * @param cards 牌权重数组
 * @param minWei    需要压过牌的权重
 * @param needLen   需要的牌数量
 */
function repeatCard(cards,minWei,needLen,type){

    if(cards.length < needLen) return false;
    var cardItem = {},outValue = null;      //json数组,保存牌以及重复个数  {card:length}

    cards.sort(function(a,b){return a - b;});
    cards.forEach(function(card){
        if(cardItem[card]){
            cardItem[card]++;
        }else{
            cardItem[card] = 1;
        }
    });
    console.log('893 rep cards:%s,cardItem:%s,comInfo:%s,needLen:%s,type:%s',JSON.stringify(cards),JSON.stringify(cardItem),JSON.stringify(minWei),needLen,type);

    if(type == 'cz'){        //寻找有无炸弹
        for(var v in cardItem){
            v = parseInt(v)
            if(cardItem[v] == 4 ){
                outValue = v;
            }
        }

        if(!outValue){      //寻找是否有王炸
            var temp = [];
            for(var v in cardItem){
                if(parseInt(v) == 14 || parseInt(v) == 15){
                    temp.push(parseInt(v));
                    if(temp.length == 2){
                        outValue = 15;
                    }
                }
            }
        }
    }else {           //c4,c1,c2
        for(var v in cardItem){
            v = parseInt(v);
            if(parseInt(v) > minWei && cardItem[v] >= needLen){
                outValue = v;
            }
        }
    }

    return outValue;

};

/**
 * 顺子牌 顺子/连队(双顺子)
 * @param cards 传来的权重牌
 * @param minWei  最小权重牌
 * @param needLen   最小长度
 * @param type  'c123'/'c1122'
 */
function straightCard(cards,minWei,needLen,type) {

    if (cards.length < needLen) return false;

    var weiArr = [];        //保存牌权重数组

    cards.forEach(function (card) {
        weiArr.push(getWeight(card));
    });

    weiArr.sort(function (a,b) {return a - b;});

    var shunArr = [], outArr = null;       //保存排好序的权重数组,返回的权重数组

    if (type == 'c123') {     //顺子
        weiArr.forEach(function (wei) {
            if (wei > minWei && shunArr.indexOf(wei) == -1 && wei < 13) {
                shunArr.push(wei);
            }
        });
        console.log('1. shunArr:%s',JSON.stringify(shunArr));
        if (shunArr.length < needLen) return false;

        shunArr.sort(function (a, b) {
            return a - b;
        });

        var tempArr = [];
        shunArr.forEach(function (cardWei, index) {
            var j = index + 1;
            if (cardWei + 1 == shunArr[j]) {
                tempArr.push(cardWei);
            } else {
                tempArr.push(cardWei);
                if (tempArr.length >= needLen && !outArr) {
                    outArr = tempArr.concat().slice(0, needLen);
                }
                tempArr = [];
            }
        });
        console.log('1. outArr:%s',JSON.stringify(outArr));
    } else {         //连队

        var cardItem = {},reArr = [];     //保存是重复权重的数组

        var cardItem = {};      //{card1:len1,card2:len2 ...}
        weiArr.forEach(function(card){
            if(cardItem[card]){
                cardItem[card]++;
            }else{
                cardItem[card] = 1;
            }
        });

        for(var v in cardItem){
            v = parseInt(v);
            if(v > minWei && v < 13 && cardItem[v] > 1){
                reArr.push(v);
            }
        }

        console.log('2. reArr:%s',JSON.stringify(reArr));
        if (reArr.length < needLen) return false;

        var tempArr = [];

        reArr.forEach(function (cardWei, index) {
            var j = index + 1;
            if (cardWei + 1 == reArr[j]) {
                tempArr.push(cardWei);
                console.log('2.1. tempArr:%s',JSON.stringify(tempArr));
            } else {
                tempArr.push(cardWei);
                if (tempArr.length >= needLen && !outArr) {
                    outArr = tempArr.concat().slice(0, needLen);
                }
                tempArr = [];
            }
        });

    }

    return outArr;
};


/**
 * 三张牌型 (根据牌数量分两飞机和三飞机) c33包括c33和c333
 * @param cards     //用户手上所有的牌
 * @param minWei
 * @param needLen
 * @param type c3,c31,c32
 */
function threeCard(cards,comInfo,needLen,type){

    if(cards.length < needLen) return false;

    cards.sort(function (a,b) {
        return a- b;
    });

    var danArr = [], temp = [];         //用于找出并保存三张的牌
    cards.forEach(function(card,index){
        var j=index+1;
        if(card == cards[j]){
            temp.push(card);
        }else{
            if(temp.length > 1 && card > comInfo.wei && danArr.indexOf(card) == -1){
                danArr.push(card);
            }

            temp = [];
        }
    });

    console.log('danArr:%s,cards:%s, temp:%s',JSON.stringify(danArr),JSON.stringify(cards));
    if(type == 'c3'){
        var cmArr = [];
        danArr.forEach(function (card,index) {
            var j = index + 1;
            if(card+1 == danArr[j]){
                if(cmArr.indexOf(card) == -1) cmArr.push(card);
                if(cmArr.indexOf(card+1) == -1) cmArr.push(card+1);
            }
        });

        console.log('cmArr:%s,danArr:%s',JSON.stringify(cmArr));

        if(cmArr && cmArr.length){
            return cmArr = cmArr.slice(0,comInfo.len)
        }else {
            return false;
        }


    }else if(type == 'c31'){

        var cmArr = [],cfArr = [];;

        var planLen = comInfo.len;  // 飞机个数,单牌数量
        danArr.forEach(function (card, index) {
            var j = index + 1;
            if (card + 1 == danArr[j]) {
                if(cmArr.indexOf(card) == -1) cmArr.push(card);
                if(cmArr.indexOf(card+1) == -1) cmArr.push(card+1);
            }
        });
        cmArr = cmArr.slice(0,comInfo.len);

        if (cmArr.length == planLen) {

            for(var i = 0; i<cards.length; i++){
                if(cfArr.length < planLen && cmArr.indexOf(cards[i]) == -1){
                    cfArr.push(cards[i]);
                }
                if(cfArr.length == planLen) break;
            }
        }

        console.log('cmArr:%s,danArr:%s',JSON.stringify(cmArr),JSON.stringify(cfArr));

        if(cmArr && cfArr && cmArr.length == cfArr.length  && cmArr.length == planLen){
            return {cm:cmArr,cf:cfArr};
        }else {
            return false;
        }
    }else if(type == 'c32') {

        var cardItem = {};
        cards.forEach(function (card) {
            if (cardItem[card]) {
                cardItem[card]++;
            } else {
                cardItem[card] = 1;
            }
        });

        var cmArr = [], cfArr = [];

        var planLen = comInfo.len;  // 飞机个数,单牌数量
        danArr.forEach(function (card, index) {
            var j = index + 1;
            if (card + 1 == danArr[j]) {
                if(cmArr.indexOf(card) == -1) cmArr.push(card);
                if(cmArr.indexOf(card+1) == -1) cmArr.push(card+1);
            }
        });

        cmArr = cmArr.slice(0,comInfo.len);

        if (cmArr.length == planLen) {

            for (var v in cardItem) {
                v = parseInt(v);
                if (cardItem[v] >= 2 && cmArr.indexOf(v) == -1 && cfArr.length < planLen) {    //2副对子
                    cfArr.push(parseInt(v));
                }
            }
        }

        if(cmArr && cfArr && cmArr.length == cfArr.length  && cmArr.length == planLen){
            return {cm:cmArr,cf:cfArr};
        }else {
            return false;
        }
    }

};

/**
 * 四带单牌/对子
 * @param cards
 * @param minWei
 * @param needLen
 * @param type c41 / c42
 */
function fourBandCard(cards,minWei,needLen,type) {

    if(cards.length < needLen) return false;

    var cardItem = {} , cardJson = {};
    cards.forEach(function(card){
        if(cardItem[card]){
            cardItem[card]++;
        }else{
            cardItem[card] = 1;
        }
    });

    if(type == 'c41'){      //四带2单牌 4+2
        var c4 = null;
        for(var v in cardItem){
            if(parseInt(v) > minWei && cardItem[v] >= 4 && !c4 ){
                c4 = parseInt(v);
            }
        }
        if(c4){
            var singleCard = [];
            cards.forEach(function (card) {
                if(card != c4 && singleCard.length < 2){
                    singleCard.push(card);
                }
            });
            if(singleCard.length){
                cardJson.cm = [c4,c4,c4,c4];
                cardJson.cf = singleCard.slice(0,2);
            }
        }

    }else {                 //四带两对 4+4
        var c4 = null , c2 = [];
        for(var v in cardItem){
            if(parseInt(v) > minWei && cardItem[v] >= 4 && !c4 ){
                c4 = parseInt(v);
            }
            if(cardItem[v] > 1 && cardItem[v] < 4 && c2.length < 2){
                c2.push(parseInt(v));
            }
        }
        if(c4 && c2.length == 2){
            cardJson.cm = [c4,c4,c4,c4];
            cardJson.cf = c2.concat(c2);
        }
    }

    return cardJson;

};

var getSuits = function (id) {
    id = parseInt(id);
    var suits = Math.ceil(id % 4);

    if (id >= 0 && id <= 51) {
        return suits.toString();
    } else if (id === 52) {
        return 'Swang';
    } else if (id === 53) {
        return 'Bwang';
    } else {
        console.log('1418 id:%s 牌不合法',id);
        throw '牌id不合法';
    }
};
// 获取牌权重 1-15
var getWeight = function (id) {
    id = parseInt(id);

    if (id >= 0 && id <= 7) {
        return Math.ceil((id + 1) / 4) + 11;
    } else if (id >= 8 && id <= 51) {
        return Math.ceil((id + 1) / 4) - 2;
    } else if (id == 52) {
        return 14;
    } else if (id == 53) {
        return 15;
    } else {
        console.log('1435 id:%s 牌不合法',id);
        throw '牌id不合法'
    }
};

/**
 * 根据牌权重将该牌所有id返回
 * @param weight    牌权重
 * @returns {*}     牌id数组
 */
function boomCard(weight) {
    switch (parseInt(weight)){

        case 1:{        //3
            return [8,9,10,11];
            break;
        }
        case 2:{        //4
            return [12,13,14,15];
            break;
        }
        case 3:{        //5
            return [16,17,18,19];
            break;
        }
        case 4:{        //6
            return [20,21,22,23];
            break;
        }
        case 5:{        //7
            return [24,25,26,27];
            break;
        }
        case 6:{        //8
            return [28,29,30,31];
            break;
        }
        case 7:{        //9
            return [32,33,34,35];
            break;
        }
        case 8:{        //10
            return [36,37,38,39];
            break;
        }
        case 9:{        //J
            return [40,41,42,43];
            break;
        }
        case 10:{       //Q
            return [44,45,46,47];
            break;
        }
        case 11:{       //K
            return [48,49,50,51];
            break;
        }
        case 12:{       //A
            return [0,1,2,3];
            break;
        }
        case 13:{       //2
            return [4,5,6,7];
            break;
        }
        default:{       //王
            return [53,54];
        }
    }
};


/**
 * 返回Json对象属性个数
 * @param obj
 * @returns {number}
 */
function size(obj) {
    if(!obj) {
        return 0;
    }

    var size = 0;
    for(var f in obj) {
        if(obj.hasOwnProperty(f)) {
            size++;
        }
    }

    return size;
};