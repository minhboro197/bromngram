const mysql = require('mysql')

const connection = mysql.createPool({
    host: "database-1.cjtpzxxfl4wr.ap-southeast-3.rds.amazonaws.com",
    port: "3306",
    database: "mydb",
    user : "admin",
    password: "Minh123456"
});

exports.pool = connection;