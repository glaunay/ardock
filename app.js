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
var oParticule = require('./js/omg-particle');

//var d3=require('d3');


var css = require('./app.css');

//var $ = require('jquery');
//var jQuery = require('jquery');
//window.$ = $;
var bootstrap = require('bootstrap');
//bootstrap.jQuery = $;


//////////////////////////////////////////////////////////////////  SEVER REQUEST ///////////////////////////////////////////////////////////////////////////
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
            console.log(pdbObjInp.model(1).dump());
        });
});
socket.on("arDockStart", function(data) {
    console.log('starting ardock task ' + data.id + ' over ' + data.total + ' probes');
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//$('body').append('<div class="btn btn-primary">PUSH me JS</div>\n');

/*$('div').button('toggle').addClass('fat')
        .on("click", function(){oParticule.display();});*/


$(function(){
    //Upload Change
    var upload = function(input, widget) {
        
        var waitLoader = widgets.loader({root: $('.tab-content')});
        waitLoader.display();

        var file,
              lCount = 0;
        
        if(input.files){//Si le fichier provient d'un input
            file = input.files;
        } else{
            file = input;
        } 
       

        for(i=0; i < file.length; i++){

            (function(f,F){
               
                var reader = new FileReader();
               
                $(reader)
                .on('load', function() {
                        waitLoader.display();
                        //console.log('Contenu du fichier "' + input.files[0].name + '" :\n\n' + reader.result);
                        var s = stream.Readable();
                        s.push(reader.result, 'utf-8');
                        s.push(null);

                        var pdbParse = pdbLib.parse({ 'rStream' : s })
                            .on('end', function(pdbObjInp) {
                    
                                    if(lCount === (F - 1)){waitLoader.hide();}
                                    else{ lCount++}

                                    var navDT = displayTabs.addTab({fileName : f.name, pdbObj : pdbObjInp});
                            
                                    var pS = widgets.pdbSummary({fileName : f.name, pdbObj : pdbObjInp, root: $('#' + navDT.name)});
                                    pS.display();
                                    pS.on('submit', send);
                         });
                });
                reader.readAsText(f);
            })(file[i],file.length);
        }  
    };


    //Header Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var header = widgets.header();
    //Tabs Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var displayTabs = widgets.displayTabs();
    displayTabs.display();

    //Upload Display
    var uploadBox = widgets.uploadBox({root: $('#divAddFile')});
    uploadBox.on('change', upload);
    
    //Submit
    var send = function(pdbObj) {
        socket.emit('ardockPdbSubmit', pdbObj.dump());
    }


//##########################################################DRAG DROP############################

     
//#####################################################################################################
    });


    /*socket.on('news', function (data) {
        console.log(data);
        console.log("client side emitting");
        socket.emit('ardock openStream', {"data" : "ardock openStream"});
    });*/






