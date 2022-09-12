var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var AWS = require("aws-sdk");
require('dotenv').config()

exports.confirm_email = (req, res) => {
    var confirmCode = req.body.confirm_code;
    var username = req.body.username;

    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {
        if (err) {
            //console.log(err.message || JSON.stringify(err));
            res.status(400).send("Can't not cofirm user")
            return;
        }
        console.log('call result: ' + result);
        res.send("Confirm successfully")
    });
}

exports.register = (req, res) => {
    var email = req.body.email;
    var phone_number = req.body.phone_number;
    var birthdate = req.body.birthdate;
    var gender = req.body.gender;
    var username = req.body.username;
    var password = req.body.password;

    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var attributeList = [];
    
    var dataEmail = {
        Name: 'email',
        Value: email,
    };
    
    var dataPhoneNumber = {
        Name: 'phone_number',
        Value: phone_number,
    };
    var dataBirth = {
        Name: 'birthdate',
        Value: birthdate,
    }
    var dataGender = {
        Name: 'gender',
        Value: gender,
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

    userPool.signUp(username, password, attributeList, null, function(err,result){
        if (err) {
            res.status(400).send(err.message || JSON.stringify(err))
        }
        var cognitoUser = result.user;
        res.send("Register successfully username: "+cognitoUser.getUsername());
    });
}

exports.login = (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    var authenticationData = {
        Username: username,
        Password: password,
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        authenticationData
    );
    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            var accessToken = result.getAccessToken().getJwtToken();
            var refreshToken = result.getRefreshToken();
            var idToken = result.getIdToken().getJwtToken();
            
            AWS.config.region = 'ap-southeast-1';
    
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: process.env.IDENTITY_POOL_ID, // your identity pool id here
                Logins: {
                    'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                        .getIdToken()
                        .getJwtToken(),
                },
            });
    
            //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
            AWS.config.credentials.refresh(error => {
                if (error) {
                    console.error(error);
                } else {
                    var respond = {
                        accessToken: accessToken,
                        idToken: idToken,
                        refreshToken: refreshToken
                    }
                    res.send(respond)
                }
            });
        },
    
        onFailure: function(err) {
            res.status(400).send(err.message || JSON.stringify(err));
        },
    });
}

exports.signout = (req, res) => {
    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var userData = {
        Username: req.query.username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.getSession((err, result) =>{
        if(result){
            cognitoUser.globalSignOut({
                onSuccess: function(result){
                    console.log(result)
                },
                onFailure: function(err){
                    console.log(err)
                },
              });
        }
    })
    res.send("ok")
}

