window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;
var io = require('socket.io-client/socket.io.js');
//var socket = io.connect('http://ardock.ibcp.fr');
var socket = io.connect('http://server-A7V:3000');


//var ss = require('socket.io-stream');




var pdbLib = require("pdb-lib");
var stream = require('stream');
var events = require('events');
var widgets = require('./widgets');
var oParticule = require('omg-particle')

//var d3=require('d3');


var css = require('./app.css');

//var $ = require('jquery');
//var jQuery = require('jquery');
//window.$ = $;
var bootstrap = require('bootstrap');
//bootstrap.jQuery = $;



socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
});
socket.on('connect', function(){
    console.log('Opening socket ...');
})

socket.on('greetings', function () {
    console.log('connected!');
    socket.emit('ardock openStream', { "Client Request" : navigator.userAgent });
});

socket.on('ioPdbSubmissionTest', function (str) {
    console.log(str);
    console.log("gotcha!!");
});
socket.on('arDockChunck', function(data) {
    //console.log(str);
    var s = stream.Readable();
    s.push(data.obj, 'utf-8');
    s.push(null);
    pdbLib.parse({ 'rStream' : s })
        .on('end', function(pdbObjInp) {
            console.log('this is ardock  chunk ' + pdbObjInp.model(1).selecSize());
        });
});
socket.on("arDockStart", function(data) {
    console.log('starting ardock task ' + data.id + ' over ' + data.total + ' probes');
});

$('body').append('<div class="btn btn-primary">PUSH me JS</div>\n');

$('div').button('toggle').addClass('fat')
        .on("click", function(){oParticule.display();});

var upload = function(input, widget) {
    var reader = new FileReader();

    $(reader).on('load', function() {
        //console.log('Contenu du fichier "' + input.files[0].name + '" :\n\n' + reader.result);
        var s = stream.Readable();
        s.push(reader.result, 'utf-8');
        s.push(null);
        var pdbParse = pdbLib.parse({ 'rStream' : s })
        .on('end', function(pdbObjInp) {
            var pS = widgets.pdbSummary({fileName : input.files[0].name, pdbObj : pdbObjInp});
            pS.display();
            pS.on('submit', send);
        });
    });

    reader.readAsText(input.files[0]);
};

var uploadBox = widgets.uploadBox();
uploadBox.on('change', upload);

var send = function(pdbObj) {
    socket.emit('ardockPdbSubmit', pdbObj.dump());
}



    /*socket.on('news', function (data) {
        console.log(data);
        console.log("client side emitting");
        socket.emit('ardock openStream', {"data" : "ardock openStream"});
    });*/

/*
var data = [1, 2, 2, 3, 4, 5, 5, 5, 6];
console.log(data);
*/





