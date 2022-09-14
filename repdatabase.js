const mysql = require('mysql')

const connection = mysql.createPool({
    host: "read.replica.local",
    port: process.env.PORT,
    database: process.env.DATABASE,
    user : process.env.USER,
    password: process.env.PASSWORD
});

exports.poolreplica = connection;
