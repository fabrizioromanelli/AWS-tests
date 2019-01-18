var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
global.fetch = require("node-fetch");

var poolData = {
    UserPoolId : '',
    ClientId : ''
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Sign up a new user
var attributeList = [];

// Required fields for the user
var givenName = {
  Name : 'given_name',
  Value : ''
};
var dataEmail = {
  Name : 'email',
  Value : ''
};
var dataPhoneNumber = {
  Name : 'phone_number',
  Value : ''
};
var attributeGivenName = new AmazonCognitoIdentity.CognitoUserAttribute(givenName);
var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber);
attributeList.push(attributeGivenName);
attributeList.push(attributeEmail);
attributeList.push(attributePhoneNumber);

var cognitoUser;
userPool.signUp('', '', attributeList, null, function(err, result){
    if (err) {
        console.log(err);
        alert(err);
        return;
    }
    cognitoUser = result.user;
    console.log('user name is ' + cognitoUser.getUsername());
});
