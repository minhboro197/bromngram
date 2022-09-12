const {pool}  = require("../database.js");
var bodyParser = require('body-parser');
require('dotenv').config()
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');

exports.add_playlist = (req, res) => {
    var title = req.body.title;
    var playlist_description = req.body.playlist_description;

    var accessToken = req.body.accessToken;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        pool.getConnection(function(err, conn){
            if(err){
                console.log("aaaaaa")
                res.status(400).send("can't connect to the database")
            }
            conn.query(getUserId, function(err, result) {
                if(err){
                    console.log(err)
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    var data = {
                        title: title,
                        playlist_description: playlist_description,
                        user_id: result[0].id
                    }
                    
                    var query = "INSERT INTO `playlist_owner` SET ?"
                    conn.query(query,[data] , function(err, result) {
                        if(err){
                            res.status(400).send(err["sqlMessage"]);
                            return;
                        }
                        res.send(result);
                    })
                conn.release();
            })
        })
    })
};

exports.delete_playlist = (req, res) =>{
    var id = req.query.playlist_id;

    var accessToken = req.body.accessToken;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);

    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        pool.getConnection(function(err, conn){
            if(err){
                console.log("aaaaaa")
                res.status(400).send("can't connect to the database")
            }
            conn.query(getUserId, function(err, result) {
                if(err){
                    console.log(err)
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    var query = "DELETE FROM `playlist_owner` WHERE id = " + id + " and user_id = " + result[0].id;
                    conn.query(query, function(err, result) {
                        if(err){
                            res.status(400).send(err["sqlMessage"]);
                            return;
                        }
                        res.send(result);
                    })
                conn.release();
            })
        })
    })
};

exports.update_playlist = (req, res) => {
    var playlist_id = req.query.playlist_id;
    var title = req.body.title;
    var playlist_description = req.body.playlist_description;

    var accessToken = req.body.accessToken;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return;
            }
            conn.query(getUserId, function(err, result) {
                if(err){
                    console.log(err)
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    var data = {
                        title: title,
                        playlist_description: playlist_description
                    }
                    
                    var query = "UPDATE `playlist_owner` SET ? WHERE id = ? and user_id = ?"
                    conn.query(query,[data, playlist_id, result[0].id] , function(err, result) {
                        if(err){
                            res.status(400).send(err["sqlMessage"]);
                            return;
                        }
                        res.send(result)
                    })
                conn.release();
            })
        })
    })
};

exports.get_playlist_user = (req, res) =>{
    var accessToken = req.body.accessToken;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        searchUser = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        listPlaylist = "SELECT * FROM `playlist_owner` WHERE user_id = (" + searchUser + ")";

        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(listPlaylist, function(err, rows) {
                if(err){
                    res.status(400).send(err["sqlMessage"])
                    return
                }
                res.send(rows)
                conn.release();
            })
        })
    })
};