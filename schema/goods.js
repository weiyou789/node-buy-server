const mongoose = require('../database/mongo');

const Schema = mongoose.Schema;

const goodsSchema = new Schema({
    goodsStatus: {type:Number,default:1},//商家商品状态1：审核 2：上架 3：下架
    goodsTitle:{type:String},//商品商品标题
    goodsDesc:{type:String},//商品描述
    goodsOrder:{type:Number,default:1},//商品成团状态1：未成团 2：成团
    spuId: {type:Number,unique:true},//商品唯一标识
    createTime: {type: Date, default: Date.now},//商品创建时间
    goodsImgUrl:[],//商品图片地址
    businessId:{type:Number},//商家唯一标识
    goodsPrice:Number,//商品价格
    goodsNum:Number,//商品购买数目
});

goodsSchema.index({spuId:1});

const Goods = mongoose.model('goods',goodsSchema);

module.exports = Goods;