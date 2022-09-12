const {pool}  = require("../database.js");
var bodyParser = require('body-parser');
require('dotenv').config()
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');

exports.add_song_to_playlist = (req, res) => {
    var playlist_id = req.body.playlist_owner_id;
    var song_id = req.body.song_id;

    var accessToken = req.body.accessToken;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return;
            }
            var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
            var confirmPlaylistId = "SELECT * FROM `playlist_owner` WHERE id = ? and user_id = (" + getUserId +")"
            conn.query(confirmPlaylistId,[playlist_id], function(err, result) {
                if(err){
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    if(result.length != 0){
                        var query = "INSERT INTO `playlist_song` SET ?"
                        var data = {
                            song_id: song_id,
                            playlist_owner_id: playlist_id
                        }
                        conn.query(query,[data], function(err, result) {
                            if(err){
                                res.status(400).send(err["sqlMessage"]);
                                return;
                            }
                            res.send(result);
                        })
                    }else{
                        res.status(404).send("No such playlist from this user")
                        return
                    }
                    
                conn.release();
            })
        })
    })

};

exports.delete_song_from_playlist = (req, res) => {
    var songId = req.query.song_id;
    var playlist_id = req.query.playlist_id;

    var accessToken = req.body.accessToken;
    var jwk = JSON.parse(process.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return;
            }
            var getUserId = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
            var confirmPlaylistId = "SELECT * FROM `playlist_owner` WHERE id = ? and user_id = (" + getUserId +")"
            conn.query(confirmPlaylistId,[playlist_id], function(err, result) {
                if(err){
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
                    if(result.length != 0){

                        var query = "DELETE FROM `playlist_song` WHERE song_id = " + songId + " and playlist_owner_id = "+ playlist_id;

                        conn.query(query, function(err, result) {
                            if(err){
                                res.status(400).send(err["sqlMessage"]);
                                return;
                            }
                            res.send(result)
                        })
                    }else{
                        res.status(404).send("No such playlist from this user")
                        return
                    }
                    
                conn.release();
            })
        })
    })
};

exports.list_song_from_playlist = (req, res) => {
    var accessToken = req.body.accessToken;
    var playlistid = req.query.playlist_id;


    var jwk = process.env.JWk;
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }
        searchUser = "SELECT id FROM `user` WHERE username = '" + decoded.username + "'";
        getPlaylistId = "SELECT id FROM `playlist_owner` WHERE id = "+ playlistid +" and user_id = (" + searchUser + ")";
        listPlaylistSong = "SELECT song_id FROM `playlist_song` WHERE playlist_owner_id = (" + getPlaylistId + ")";
        getSongDetails = "SELECT * FROM `song` WHERE id IN (" + listPlaylistSong + ")";

        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(getSongDetails, function(err, rows) {
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


