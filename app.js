window.$ = window.jQuery = require('jquery');
//var Promise = require("bluebird")
var Backbone = require('backbone');
Backbone.$ = $;
var io = require('socket.io-client/socket.io.js');
var socket = io.connect('http://ardock.ibcp.fr');
//var socket = io.connect('http://92.222.65.71:3000');

//var ss = require('socket.io-stream');

var pdbLib = require("pdb-lib");
var stream = require('stream');
var events = require('events');
var widgets = require('./web/js/widgets');

//var oParticule = require('./js/omg-particle');

var css = require('./app.css');
var bootstrap = require('bootstrap');

//tLoader = require('./web/js/arLoader.js');


////////////////////////////////////////////////////////////////// GLOBAL ///////////////////////////////////////////////////////////////////////////////////
//var widgetsUtils = null;
WidgetUtils = null;

//////////////////////////////////////////////////////////////////  SEVER REQUEST ///////////////////////////////////////////////////////////////////////////
socket.on('news', function (data) {
    //console.log(data);
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
    //console.log(data.id);

    var s = stream.Readable();
    s.push(data.obj, 'utf-8');
    s.push(null);
    pdbLib.parse({
            'rStream': s
        })
        .on('end', function (pdbObjInp) {
            //console.log('this is ardock  chunk ' + pdbObjInp.model(1).selecSize());
            //console.log(pdbObjInp.model(1).dump());
            console.log('this is ardock  chunk ');
            console.dir(data);
            WidgetsUtils.jobOperations.onArdockChunck({pdbObj: pdbObjInp, uuid: data.uuid, probeMax : data.probeMax, left : data.left});
        });
    //socket.emit("arDockChunck", { 'obj' : pdbObj.model(1).dump(), 'left' : cnt, 'uuid' : uuid });

});
socket.on("arDockStart", function (data) {
    console.log('starting ardock task ');
    console.log(data)
    WidgetsUtils.jobOperations.onArdockStart(data);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//$('body').append('<div class="btn btn-primary">PUSH me JS</div>\n');

/*$('div').button('toggle').addClass('fat')
        .on("click", function(){oParticule.display();});*/


$(function () {


    //var fastaWidget = require('./Alignment.js');
    //fastaWidget.test();
    //fastaWidget.testSolo();

    //Upload Change
    var upload = function (input, widget) {

        var file,
            lCount = 0;
        var res;

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

            (function (f, F) {

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

                                //Slide the header description once
                                if( displayTabs.nbTabs === 1 && !WidgetsUtils.header.slided ){ header.slide() }

                                setTimeout(function(){ var navDT = displayTabs.addTab(opt) }, 1000 * lCount);

                                if (lCount === (F - 1)) {
                                    waitLoader.destroy();

                                } else {
                                    lCount++;
                                }
                            });
                    })
                    .on('loadend', function () {
                        if(waitLoader){ waitLoader.destroy() }
                    });

                reader.readAsText(f);

            })(file[i], file.length);
        }

    };


    //Header Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var header = widgets.header();

    //Footer Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var footer = widgets.footer();

    //Tabs Display//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var displayTabs = widgets.displayTabs({
        skt: socket
    });
    displayTabs.display();

    //fill some component to WidgetUtils
   /* widgetsUtils = displayTabs.widgetsUtils;
    widgetsUtils.stream = stream;
    widgetsUtils.pdbLib = pdbLib;
    widgetsUtils.displayTabs = displayTabs;
    widgetsUtils.header = header;*/
    //WidgetsUtils.header = header;

    WidgetsUtils = displayTabs.widgetsUtils;
    WidgetsUtils.stream = stream;
    WidgetsUtils.pdbLib = pdbLib;
    WidgetsUtils.displayTabs = displayTabs;
    WidgetsUtils.header = header;


    $( document )
        .on( "mousemove", function( event ) {
            WidgetsUtils.mousePagePosition.x = event.pageX;
            WidgetsUtils.mousePagePosition.y = event.pageY;
        })
        .on( "click", function( event ) {

        })
    ;


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
