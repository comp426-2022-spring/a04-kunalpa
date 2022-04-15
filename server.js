var minimist = require('minimist');
var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
const db = require("./database.js");

const app = express()

// Make Express use its own built-in body parser for both urlencoded and JSON body data.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var argument = minimist(process.argv.slice(2));
var name = 'port';
const HTTP_PORT = argument[name] || 5555;

// Create my server
const server = app.listen(HTTP_PORT, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',HTTP_PORT))
});

// if run server.js with option --help, should only show the below
// and exit with code 0
const help = (`
server.js [options] 
  --por		Set the port number for the server to listen on. Must be an integer
                between 1 and 65535.  
  --debug	If set to true, creates endlpoints /app/log/access/ which returns
              	a JSON access log from the database and /app/error which throws 
              	an error with the message "Error test successful." Defaults to  
		false.  
  --log		If set to false, no log files are written. Defaults to true.
		Logs are always written to database.
  --help	Return this message and exit.     
`); 
             
// If --help or -h, echo help text to STDOUT and exit
if (argument.help || argument.h) {
    console.log(help)
    process.exit(0)
}
// If --log=false is passed when running server.js, do not create a log file
// otherwise, create a log file called access.log
if (argument.log == true) {
    // Use morgan for logging to files
    // Create a write stream to append (flags: 'a') to a file
    const mylog = fs.createWriteStream('access.log', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('combined', { stream: mylog }))
}
else {
    app.use(morgan('combined'))
}

app.use((req, res, next) => {
    let logdata = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referer: req.headers['referer'],
      useragent: req.headers['user-agent']
    }

    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    
    next();
})

app.get('/app/log/access', (req, res) => {
    const stmt = db.prepare('SELECT * FROM accesslog').all()
    res.status(200).json(stmt) })

app.get('/app/error', (req, res) => { throw new error ('Error test successful') })


// Check status code endpoint
app.get('/app/', (req, res) => {
    res.statusCode = 200;
    res.statusMessage = 'OK';
    res.writeHead(res.statusCode, { 'Content-Type' : 'text/plain'});
    res.end(res.statusCode+ ' ' +res.statusMessage) });

// If not recognized request (other requests)
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});