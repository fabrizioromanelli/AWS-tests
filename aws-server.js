var http = require('http');
var fs = require('fs');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');

// AWS
var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
//var cognitoidentityserviceprovider = new AmazonCognitoIdentity.CognitoIdentityServiceProvider();
global.fetch = require("node-fetch");

var userPool = [];
var attributeList = [];
var accessToken = [];
var currentUser = [];
var cognitoUser;
// AWS

var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));
app.use(urlencodedParser);
app.use(multer({ dest: '/tmp/'}).single('file'));

app.get('/index.htm', function (req, res) {
  res.sendFile( __dirname + "/" + "index.htm" );
});

app.get('/login.htm', function (req, res) {
  res.sendFile( __dirname + "/" + "login.htm" );
});

app.get('/userspace.htm', function (req, res) {
  res.sendFile( __dirname + "/" + "userspace.htm" );
});

// Process the GET for filling AWS Cognito forms for admin login
app.get('/process_admin', function (req, res) {
  // JSON format here
  var poolData = {
      UserPoolId : req.query.user_pool_id,
      ClientId : req.query.client_id
  };
  try {
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  }
  catch(err) {
    console.log(err.message);
    res.send( '<html><body><p>UserPoolId or ClientId are wrong!</p></body></html>' );
    return;
  }

  res.sendFile( __dirname + "/" + "signup.htm" );
});

// Process the GET for filling AWS Cognito forms for user login
app.get('/process_changepassword', function (req, res) {
  currentUser.changePassword(req.query.prev_password, req.query.new_password, function(err, result) {
    if (err) {
      console.log (err, err.stack);
      return;
    }
    console.log ('Call result ' + result);
  });

  res.sendFile( __dirname + "/" + "logout.htm" );
});

// Process the GET for AWS Cognito user logout
app.get('/process_logout', function (req, res) {
  if (currentUser != null) {
    currentUser.signOut();
    res.send( '<html><body><p>Successfully logged out!</p></body></html>' );
  }
});

// Process the GET for filling AWS Cognito forms for user login
app.get('/process_login', function (req, res) {
  // JSON format here
  var userData = {
    Username : req.query.user_name,
    Pool : userPool
  };
  var authenticationData = {
    Username : req.query.user_name,
    Password : req.query.password
  };
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  currentUser = new AmazonCognitoIdentity.CognitoUser(userData);
  currentUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      accessToken = result.getAccessToken().getJwtToken();
      console.log('Access granted!');
      res.sendFile( __dirname + "/" + "userspace.htm" );
    },

    onFailure: function (err) {
      console.log(err);
    },

    mfaRequired: function (codeDeliveryDetails) {
      var verificationCode = prompt('Please input verification code', '')
      currentUser.sendMFACode(verificationCode, this);
    }
  });
});

// Process the GET for filling AWS Cognito forms for confirmation
app.get('/process_confirmation', function (req, res) {
  // JSON format here
  var confirmationCode = {
    Name : 'confirmation_code',
    Value : req.query.confirmation_code
  };

  cognitoUser.confirmRegistration(confirmationCode.Value, true, function(err, result) {
      if (err) {
          console.log(err);
          res.send( '<html><body><p>Confirmation code is invalid!</p></body></html>' );
          return;
      }
      console.log('Call result: ' + result);
      res.sendFile( __dirname + "/" + "login.htm" );
  });
});

// Process the GET for filling AWS Cognito forms for sign up
app.get('/process_signup', function (req, res) {
  // JSON format here
  var givenName = {
    Name : 'given_name',
    Value : req.query.given_name
  };
  var dataEmail = {
    Name : 'email',
    Value : req.query.email
  };
  var dataPhoneNumber = {
    Name : 'phone_number',
    Value : req.query.phone_number
  };

  var attributeGivenName = new AmazonCognitoIdentity.CognitoUserAttribute(givenName);
  var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
  var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber);
  attributeList.push(attributeGivenName);
  attributeList.push(attributeEmail);
  attributeList.push(attributePhoneNumber);

  userPool.signUp(req.query.user_name, req.query.password, attributeList, null, function(err, result){
    if (err) {
      console.log(err);
      res.send( '<html><body><p>User name or password invalid format!</p></body></html>' );
      return;
    }
    cognitoUser = result.user;
    console.log('user name is ' + cognitoUser.getUsername() + ' and has been created!');
    res.sendFile( __dirname + "/" + "confirmation.htm" );
    });
});

var server = app.listen(8081, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("App listening at http://%s:%s", host, port);
})

// // Process the GET
// app.get('/process_get', function (req, res) {
//   // prepare output in JSON format
//   response = {
//     first_name:req.query.first_name,
//     last_name:req.query.last_name
//   };
//   console.log(JSON.stringify(response));
//   //res.end(JSON.stringify(response));
// });

// // Process the POST
// app.post('/process_post', urlencodedParser, function(req, res) {
//   // prepare output in JSON format
//   response = {
//     first_name:req.body.first_name,
//     last_name:req.body.last_name
//   };
//   console.log(JSON.stringify(response));
//   res.end(JSON.stringify(response));
// });
//
// // Process the POST for upload
// app.post('/file_upload', function(req, res) {
//   console.log(req.file.originalname);
//   console.log(req.file.path);
//   console.log(req.file.mimetype);
//   var file = __dirname + "/files/" + req.file.originalname;
//
//   fs.readFile( req.file.path, function (err, data) {
//      fs.writeFile(file, data, function (err) {
//         if( err ) {
//            console.log( err );
//            } else {
//               response = {
//                  message:'File uploaded successfully',
//                  filename:req.file.name
//               };
//            }
//
//         console.log( response );
//         res.end( JSON.stringify( response ) );
//      });
//   });
// });

// // Create a server
// http.createServer( function (request, response) {
//    // Parse the request containing file name
//    var pathname = url.parse(request.url).pathname;
//
//    // Print the name of the file for which request is made.
//    console.log("Request for " + pathname + " received.");
//
//    // Read the requested file content from file system
//    fs.readFile(pathname.substr(1), function (err, data) {
//       if (err) {
//          console.log(err);
//
//          // HTTP Status: 404 : NOT FOUND
//          // Content Type: text/plain
//          response.writeHead(404, {'Content-Type': 'text/html'});
//       } else {
//          //Page found
//          // HTTP Status: 200 : OK
//          // Content Type: text/plain
//          response.writeHead(200, {'Content-Type': 'text/html'});
//
//          // Write the content of the file to response body
//          response.write(data.toString());
//       }
//
//       // Send the response body
//       response.end();
//    });
// }).listen(8081);
//
// // Console will print the message
// console.log('Server running at http://127.0.0.1:8081/');
