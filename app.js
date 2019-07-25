const fs = require('fs');
const Koa = require('koa');
const app = new Koa();
const pkg = require('./package.json');
const Router = require('koa-router');
const router = new Router();
const log4js = require("./utils/logger");
const logger = log4js.getLogger(__filename.split("/").pop());
const koabody = require('koa-body');
const cors = require('koa2-cors');
const serve = require('koa-static');
const path = require('path');
const isLocal = process.env.LOCAL !== undefined;
const isProd = process.env.NODE_ENV === 'PRD';
const isPre = process.env.NODE_ENV === 'PRE';
const isDev = process.env.NODE_ENV === 'DEV';
const os = require('os');
const interfaces = os.networkInterfaces();
//const task = require('./utils/task');
const mq = require('./utils/mq');


//task.test1();
mq.mq1()

const IPv4 = ((interfaces) => {
    for (let devName in interfaces) {
        let iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
})(interfaces);

((path) => {
    fs.readdir(path, (err, files) => {
        if (!err) {
            files.forEach((item) => {
                let tmpPath = path + '/' + item;
                fs.stat(tmpPath, (err1, stats) => {
                    if (!err1 && !stats.isDirectory()) {
                        logger.info('load action :' + tmpPath);
                        require(tmpPath)(router)
                    }
                })
            });
        }
    });
})('./actions');


app.use(koabody({multipart: true,formidable: {
        maxFileSize: 200*1024*1024
    }})).use(cors()).use(async (ctx, next) => {//日志
    let requestStartTime = new Date();
    if(ctx.method==='GET'){
        logger.info(`${ctx.method}\t${ctx.url}\t${JSON.stringify(ctx.query)}`);
        await next();
    }else if(ctx.method==='POST'){
        //console.log(2223,ctx.request.files)
        logger.info(`${ctx.method}\t${ctx.url}\t${JSON.stringify(ctx.request.body)}`);
        await next();
    }
    logger.info(`use: ${ new Date() - requestStartTime }ms\treturn: ${JSON.stringify(ctx.response.body)}`);
}).use(router.routes()).use(router.allowedMethods()).on('error', app.onerror);
app.use(serve(path.join(__dirname + "/uploads")));
app.listen(pkg.port,()=>{
    logger.info(`${pkg.name} listen at ${IPv4}:${pkg.port} in ${process.env.NODE_ENV} , pid is ${process.pid}`)
});

module.exports = {
    pkg,
    IPv4
}