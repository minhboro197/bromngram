const mysql = require('mysql')

const connection = mysql.createPool({
    host: "read.replica.local",
    port: "3306",
    database: "mydb",
    user : "admin",
    password: "Minh123456"
});

exports.poolreplica = connection;