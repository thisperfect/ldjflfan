/**
 * Created by Administrator on 2017/12/11 0011.
 */
var cardType = {};
module.exports = cardType;

/**
 * 是否是单对子
 * @param weiArr  牌权重数组
 */
cardType.isDanC2 = function(weiArr){

    if(weiArr.length != 2) return false;

    if(weiArr[0] != weiArr[1]){
        return false;
    }else {
        return true;
    }
};

/**
 * 是否王炸
 * @param cardItem
 * @returns {boolean}
 */
cardType.isWangZha = function (cardItem) {
    var swan = false, bwang = false;
    if(!cardItem || size(cardItem) != 2) return false;
    for(var i in cardItem){
        i = parseInt(i);
        if(i == 14) swan = true;
        if(i == 15) bwang = true;
    }
    if(swan && bwang){
        return true;
    }else {
        return false;
    }
};

/**
 * 是否纯三张
 * @param cardItem
 * @returns {boolean}
 */
cardType.isJustC3 = function (cardItem) {

    if(!cardItem) return false;

    var sanArr = [];

    for(var i in cardItem){
        i = parseInt(i);
        if(cardItem[i] != 3){
            return false;
        }else {
            sanArr.push(i);
        }
    }
    return {len:sanArr.length,wei:sanArr[0]};
};


/**
 * 是否是炸弹
 * @param cardItem
 * @returns {boolean}
 */
cardType.isC4 = function (cardItem) {

    if(!cardItem && size(cardItem) != 1) return false;
    for(var i in cardItem){
        if(cardItem[i] == 4){
            return true;
        }else {
            return false;
        }
    }
};

/**
 * 是否3带1
 * @param cardItem
 * @returns {boolean}
 */
cardType.isC31 = function (cardItem) {

    if(!cardItem || size(cardItem) < 1) return false;
    var sanArr = [],danArr = [],sanLen = 0,sanWei = 0;
    for(var i in cardItem){
        i = parseInt(i);
        if(cardItem[i] == 3){
            if(sanArr.indexOf(i) == -1) sanArr.push(i);
        }else if(cardItem[i] == 4){     //炸弹需要拆出三张和单牌来
            sanArr.push(i);
            danArr.push(i);
        }else if(cardItem[i] == 2){
            danArr.push(i,i);
        }else if(cardItem[i] == 1){
            danArr.push(i);
        }else {
            console.log('item:%s ,i:%s',cardItem[i],i);
            throw '牌不合法';
        }
    }

    console.log('sanArr:%s,danArr:%s',JSON.stringify(sanArr),JSON.stringify(danArr));

    if(sanArr.length == 0){         //无三张
        return false;
    }else if(sanArr.length == 1){
        if(danArr.length == sanArr.length){
            sanLen = 1;
            sanWei = sanArr[0];
            return {len:sanLen,wei:sanWei};
        }else {
            return false;
        }
    }else if(sanArr.length >1){           //超过两个则需要先排序
        var shunArr = [],dan3 = null;     //保存顺子和溢出的不顺的三张单牌
        sanArr.forEach(function(wei,index){
            var j = index+1;
            if(wei+1 == sanArr[j]){
                if(shunArr.indexOf(wei) == -1) shunArr.push(wei);
                if(shunArr.indexOf(wei+1) == -1) shunArr.push(wei+1);
            }else{
                if(wei-1 != sanArr[index -1]){
                    dan3 = wei;
                }
            }
        });
        if(dan3) danArr.push(dan3,dan3,dan3);            //放入单牌中
        console.log('133  sanArr:%s,danArr:%s,dan3:%s',JSON.stringify(sanArr),JSON.stringify(danArr),dan3);
        if(shunArr[shunArr.length] == 13){      //超过两张不能包含2(权重13)
            return false;
        }else if(danArr.length == shunArr.length){
            sanLen = shunArr.length;
            sanWei = shunArr[0];
            return {len:sanLen,wei:sanWei};
        }else {
            return false;
        }
    }

};
/**
 * 是否3带2
 * @param cardItem
 */
cardType.isC32 = function (cardItem) {

    if(!cardItem && size(cardItem) < 1) return false;
    var sanArr = [],duiArr = [],sanLen = 0,sanWei = 0;
    for(var i in cardItem){
        i = parseInt(i);
        if(cardItem[i] == 3){
            if(sanArr.indexOf(i) == -1) sanArr.push(parseInt(i));
        }else if(cardItem[i] == 4){     //炸弹需要拆分成两个对子
            duiArr.push(i,i);
        }else if(cardItem[i] == 2){
            duiArr.push(i);
        }else if(cardItem[i] == 1){
            return false;
        }else {
            throw '牌不合法';
        }
    }

    if(sanArr.length == 0){         //无三张
        return false;
    }else if(sanArr.length == 1){
        if(duiArr.length == sanArr.length){
            sanLen = 1;
            sanWei = sanArr[0];
            return {sanLen:sanLen,sanWei:sanWei};
        }else {
            return false;
        }
    }else if(sanArr.length >1){         //超过两个则需要先排序
        var shunArr = [],dan3 = null;   //保存顺子和溢出的不顺的三张单牌
        sanArr.forEach(function(wei,index){
            var j = index+1;
            if(wei+1 == sanArr[j]){
                if(shunArr.indexOf(wei) == -1) shunArr.push(wei);
                if(shunArr.indexOf(wei+1) == -1) shunArr.push(wei+1);
            }else{
                if(wei-1 != sanArr[index -1]){
                    dan3 = wei;
                }
            }
        });
        console.log('193  sanArr:%s,danArr:%s,dan3:%s',JSON.stringify(sanArr),JSON.stringify(dan3),dan3);
        if(dan3) return false;
        if(shunArr[shunArr.length] == 13){      //超过两张不能包含2(权重13)
            return false;
        }else if(duiArr.length == shunArr.length){
            sanLen = shunArr.length;
            sanWei = shunArr[0];
            return {len:sanLen,wei:sanWei};
        }else {
            return false;
        }
    }

};

/**
 * 是否是顺子
 * @param cardItem
 */
cardType.isC123 = function (weiArr) {
    var weiLen = weiArr.length,flag = true;

    if(weiLen < 5 || weiArr[weiLen] == 13)     //不能包含2(权重13) return false;

    weiArr.forEach(function(wei,index){
        var j = index+1;
        if( wei+1 == weiArr[j]){

        }else {
            console.log('wei:%s, wei[j]:%s ,j:%s',wei,weiArr[j],j);
            if(j<weiLen) flag = false;
        }
    });

    if(flag){
        return {len:weiLen,wei:weiArr[0]};
    }else {
        return false;
    }

};

/**
 * 是否是顺子
 * @param cardItem
 */
cardType.isC1122 = function (cardItem) {

    if(!cardItem && size(cardItem) < 2) return false;
    var duiArr = [];
    for(var i in cardItem){
        i = parseInt(i);
        if(cardItem[i] == 2){
            duiArr.push(i);
        }else {
            return false;
        }
    }
    var duiLen = duiArr.length, flag = true;
    if(duiLen< 2 || duiArr[duiLen] == 13)  return false;        //不能包含2(权重13)

    console.log('252 duiArr:%s',JSON.stringify(duiArr));
    duiArr.forEach(function(wei,index){
        var j = index+1;

        if( wei+1 == duiArr[j]){
            console.log('11 wei:%s, duiLen[j]:%s ,j:%s',wei,duiArr[j],j);
        }else {
            console.log('22 wei:%s, duiLen[j]:%s ,j:%s',wei,duiArr[j],j,wei+1,typeof (wei),typeof (duiArr[j]));
            if(j<duiLen) flag = false;
        }
    });

    if(flag){

        return {len:duiLen,wei:duiArr[0]};
    }else {
        return false;
    }

};


/**
 * 是否4带2单牌
 * @param cardItem
 */
cardType.isC41 = function (cardItem) {

    if(!cardItem && size(cardItem) < 1) return false;
    var fourWei = false,danArr = [];
    for(var i in cardItem){
        i = parseInt(i);
        if(cardItem[i] == 3){
            return false;
        }else if(cardItem[i] == 4){     //炸弹需要拆分成两个对子
            if(fourWei){
                return false;
            }else {
                fourWei = i;
            }
        }else if(cardItem[i] == 2){
            danArr.push(i,i);
        }else if(cardItem[i] == 1){
            danArr.push(i);
        }else {
            throw '牌不合法';
        }
    }

    if(fourWei && danArr.length == 2){
        return {len:6,wei:fourWei}
    }else {
        return false;
    }
};

/**
 * 是否4带2对子
 * @param cardItem
 */
cardType.isC42 = function (cardItem) {

    if(!cardItem && size(cardItem) < 2) return false;
    var fourWei = false,duiArr = [];
    for(var i in cardItem){
        i = parseInt(i);
        if(cardItem[i] == 3){
            return false;
        }else if(cardItem[i] == 4){     //炸弹需要拆分成两个对子
            if(fourWei){
                return false;
            }else {
                fourWei = i;
            }
        }else if(cardItem[i] == 2){
            duiArr.push(i);
        }else if(cardItem[i] == 1){
            return false;
        }else {
            throw '牌不合法';
        }
    }

    if(fourWei && duiArr.length == 2){
        return {len:8,wei:fourWei}
    }else {
        return false;
    }
};



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