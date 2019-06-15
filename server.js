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
var app = new express();
var bodyParser = require('body-parser');
var cors = require('cors');
//var WebSocketServer = require('websocket').server;

// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//


var options = {
   key  : fs.readFileSync('server.key'),
   cert : fs.readFileSync('server.crt')
};
var server = https.createServer(options, app);
var http_server = http.Server(app);
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(path.resolve(__dirname, 'client')));

http_server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = http_server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

// var wsServer = new WebSocketServer({
//     httpServer: http_server
// });


 require('./server/router/router')(app); 
 


