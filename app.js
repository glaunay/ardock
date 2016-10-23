window.$ = window.jQuery = require('jquery');
var Promise = require("bluebird")
var Backbone = require('backbone');
Backbone.$ = $;
var io = require('socket.io-client/socket.io.js');
//var socket = io.connect('http://ardock.ibcp.fr');
var socket = io.connect('http://92.222.65.71:3000');

//var ss = require('socket.io-stream');




var pdbLib = require("pdb-lib");
var stream = require('stream');
var events = require('events');
var widgets = require('./widgets');
var oParticule = require('./js/omg-particle');



var css = require('./app.css');
var bootstrap = require('bootstrap');


////////////////////////////////////////////////////////////////// GLOBAL ///////////////////////////////////////////////////////////////////////////////////
var jobsOperations = {};


//////////////////////////////////////////////////////////////////  SEVER REQUEST ///////////////////////////////////////////////////////////////////////////
socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', {
        my: 'data'
    });
});
socket.on('connect', function () {
    console.log('Opening socket ...');
})

socket.on('greetings', function () {
    console.log('connected!');
    socket.emit('ardock openStream', {
        "Client Request": navigator.userAgent
    });
});

socket.on('ioPdbSubmissionTest', function (str) {
    console.log(str);
    console.log("gotcha!!");
});
socket.on('arDockChunck', function (data) {
    //console.log(str);
    //console.log(data.id);
    var s = stream.Readable();
    s.push(data.obj, 'utf-8');
    s.push(null);
    pdbLib.parse({
            'rStream': s
        })
        .on('end', function (pdbObjInp) {
            console.log('this is ardock  chunk ' + pdbObjInp.model(1).selecSize());
            console.log(pdbObjInp.model(1).dump());
        });
    //socket.emit("arDockChunck", { 'obj' : pdbObj.model(1).dump(), 'left' : cnt, 'uuid' : uuid });
    
});
socket.on("arDockStart", function (data) {
    console.log('starting ardock task ' + data.id + ' over ' + data.total + ' probes');
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//$('body').append('<div class="btn btn-primary">PUSH me JS</div>\n');

/*$('div').button('toggle').addClass('fat')
        .on("click", function(){oParticule.display();});*/


$(function () {

    //Upload Change
    var upload = function (input, widget) {

        //return new Promise(function(resolve, reject){

        var file,
            lCount = 0;
        var res;

        tabInfoFiles = new Array(); //empty the tab

        if (input.files) { //Si le fichier provient d'un input ou drag&drop
            file = input.files;
        } else {
            file = input;
        }

        if (file[0]) {
            var waitLoader = widgets.loader({
                root: $('.tab-content')
            });
            waitLoader.display();
        }

        for (i = 0; i < file.length; i++) { //Gestion de plusieurs fichiers

            (function (f, F, t) {

                var reader = new FileReader();

                $(reader)
                    .on('load', function () {
                        waitLoader.display();
                        
                        var s = stream.Readable();
                        s.push(reader.result, 'utf-8');

                        s.push(null);

                        var pdbParse = pdbLib.parse({
                                'rStream': s
                            })
                            .on('end', function (pdbObjInp) {
                                
                                var opt = {
                                    fileName: f.name,
                                    pdbObj: pdbObjInp,
                                    pdbText: reader.result
                                };
                                tabInfoFiles.push(opt);

                                if (lCount === (F - 1)) {
                                    waitLoader.destroy();
                                    for (i = 0; i < tabInfoFiles.length; i++) {
                                        console.log("OPT OBJECT : ");
                                        var navDT = displayTabs.addTab(tabInfoFiles[i]);
                                    }
                                } else {
                                    lCount++
                                }
                            });
                    })
                    .on('loadend', function () {

                    });

                reader.readAsText(f);

            })(file[i], file.length, tabInfoFiles);
        }

    };


    //Header Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var header = widgets.header();
    $("#header").on('resize', function(e){
       console.log("HEADER CHANGE !");
    });

    //Tabs Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var displayTabs = widgets.displayTabs({
        skt: socket
    });
    displayTabs.display();

    //Upload Display
    var uploadBox = widgets.uploadBox({
        root: $('#divAddFile')
    });
    uploadBox.on('change', upload);

});







/*socket.on('news', function (data) {
    console.log(data);
    console.log("client side emitting");
    socket.emit('ardock openStream', {"data" : "ardock openStream"});
});*/