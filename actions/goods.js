const error = require('../utils/wError');
const constant = require('../utils/constant');
const Goods = require('../schema/goods');
const Bus = require('../schema/business');
const Orders = require('../schema/order');
const fs = require('fs');
const path_t = require('path');



const uuid = require('node-uuid');
const amqp = require('amqplib');//rabbitmq链接库
const Promise = require("bluebird");//promise库
const fq = 'fq' //前端发送消息队列
const bq = 'bq' //后端回复队列
let conn // mq连接
let userId = 1
let connectId = uuid()

amqp.connect('amqp://127.0.0.1').then(function(_conn){//连接mq
    conn = _conn;//把mq连接赋值给全局变量
});
const getTest = async (ctx,next) =>{//mq测试接口

    try{
        const number = userId ++;
        let ch = await conn.createChannel();//创建mq通道
        ch.sendToQueue(fq, new Buffer(number.toString()), {replyTo: bq, connectId: connectId});//把数据发送给前端消息队列fq，附带把后端回复消息队列名称也发送
        await ch.assertQueue(bq, {durable: false});//监听后端回复队列bq,并设置durable持久化为false。这里消息将会被保存在内存中
        const getResult = async () => {
            return new Promise((resolve) => {
                ch.consume(bq, (msg) => {//创建消费者，消费bg队列，并且用promise包裹，返回处理结果，设置noAck为false表示对消费结果做出回应。
                    //console.log(5555,msg)
                    ch.close()
                    resolve(msg.content.toString())
                },{noAck: false})
            })
        };
        const result = await getResult();//获得处理结果
        ctx.response.body = Object.assign({result:{msg: result}}, constant.SUCCESS);//把处理结果放入响应里
        return next();
    }catch (e) {
        ctx.body = error('getTest', e);
        return next();
    }

};



const AddGoods = async (ctx,next) => {//添加商品
    try{
        const _time = new Date().getTime();
        const spuId = _time.toString().substr(7,5);//商品spuId时间戳截取5位
        const obj = Object.assign(ctx.request.body,{spuId:spuId*1});
        let goods = new Goods(obj);
        goods = await goods.save();
        //let _bus = await Bus.update({businessId:goods._business},{$push:{_goods:goods.spuId}});
        ctx.response.body = constant.SUCCESS;
        return next();
    }catch (e) {
        ctx.body = error('addgoods', e);
        return next();
    }
};


const uploadImg = async (ctx,next) => {//上传图片
    try{
        const file = ctx.request.files.file;
        const {path, name} = file;
        //console.log(path,name)
        const reader = fs.createReadStream(path);
        let filePath = path_t.join(__dirname, '../uploads/img/') + `${name}`;
        const upStream = fs.createWriteStream(filePath);
        reader.pipe(upStream);
        const imgUrl = `api.tuan.com:3000/img/${name}`
        ctx.response.body = Object.assign({result: {imgUrl}}, constant.SUCCESS);
        return next();
    }catch (e) {
        ctx.body = error('uploadImg', e);
        return next();
    }
}

const getGoodsDet = async (ctx,next) => {
    try{
        const { spuId } = ctx.query;
        let res = await Goods.findOne({spuId}).lean();
        if(res.goodsOrder*1 === 2){
            let _order = await Orders.findOne({spuId});
            res.buyUser = _order.buyUser;
        }
        const { businessId } = res;
        let resB = await Bus.findOne({businessId}).lean();
        let detRes = Object.assign(res,resB);
        //console.log(1112,detRes)
        ctx.response.body = Object.assign({result: detRes},constant.SUCCESS);
        return next();
    }catch (e) {
        ctx.body = error('getGoodsDet', e);
        return next();
    }
}

const getGoods = async (ctx,next) => {//获取商品列表
    try{
        const { businessId=null } = ctx.query;
        let res = businessId?await Goods.find({businessId}).sort({createTime:1}):await Goods.find().sort({createTime:1});
        for(let i = 0;i<res.length;i++){
            if(res[i].goodsOrder*1 === 2){//如果商品是成团状态需要去查订单表里该商品对应的购买用户
                let _order = await Orders.findOne({spuId:res[i].spuId});
                res[i]._doc.buyUser = _order.buyUser;//真正的对象在_doc这个键值上
            }
        }
        ctx.response.body = Object.assign({result: res}, constant.SUCCESS);
        return next();
    }catch (e) {
        ctx.body = error('getgoods', e);
        return next();
    }

};




module.exports = function(route){
    route.post("/server/addgoods",AddGoods);
    route.post("/server/uploadImg",uploadImg);
    route.get("/server/getgoods",getGoods);
    route.get("/server/getGoodsDet",getGoodsDet);
    route.get("/server/getTest",getTest);
};