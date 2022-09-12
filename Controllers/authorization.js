var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var AWS = require("aws-sdk");
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
require('dotenv').config()

exports.refresh_token = (req, res) => {
    var refresh_Token = req.body.refreshToken;
    var params = {
        AuthFlow: "REFRESH_TOKEN_AUTH", /* required */
        ClientId: process.env.CLIENT_ID, /* required */
        AuthParameters: {
          'REFRESH_TOKEN': refresh_Token,
        }
      };
      var cognito = new AWS.CognitoIdentityServiceProvider();
      cognito.initiateAuth(params, function(err, data) {
        if (err){
            res.status(400).send(err)
            return
        }
        else {
            res.send(data);
        }
    });
}

exports.get_presigned_url = (req, res) => {

    var accessToken = req.body.accessToken;
    var fileName = req.query.filename;
    var jwk = JSON.parse(.env.JWk);
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send("Invalid Token")
            return
        }
        var poolData = {
            UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
            ClientId: process.env.CLIENT_ID, // Your client id here
        };
        var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        
        var userData = {
            Username: decoded.username,
            Pool: userPool,
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.getSession((err, result) =>{
            if(result){
                AWS.config.region = 'ap-southeast-1';

                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: process.env.IDENTITY_POOL_ID, // your identity pool id here
                    Logins: {
                        // Change the key below according to the specific region your user pool is in.
                        'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                            .getIdToken()
                            .getJwtToken(),
                    },
                });
 
                AWS.config.credentials.refresh(error => {
                    if (error) {
                        console.error(error);
                    } else {
                        var s3 = new AWS.S3();
                        var params = {Bucket:'mybucketapp', Key: fileName, Expires: 300};
                        s3.getSignedUrl('getObject', params, function (err, url) {
                            if(err){
                                res.status(404).send("No File Found")
                                return;
                            }else{
                                res.send({key:url })
                            }
                        });
                    }
                });
            }else{
                res.status(400).send("User signed out")
                return
            }
        })
    })
}