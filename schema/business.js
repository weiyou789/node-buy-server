const mongoose = require('../database/mongo');

const Schema = mongoose.Schema;


const BusSchema = new Schema({
    regType:Number,//注册类型 商家：2
    avatarUrl:String,//微信头像
    city:String,//城市
    country:String,//国家
    province:String,//省份
    businessId:{type:Number,unique:true},//商家唯一标识
    businessTitle:{type:String},//商家名称
    nickName:{type:String},//用户昵称
    //userName:{type:String,required:[true,'用户名不能为空']},//商家用户名
    //userPsw:{type:String,required:[true,'密码不能为空']},//商家密码
    userIphone:{type:Number},//商家电话号码
    businessAds:{type:String},//商家地址
    longitude:{type:String},//商家经纬度
    latitude:{type:String},//商家经纬度
    openid:String,//用户微信唯一标识（从腾讯接口获取）
    token:String,//token
    session_key:String,//用来生成token的密钥（从腾讯接口获取）
    created_time: {type: Date, default: Date.now},//商家创建时间
});

BusSchema.index({businessId:1});

const Business = mongoose.model('business',BusSchema);

module.exports = Business;