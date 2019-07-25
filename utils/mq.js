
const Test = require('../schema/test');
const amqp = require('amqplib');


module.exports = {

    mq1(){//mq消费者
        const fq = 'fq';//前端
        amqp.connect('amqp://127.0.0.1').then((conn) => {
            process.once('SIGINT', () => {//当进程检测到推出信号时，关闭RabbitMQ队列
                conn.close()
            })
            return conn.createChannel().then(async (ch) => {//连接通道
                ch.prefetch(1)//设置公平调度，这里是指rabbitmq不会向一个繁忙的队列推送超过1条消息。
                const ackSend = (msg, content) => {//消费fq队列后，回传消息给bq后端队列
                    ch.sendToQueue(msg.properties.replyTo, new Buffer(content.toString()), {
                        connectId: msg.properties.connectId
                    })
                    ch.ack(msg)//ack表示消息确认机制。这里我们告诉rabbitmq消息接收成功。
                }
                const reply = async (msg) => {//监听前端fq队列的消费函数

                    const userId = parseInt(msg.content.toString())
                    let count = await Test.count()
                    if (count > 100) {
                        return ackSend(msg, 'sold out')
                    } else {
                        //let result = await Test.create({userId: userId})
                        let result = new Test({userId});
                        result = await result.save();
                        if (result) {
                            return ackSend(msg, 'success, orderid:' + result._id.toString())
                        } else {
                            console.log('fail');
                        }
                    }
                }
                // 监听队列并消费
                await ch.assertQueue(fq, {durable: false})
                ch.consume(fq, reply, {noAck: false})
                console.log('wait for message');
            })
        })

    }

}


