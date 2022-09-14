const mysql = require('mysql')
const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connection = mysql.createPool({
    host: process.env.HOST_DATABASE,
    port: process.env.PORT_DATABASE,
    database: process.env.DATABASE_BASE,
    user : process.env.USER_DATABASE,
    password: process.env.PASSWORD_DATABASE
});

exports.pool = connection;
