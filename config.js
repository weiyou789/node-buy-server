module.exports = {
    "DEV":{
        mongoUrl:'mongodb://localhost:3001/groupdb',
        opts:{
            server:{reconnectInterval: 3000, reconnectTries: 600, auto_reconnect: true,useMongoClient: true},
            user:'weiyou567',
            pass:'775852016'
        }
    }
}[process.env.NODE_ENV || "DEV"];