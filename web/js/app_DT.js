window.$ = window.jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var request = require('request');
var css = require('./app_DT.css');


var arDT = require('./arDockTable_DVL.js');

var arDL = require('./arDockDl.js');

$('body').append('<div class="btn btn-primary">Test ARDOCK table</div>\n');

/*
$('body').append('<div class="ardockDLctrl">'
                + '<div class="btn-group">'
                + '<div class="btn btn-primary cuPEND"><img width="125px" src="assets/END_awesome.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL"><i class="fa fa-cloud-download fa-5x"></i></div>'
                + '</div>'
                + '<div class="btn-group" style="margin-top:4px">'
                + '<div class="btn btn-primary cuPdbDl" style="padding : 13px 12px 13px 12px"><img width="125px" src="assets/pdb.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL" style="padding: 4px 32px 5px 32px;"><i class="fa fa-file-excel-o fa-5x"></i></div>'
                + '</div>'
                + '</div>');

$('div.ardockDLctrl .cuPdbDl').mouseout(function(){
    $(this).find('img').attr("src","assets/pdb.png");
    });

$('div.ardockDLctrl .cuPdbDl').mouseover(function(){
    console.log("titi");
    $(this).find('img').attr("src","assets/pdb_alt.png");
});
$('div.ardockDLctrl .cuPEND').mouseout(function(){
    $(this).find('img').attr("src","assets/END_awesome.png");
    });

$('div.ardockDLctrl .cuPEND').mouseover(function(){
    console.log("titi");
    $(this).find('img').attr("src","assets/END_awesome_alt.png");
});


*/
pdbRef = null;
dtRef = null;
dlRef = null;
$(function () {

    $('body').append(
          '<div class="container">'
        + '<div class="row"><div class="col-md-8" id="innerDiv" style="padding-right:0px;background-color : pink; height:800px"></div>'
        + '<div class=".col-md-4" style="background-color : yellow; height:800px"></div>'
        + '</div></div>');

    request
    .get('http://ardock.ibcp.fr/scripts/test/1BRS.pdb')
    .on('response', function(response) {
        console.log('response Inc');


        //console.log(response.statusCode) // 200
        //console.log(response.headers['content-type']) // 'image/png'
        var content;
        response.on('data', function(data) {
            //console.log('received ' + data.length + ' bytes of compressed data');
           // data.toString("utf8").pipe(content);
           //console.log(data.toString());
            arDT.test(data).on("pdbLoad", function (pdbObj){
                pdbRef = pdbObj;
            })
            .on('load', function(oDt){
                dtRef = oDt;
                dlRef = arDL.new({'root' : '#innerDiv'});
            });
        //console.log(data.toString("utf8"));
        });
    })

    //request('scripts/test/1BRS.pdb', function (error, response, body) {
    //    if (!error && response.statusCode == 200) {
    //        console.log(body) // Show the HTML for the Google homepage.
    //    } else {
    //        console.log(response);
    //        console.log(body);
            //arDT.test();
    //    }
    //});

});