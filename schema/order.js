const mongoose = require('../database/mongo');

const Schema = mongoose.Schema;

const userlistSchema = new Schema({
    userId:{type:Number},//用户唯一标识
    nickName:{type:String},//商品购买人员昵称
    payStatus:{type:Number,default:1},//付款状态1：未付，2：已付
    buy_time: {type: Date, default: Date.now}//商品购买时间
});

const orderSchema = new Schema({
    orderId:{type:Number,unique:true},//订单号
    spuId:{type:Number},//商品唯一标识
    businessId:{type:Number},//商家唯一标识
    buyUser:[userlistSchema],//所有购买商品人员
    buyNum:{type:Number,default:0},//商品购买人数
    created_time: {type: Date, default: Date.now}//订单创建时间
});

orderSchema.index({orderId:1});

const Order = mongoose.model('order',orderSchema);

module.exports = Order;