//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
console.log(fs);

var router = express();
var options = {
   key  : fs.readFileSync('server.key'),
   cert : fs.readFileSync('server.crt')
};
var server = https.createServer(options, router);
var http_server = http.createServer(router);
router.use(cors());
router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); 

router.use(express.static(path.resolve(__dirname, 'client')));

require('./server/router/router')(router); 


  


http_server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = http_server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
