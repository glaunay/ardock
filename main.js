window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;
var socket = require('socket.io-client')('ardock.ibcp.fr/io');


var oParticule = require('omg-particle')

//var d3=require('d3');


var css = require('./app.css');

//var $ = require('jquery');
//var jQuery = require('jquery');
//window.$ = $;
var bootstrap = require('bootstrap');
//bootstrap.jQuery = $;

$('body').append('<div class="btn btn-primary">PUSH me JS</div>\n');

$('div').each(function(){console.log("i see a button");}).button('toggle').addClass('fat')
        .on("click", function(){oParticule.display();});

socket.on('news', function (data) {
    console.log(data);
    console.log("client side emitting");
    socket.emit('ardock openStream', {"data" : "ardock openStream"});
});

/*
var data = [1, 2, 2, 3, 4, 5, 5, 5, 6];
console.log(data);
*/