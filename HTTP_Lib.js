var express = require('express');
var favicon = require('serve-favicon');

var app = express();
app.use(favicon(__dirname + '/favicon.ico'));

var http = require('http').Server(app);
var io = require('socket.io')(http);

//var socket = require('socket.io-client')('http://localhost');


//var io = require('socket.io').(http);
//var ss = require('socket.io-stream');


var events = require('events');
var wget = require('wget-improved');
var stream = require('stream');
var timeout = require('connect-timeout');

var publicESPriptDir = null;

// Default rest callback, receives as arguments the http ans object (expresso : "res") and the data to process
var restCallBack = function (ans, data){
    var str = '';
    data.on('data', function(chunk) {
        str += chunk;
    });
    data.on('end', function() {
        str.toString();
        ans.send(str);
    });

    //console.log(data);
};

var ioPdbSubmissionRoute = function (data, uuid, socket) {
    console.log('Test ioPdbSubmissionRoute');
    return;
    var str = '';
    data.on('data', function(chunk) {
        str += chunk;
    });
    data.on('end', function() {
        str.toString();
        socket.emit('ioPdbSubmissionTest', str);
    });
};


var ioKeySubmissionRoute = function (key, socket) {
    console.log('test ioKeySubmissionRoute ' + key);
}

var ioESPriptRoute = function (key, pdbStream, socket) {
    console.log('test ioESPriptRoute ' + key);
}

var httpStart = function(bean, bIo, bTest, bRest) {

    var emitter = new events.EventEmitter();
    if (bIo) ioActivate();
    var staticPath = bean.httpVariables.rootDir;
    console.log("Configuring route end points");
    console.log("Serving at " + staticPath);

    app.use(timeout('120s'));
    app.use(haltOnTimedout);

    app.use(express.static(staticPath));


    // ESPRIPT CACHE SERVING
    publicESPriptDir = bean.httpVariables.domain + "/ESPript";
    staticPath = bean.httpVariables.espritDir;
    console.log("Serving ENDscript cache at " + staticPath);
    app.use("/ESPript", express.static(staticPath));

    if (bTest) {
        app.get('/test', function(req, res){
            var html = testTemplateGenerate();
            res.send(html);
        });

    } else {
        if (bIo) {
            app.get('/io', function(req, res){
                var html = baseTemplateGenerate();
                res.send(html);
            });
            app.get('/ioTest', function(req, res){
                var html = '<html><body><script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>'
                         + '<script>var socket = io.connect("ardock.ibcp.fr");'
                         + 'socket.on("news", function (data) {'
                         + 'console.log(data);'
                         + 'socket.emit("my other event", { "my": "data" });'
                         + '});</script></body></html>';
                res.send(html);
            });
        }
        if(bRest)
            app.get('/rest',restRoute);
    }
    function haltOnTimedout(req, res, next){
        if (!req.timedout) next();
    }
    http.listen(3000, function(){
        emitter.emit('listening');
        console.log('HTTP Server listening on *:3000');
    });
    return emitter;
};

var testTemplateGenerate = function () {
    var header = '<!DOCTYPE html><html class="ocks-org do-not-copy"><meta charset="utf-8">';
    var body = '<body><h1>HELLO GUYS !!!</h1>';
    var trailer = '</body></html>';

    return header + body + trailer;
}

var baseTemplateGenerate = function () {
    var header = '<!DOCTYPE html><html class="ocks-org do-not-copy"><meta charset="utf-8">'
                    +  '<head><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">'
                    + '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenLite.min.js"></script>'
                    + '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/utils/Draggable.min.js"></script>'
                    + '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/CSSPlugin.min.js"></script>'
                    + '</head>';
    var body = '<body>'
        + '<script src="js/bundleTest.js"></script>\n'
    var trailer = '</body></html>';

    return header + body + trailer;
}

var ioActivate = function (fn1) {

   /* io.on('connection', function (socket) {
        console.log('ping');
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
        console.log(data);
        });
    });

    return;
*/
    var emitter = new events.EventEmitter();
    console.log("Server side io socket activated");
    io.on('connection', function (socket) {
        console.log('io socket initial connection');

        socket.emit('greetings', { hello: 'world' });
        socket.on('ardock openStream', function (data) {
            console.log(data);
        });
        socket.on('ardockPdbSubmit', function (packet) {
            var uuid = packet.uuid;
            var data = packet.data;
            console.log('received ardockPdbSubmit event');
            var s = stream.Readable();
            s.push(data, 'utf-8');
            s.push(null);
            ioPdbSubmissionRoute(s, uuid, socket);
        });
        socket.on('keySubmission', function (key) {
            ioKeySubmissionRoute(key, socket);
        });
        socket.on('pdbStashESP', function (packet) {
            var uuid = packet.uuid;
            var data = packet.data;
            console.log('received pdbStashESP event');
            var s = stream.Readable();
            s.push(data, 'utf-8');
            s.push(null);
            ioESPriptRoute(uuid, s, socket);
        })

    });
}

var restRoute = function(req, res) {
        console.log("restRoute");
        console.log(req.path);

        var chainsID = [];
        if('chains' in req.query) {
            console.log("Asking for chains " + req.query.chains);
            chainsID = req.query.chains.split(',');
        }

        if('pdbCode' in req.query) {
            console.log("Asking for pdbCode " + req.query.pdbCode);
            var path = '/pdb/files/' + req.query.pdbCode + '.pdb';
            console.log("TO: " + path);

            var wgetReq = wget.request({ protocol: 'http',
                                         host: 'www.rcsb.org',
                                         path: path,
                                         method: 'GET'
                                        }, function(wgetRes) {

                var content = '';
                if (wgetRes.statusCode === 200) {
                    wgetRes.on('error', function(err) {
                        console.log(err);
                    });
                    wgetRes.on('data', function(chunk) {
                        content += chunk;
                    });
                    wgetRes.on('end', function() {
                        var s = stream.Readable();
                        s.push(content, 'utf-8');
                        s.push(null);
                        restCallBack(res, s, chainsID);
                    });
                } else {
                    console.log('Server respond ' + wgetRes.statusCode);
                }
            });
            wgetReq.end();
            wgetReq.on('error', function(err) {
                console.log(err);
            });
            /*
            var download = wget.download(src, output, options);
                download.on('error', function(err) {
                    console.log(err);
            });
            download.on('start', function(fileSize) {
                console.log(fileSize);
            });
            download.on('end', function(output) {
                console.log(output);
            });
            download.on('progress', function(progress) {
        // code to show progress bar
            });
            */
        }





    };


module.exports = {
    setRestCallBack : function (fn) { restCallBack = fn;},
    setIoPdbSubmissionCallback : function (fn_io) { ioPdbSubmissionRoute = fn_io;},
    setIoKeySubmissionCallback : function (fn_io) { ioKeySubmissionRoute = fn_io;},
    setIoESPriptSubmissionCallback : function (fn_io) { ioESPriptRoute = fn_io;},
    //restRoute : restRoute,
    ioActivate : ioActivate,
    baseTemplateGenerate : baseTemplateGenerate,
    httpStart : httpStart,
    ESPriptDirEndPoint : function(){return publicESPriptDir;}
    /*restCallBack : function(fn) {
        restCallBack = fn;
    },
    IoPdbSubmissionRoute : function(fn) {
        IoPdbSubmissionRoute = fn;
    }*/
};
