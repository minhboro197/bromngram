const mysql = require('mysql')
require('dotenv').config()

const connection = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DATABASE,
    user : process.env.USER,
    password: process.env.PASSWORD
});

exports.pool = connection;
