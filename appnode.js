const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3Client.js");
const {pool}  = require("./database.js");
const {uploadFile} = require('./uploadfile.js');

var bodyParser = require('body-parser')

function listBucket(){
    const run = async () =>{
        try{
            const data = await s3Client.send(new ListBucketsCommand({}));
            console.log("Success", data.Buckets);
        }catch(err) {
            console.log("error");
        }
    };
    run();
}


function uploadSongDetails(Id ,title, artist, genre, yearofrelease, imgLink, s3Link){
    imgDest = "coverImg/" + imgLink;
    s3Dest = "music/" + s3Link;
    var query = "INSERT INTO `song` (title, artist, genre, yearout, coverimg, s3link )"
    var values = " VALUES(\"" + title + "\", \"" +  artist + "\", \"" + genre + "\", " +  yearofrelease + ", \"" + imgDest +"\", \"" + s3Dest +"\");"
    var finalquery = query + values;
    
    pool.getConnection( function(error, connection) {
        if(error){
            throw error;
        }else{
            connection.query(finalquery , function (err, result, fields) {
                if (err) throw err;
                console.log("ok check your databse");
                connection.release();
            })
        }
    });
}


function uploadHandler(file, img, fileData, filename, imgName){
    uploadFile(file, img, filename, imgName);
    uploadSongDetails(fileData.id ,fileData.title, fileData.artist, fileData.genre, fileData.year, imgName, filename );
}

function validInput(input){
    if(input != undefined && input != ''){
        return true;
    }
    return false;
}

const multer = require('multer');
const upload = multer({dest: 'uploads/'})


var express = require('express');

var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static(__dirname))

const multerupload =  upload.fields([{name: "music", maxCount: 1}, {name: "cover", maxCount: 1}]);

app.post('/upload', (req, res) => {
    multerupload(req, res, function(error){
        if(error instanceof multer.MulterError){
            console.log("okayasdadsadsa")
            res.status(404).send('Sorry, something wrong');
        }else{
            const file = req.files['music'][0];
            const img = req.files['cover'][0];
            const fileName = file.originalname;
            const imgName = img.originalname;
            const fileData = req.body;
            console.log(fileName);
            console.log(imgName);
            uploadHandler(file, img, fileData, fileName, imgName);
            res.send("ok")
        }
    })
})

app.get('/song/queryall/:pagesize/:pagenum', (req, res) =>{
    var input =req.query.input;
    var isnum = /^\d+$/.test(input);

    var pagesize = req.params.pagesize;
    var pagenum = req.params.pagenum -1;

    if(pagesize < 0 || pagenum < 0){
        res.status(404).send("Not found, wrong pagesize or pagenum");
        return
    }

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries");
        return
    }

    var query = "SELECT * FROM `song` WHERE title like '%"+ input +"%' or artist like '%"+ input +"%' or genre like '%"+ input +"%'";
    var pagination = "LIMIT " + pagesize + " OFFSET " + pagenum * pagesize;
    if(isnum){
        var queryAdd =  query + "or yearout = " + input + " " + pagination;

        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(queryAdd, function(err, rows) {
                if(err){
                    res.send(err["sqlMessage"])
                    return
                }
                 res.send(rows);
                 conn.release();
            })
        })

    }else{
        var queryAdd = query + pagination;

        pool.getConnection(function(err, conn){
            if(err){
                res.status(400).send("can't connect to the database")
                return
            }
            conn.query(queryAdd, function(err, rows) {
                if(err){
                    res.send(err["sqlMessage"])
                    return
                }
                 res.send(rows);
                 conn.release();
            })
        })

    }
})

app.get('/song/queries/:pagesize/:pagenum', (req, res) =>{
    let title = req.query.title;
    var artist = req.query.artist;
    var genre = req.query.genre;
    var year = req.query.year;

    var pagesize = req.params.pagesize;
    var pagenum = req.params.pagenum -1;

    if(pagesize < 0 || pagenum < 0){
        res.status(404).send("Not found, wrong pagesize or pagenum");
        return
    }

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries")
        return
    }

    var pagination = "LIMIT " + pagesize + " OFFSET " + pagenum * pagesize;

    var hasQueries = false;
    var conditions = '';
    if(title != undefined && artist != ''){
        conditions += "title like '%"+ title +"%'";
        hasQueries = true;
    }
    if(artist != undefined && artist != ''){
        if(hasQueries){
            conditions += "and ";
        }
        conditions += "artist like '%"+ artist +"%'";
        hasQueries = true;
    }
    if(genre != undefined && genre != ''){
        if(hasQueries){
            conditions += "and ";
        }
        conditions += "genre like '%"+ genre +"%'";
        hasQueries = true;
    }
    if(year != undefined && year != ''){
        if(hasQueries){
            conditions += "and ";
        }
        conditions += "yearout = " + year;
    }

    var query = "SELECT * FROM `song`"
    if(conditions != ''){
        query += " WHERE " + conditions + " "+ pagination;

            pool.getConnection(function(err, conn){
                if(err){
                    res.status(400).send("can't connect to the database")
                    return
                }
                conn.query(query, function(err, rows) {
                    if(err){
                        res.send(err["sqlMessage"])
                        return
                    }
                     res.send(rows);
                     conn.release();
                })
            })
            
        return
    }else{
        res.send("wrong query")
        return
    }
    
   
})

app.put("/song/updatelike", (req, res) =>{
    var id = req.query.song_id;

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries");
        return
    }

    var getLikeQuery = "SELECT song_like FROM `song` WHERE id = ?"
    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(getLikeQuery,[id] , function(err, like) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return;
            }
            
            var query = "UPDATE `song` SET song_like = ? WHERE id = ?";
            conn.query(query,[like[0].song_like +1, id] , function(err, result) {
                if(err){
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
            })

            res.send("ok");
            conn.release();
        })
    })
})

app.put("/song/updateview", (req, res) =>{
    var id = req.query.song_id;

    if(Object.keys(req.query).length == 0){
        res.status(400).send("Missing queries");
        return
    }

    var getLikeQuery = "SELECT song_view FROM `song` WHERE id = ?"
    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(getLikeQuery,[id] , function(err, view) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return;
            }
            var query = "UPDATE `song` SET song_view = ? WHERE id = ?";
            conn.query(query,[view[0].song_view +1, id] , function(err, result) {
                if(err){
                    res.status(400).send(err["sqlMessage"]);
                    return;
                }
            })
            res.send("ok");
            conn.release();
        })
    })

})

//Create playlist
app.post("/playlist", (req, res) =>{
    var query = "INSERT INTO `playlist_owner` SET ?";
    var data = req.body;

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query,[data] , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return;
            }
            res.send("ok");
            conn.release();
        })
    })

})

// Update Playlist
app.put("/playlist", (req, res) => {
    var data = req.body;
    var user_id = req.query.user_id;
    var playlist_id = req.query.playlist_id;
    var query = "UPDATE `playlist_owner` SET ? WHERE id = ? and user_id = ?"

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query, [data,playlist_id, user_id] , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"]);
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})

// Delete playlist
app.delete("/playlist", (req, res) =>{
    var id = req.query.playlist_id;
    var user_id = req.query.user_id;
    var query = "DELETE FROM `playlist_owner` WHERE id = " + id + " and user_id = " + user_id;
    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query , function(err, rows) {
            if(err){
                res.send(err["sqlMessage"])
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})


// list playlist and list song from playlist
app.get("/playlist/:method/:userid", (req, res) =>{
    //get user id from user email?
    var id = req.params.userid;
    var method = req.params.method;
    var playlistid = req.query.playlist_id;

    query = '';
    searchUser = "SELECT id FROM `user` WHERE id = " + id;
    if(method == "list"){
        listPlaylist = "SELECT * FROM `playlist_owner` WHERE user_id = (" + searchUser + ")";
        query = listPlaylist;
    }else if(method == "listsong"){
        if(!validInput(playlistid)){
            res.send('invalid id')
            return
        }
        getPlaylistId = "SELECT id FROM `playlist_owner` WHERE id = "+ playlistid +" and user_id = (" + searchUser + ")";
        listPlaylistSong = "SELECT song_id FROM `playlist_song` WHERE playlist_owner_id = (" + getPlaylistId + ")";
        getSongDetails = "SELECT * FROM `song` WHERE id IN (" + listPlaylistSong + ")";
        query = getSongDetails;
    }

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query, function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"])
                return
            }
            res.send(rows)
            conn.release();
        })
    })
})

//put song to playlist
app.post("/playlist/song", (req, res) =>{
    var data = req.body;
    var query = "INSERT INTO `playlist_song` SET ?"

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query,[data] , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"])
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})

// delete song from playlist
app.delete("/playlist/song", (req, res) => {
    var songId = req.query.song_id;
    var playlistid = req.query.playlist_id
    var query = "DELETE FROM `playlist_song` WHERE song_id = " + songId + " and playlist_owner_id = "+ playlistid;

    pool.getConnection(function(err, conn){
        if(err){
            res.status(400).send("can't connect to the database")
            return
        }
        conn.query(query , function(err, rows) {
            if(err){
                res.status(400).send(err["sqlMessage"])
                return
            }
            res.send("ok")
            conn.release();
        })
    })
})

app.post("/confirm", (req, res) => {
    var confirmCode = req.body.confirm_code;

    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: 'MinhVu2',
        Pool: userPool,
    };
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {
        if (err) {
            console.log(err.message || JSON.stringify(err));
            res.status(400).send("Can't not cofirm user")
            return;
        }
        console.log('call result: ' + result);
        res.send("Confirm successfully")
    });

})


var AmazonCognitoIdentity = require('amazon-cognito-identity-js');

function testCognito(){
    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var attributeList = [];
    
    var dataEmail = {
        Name: 'email',
        Value: 'minhboro2@gmail.com',
    };
    
    var dataPhoneNumber = {
        Name: 'phone_number',
        Value: '+15555555555',
    };
    var dataBirth = {
        Name: 'birthdate',
        Value: '1999-09-09',
    }
    var dataGender = {
        Name: 'gender',
        Value:'male',
    }

    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(
        dataPhoneNumber
    );
    var attributeBirth = new AmazonCognitoIdentity.CognitoUserAttribute(dataBirth);
    var attributeGender = new AmazonCognitoIdentity.CognitoUserAttribute(dataGender);

    
    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);
    attributeList.push(attributeBirth);
    attributeList.push(attributeGender);

    
    userPool.signUp('MinhVu2', 'Minh123456!', attributeList, null, function(
        err,
        result
    ){
        if (err) {
            console.log(err.message || JSON.stringify(err));
            return;
        }
        var cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());
    });
}

var AWS = require("aws-sdk");
function loginUserSession(){
    var authenticationData = {
        Username: 'MinhVu2',
        Password: 'Minh123456!',
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        authenticationData
    );
    var poolData = {
        UserPoolId: 'ap-southeast-1_PFUux5qaA', // Your user pool id here
        ClientId: '3rfeiefhfq1c0qi0itfe4tdl50', // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: 'MinhVu2',
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            var accessToken = result.getAccessToken().getJwtToken();
    
            //POTENTIAL: Region needs to be set if not already set previously elsewhere.
            AWS.config.region = 'ap-southeast-1';
    
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'ap-southeast-1:a1bd5688-cc6b-4067-9f86-dbe564f6709c', // your identity pool id here
                Logins: {
                    // Change the key below according to the specific region your user pool is in.
                    'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                        .getIdToken()
                        .getJwtToken(),
                },
            });
            console.log(accessToken)
            console.log(new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'ap-southeast-1:a1bd5688-cc6b-4067-9f86-dbe564f6709c', // your identity pool id here
                Logins: {
                    // Change the key below according to the specific region your user pool is in.
                    'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                        .getIdToken()
                        .getJwtToken(),
                },
            }))

    
            //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
            AWS.config.credentials.refresh(error => {
                if (error) {
                    console.error(error);
                } else {
                    // Instantiate aws sdk service objects now that the credentials have been updated.
                    var s3 = new AWS.S3();
                    s3.listBuckets(function(err, data) {
                        if (err) {
                            console.log("What the fuc")
                          console.log("Error", err);
                        } else {
                          console.log("Success", data.Buckets);
                        }
                      });
                    console.log('Successfully logged!');
                }
            });
        },
    
        onFailure: function(err) {
            console.log("here?")
            console.log(err.message || JSON.stringify(err));
        },
    });
}


var server = app.listen(3000, ()=>{
    console.log('running on: ', server.address().port)
    //loginUserSession();
    //testCognito();
    //listBucket();
})

