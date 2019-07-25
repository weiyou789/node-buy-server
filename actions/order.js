const error = require('../utils/wError');
const constant = require('../utils/constant');
const Goods = require('../schema/goods');
const Bus = require('../schema/business');
const Orders = require('../schema/order');
const User = require('../schema/user');

const createOrder = async (ctx,next) =>{//创建订单
    try{
        const {spuId=null,userId=null} = ctx.request.body;
        //console.log(spuId*1);
        if(!spuId||!userId||!spuId*1||!userId*1){
            ctx.response.body = constant.PARAMS_ERR;
            return next();
        }
        const _userData = await User.findOne({userId});
        const _goodsData = await Goods.findOne({spuId});
        const _time = new Date().getTime();
        const _Id = _time.toString().substr(5,7);

        if(userId&&_userData){//判断用户信息是否存在
            const {nickName} = _userData;
            if(spuId&&_goodsData){//判断商品数据是否存在
                if(_goodsData.goodsStatus*1===2){//判断商品是否是上架状态
                    if(_goodsData.goodsOrder*1===1){//判断商品是已成团还是未成团商品。未成团直接到订单表里插入一条数据
                        let order = new Orders({
                            orderId:_Id*1,
                            spuId,
                            buyNum:1,
                            businessId:_goodsData.businessId,
                            buyUser:[{nickName,userId,payStatus:1}]
                        });
                        order = await order.save();
                        await Goods.update({spuId},{goodsOrder:2,$inc:{goodsNum:1}});
                        ctx.response.body = constant.SUCCESS;
                    }else{//已成团添加用户信息到对应的团订单里
                        const _order = await Orders.findOne({spuId});
                        const _user = _order.buyUser.some((val)=>{
                            //console.log(val);
                            return val.userId*1 === userId*1;
                        });
                        if(_user){//判断该用户是否已经购买过该商品
                            ctx.response.body = constant.USER_ORDER;
                        }else{
                            await Orders.update({spuId},{$push:{buyUser:{nickName,userId,payStatus:1}},$inc:{buyNum:1}});
                            await Goods.update({spuId},{$inc:{goodsNum:1}});
                            ctx.response.body = constant.SUCCESS;
                        }
                    }
                }else{
                    ctx.response.body = constant.NO_GOODS_DATA;
                }

            }else{
                ctx.response.body = constant.NO_GOODS_DATA;
            }

        }else{
            ctx.response.body = constant.NO_AUTH;
        }

        return next();
    }catch (e) {
        ctx.body = error('createorder', e);
        return next();
    }
};

const confirmOrder = async (ctx,next) => {//确认支付
    try{
        const {userId=null,orderId=null} = ctx.request.body;
        if(!orderId||!userId||!orderId*1||!userId*1){
            ctx.response.body = constant.PARAMS_ERR;
            return next();
        }
        let _orderData = await Orders.findOne({orderId});
        if(_orderData){
            for(let i=0;i < _orderData.buyUser.length;i++){
                console.log(_orderData.buyUser[i].userId);
                if(_orderData.buyUser[i].userId*1 === userId*1){
                    _orderData.buyUser[i].payStatus = 2;
                    _orderData.markModified('payStatus');//不知道为什么这样写，不过这样写就可以更新数据
                    await _orderData.save();
                }
            }
            ctx.response.body = constant.SUCCESS;
        }else{
            ctx.response.body = constant.NO_DATA;
        }
        return next();
    }catch (e) {
        ctx.body = error('confirmorder', e);
        return next();
    }
};

const getOrder = async (ctx,next) => {//获取订单
    try{
        const { businessId=null,userId=null } = ctx.query;
        if(businessId*1){
            let res = await Orders.find({businessId}).sort({createTime:1});
            ctx.response.body = Object.assign({result: res}, constant.SUCCESS);
        }else if(userId*1){
            let res = await Orders.find({buyUser:{$elemMatch:{userId}}}).sort({createTime:1});
            for(let i = 0;i<res.length;i++){
                res[i]._doc.buyUser = "";
            }
            ctx.response.body = Object.assign({result: res}, constant.SUCCESS);
        }else{
            ctx.response.body = constant.NO_DATA;
        }

        return next();
    }catch (e) {
        ctx.body = error('getorder', e);
        return next();
    }
};

module.exports = function(route){
    route.post('/server/createOrder',createOrder);
    route.post('/server/confirmOrder',confirmOrder);
    route.get('/server/getOrder',getOrder);
};