const mongoose = require('../database/mongo');

const Schema = mongoose.Schema;

/*const listSchema = new Schema({
    orderId:{type:Number},
});*/

const UserSchema = new Schema({
    regType:Number,//注册类型 用户：1
    avatarUrl:String,//微信头像
    city:String,//城市
    country:String,//国家
    province:String,//省份
    userId:{type:Number,unique:true},//用户唯一标识
    //userKey:{type:String},//用户token,每次登陆重新计算
    nickName:{type:String},//用户昵称
    //userName:{type:String,required:[true,'用户名不能为空']},//用户名
    //userPsw:{type:String,required:[true,'密码不能为空']},//密码
    userIphone:{type:Number},//用户手机号码
    openid:String,//用户微信唯一标识（从腾讯接口获取）
    token:String,//token
    session_key:String,//用来生成token的密钥（从腾讯接口获取）
    created_time: {type: Date, default: Date.now}//创建时间
    //userOrder:[listSchema]//用户订单
});

UserSchema.index({userId:1});

const User = mongoose.model('user',UserSchema);

module.exports = User;