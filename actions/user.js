const error = require('../utils/wError');
const constant = require('../utils/constant');
const User = require('../schema/user');
const Bus = require('../schema/business');
const wx = require('../wxconfing');
//const request = require('request');
const koa2request = require('koa2-request');
const jwt = require('jsonwebtoken');

const wxAuthorize = async (ctx,next) => {//微信授权
        try{
            const { token=null } = ctx.request.body;
            //console.log(11,token);
            if(token){
                const info = await User.findOne({token})||await Bus.findOne({token});
                if(info){
                    jwt.verify(token, info.session_key,(err, decode)=>{
                        if (err) {  //  时间失效的时候伪造的token
                            ctx.response.body = constant.RUNTIME_ERROR;
                        } else {
                            ctx.response.body = Object.assign({result:info}, constant.SUCCESS);
                        }
                    });
                } else{
                    ctx.response.body = constant.RUNTIME_ERROR;
                }
            }else{
                const { code, avatarUrl, city, country, province, nickName, regType  } = ctx.request.body;
                const _time = new Date().getTime();
                const _Id = _time.toString().substr(6,6);
                const options = {
                    method: 'POST',
                    url: 'https://api.weixin.qq.com/sns/jscode2session?',
                    formData: {
                        appid: wx.appid,
                        secret: wx.secret,
                        js_code: code,
                        grant_type: 'authorization_code'
                    }
                };
                const _data = await koa2request(options);//请求微信开放平台获取session_key，openid
                const { body } = _data;
                const { session_key, openid } = JSON.parse(body);
                const token = jwt.sign({ code }, session_key, {//使用用户的code和session_key加密生成token
                    expiresIn: 60*60
                });
                const info = await User.findOne({openid})||await Bus.findOne({openid});

                if(info){//如果info存在就是已经注册过的用户，通过openid更新token和session_key
                    const { regType, userId=null, businessId=null } = info;
                    if(info.regType*1===1){
                        await User.update({openid},{token,session_key});
                    }else if(info.regType*1===2){
                        await Bus.update({openid},{token,session_key});
                    }
                    ctx.response.body = Object.assign({result: {token,regType,userId,businessId,nickName,avatarUrl}}, constant.SUCCESS);
                } else if(regType*1===1||!regType){//如果是普通用户
                    let user = new User(Object.assign({token,openid,session_key,avatarUrl,city,country,province,nickName,regType},{userId:_Id*1}));
                    user = await user.save();
                    ctx.response.body = Object.assign({result: {token,regType,userId:_Id*1}}, constant.SUCCESS);
                } else if(regType*1===2){//如果是商家
                    let bususer = new Bus(Object.assign({token,openid,session_key,avatarUrl,city,country,province,nickName,regType},{businessId:_Id*1}));
                    bususer = await bususer.save();
                    ctx.response.body = Object.assign({result: {token,regType,businessId:_Id*1}}, constant.SUCCESS);
                }

            }
            return next();
        }catch (e) {
            ctx.body = error('reg', e);
            return next();
        }
};


const finishInfo = async (ctx,next) => {//商家完善信息
    try{
        const {businessTitle=null,userIphone=null,businessAds=null,longitude=null,latitude=null,businessId} = ctx.request.body;
        if(businessTitle&&userIphone&&businessAds&&longitude&&latitude&&businessId){
            await Bus.update({businessId},{businessTitle,userIphone,businessAds,longitude,latitude});
            ctx.response.body = constant.SUCCESS;
        }else{
            ctx.response.body = constant.RUNTIME_ERROR;
        }
        return next();
    }catch (e) {
        ctx.body = error('finishInfo', e);
        return next();
    }
}

const CheckOld = async (ctx,next) => {//检测是否是已经注册过的用户
    try{
        const { code } = ctx.request.body;
        const options = {
            method: 'POST',
            url: 'https://api.weixin.qq.com/sns/jscode2session?',
            formData: {
                appid: wx.appid,
                secret: wx.secret,
                js_code: code,
                grant_type: 'authorization_code'
            }
        };
        const _data = await koa2request(options);//请求微信开放平台获取session_key，openid
        const { body } = _data;
        const { session_key, openid } = JSON.parse(body);
        const _userinfo = await User.findOne({openid});
        const _businfo = await Bus.findOne({openid});

        if(_userinfo||_businfo){
            ctx.response.body = Object.assign({result: {oldUser:1}}, constant.SUCCESS);
        }else{
            ctx.response.body = Object.assign({result: {oldUser:0}}, constant.SUCCESS);
        }
        return next()
    }catch (e) {
        ctx.body = error('CheckOld', e);
        return next();
    }

}







module.exports = function(route){
    route.post("/server/wxAuthorize",wxAuthorize);
    route.post("/server/CheckOld",CheckOld);
    route.post("/server/finishInfo",finishInfo);
};
