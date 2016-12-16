var stream = require('stream');
var pdbLib = require("pdb-lib");
var Bookmark = require('./Bookmarks.js').Bookmark;
var $  = require( 'jquery' );
var DataTable = require( 'datatables.net' )();
$.fn.DataTable = DataTable
var events = require('events');

var fs = require('fs'),
    byline = require('byline');


/*
var css = require('./app.css');
var bootstrap = require('bootstrap');
*/


/*
ardock dataTable initial draft
*/

// Fields display order
var fieldNames = ['resName', 'resSeq', 'chainID', 'tempFactor']
// Define a mapper to columnheaders



var arDockTable = function(opt) {
    console.log("ardockTable constructor");

    var nArgs = opt ? opt : {};

    Bookmark.call(this, nArgs);
    this.pdbRef = 'pdbObj' in nArgs ? nArgs['pdbObj'] : null;


    $(this.getNode()).addClass('ardockDT');
    //widgets.Core.call(this, nArgs);
}

arDockTable.prototype = Object.create(Bookmark.prototype);
//arDockTable.prototype = Object.create(widgets.Core.prototype);

arDockTable.prototype.constructor = arDockTable;

// Consumes a stream
arDockTable.prototype.read = function(dataArray) {


    var mapper = {
        'residue Name' : function(record) {
            var c = String(record[4])
            return c.replace(/ /g,'');
        },
        'residue Number' : function(record) {
            var c = String(record[6]) + String(record[7])
            return c.replace(/ /g,'');
        },
        'chain ID' : function (record) {
            return String(record[5]).replace(/ /g,'');
        },
        'Score' : function (record){
            //console.log("-->" + record[12]);
            return record[12];
            //return parseInt(record[13]);
        }

    };
    this.inputHeader = dataArray.shift();
    this.data = dataArray.map(function(e){
        return [ mapper['residue Name'](e),
                mapper['residue Number'](e),
                mapper['chain ID'](e),
                mapper['Score'](e) ];
    });
    this.header = ['residue Name', 'residue Number', 'chain ID', 'Score'];
    this.emiter.emit('parsed', this.data);
}


arDockTable.prototype.hook = function(pdbObj) {
    this.pdbRef = pdbObj;
}
arDockTable.prototype.download = function() {

    var filename="ardockResults.pdb";
    console.log(this.pdbRef.dump());

    var blob = new Blob([this.pdbRef.dump()], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            }
    }
}

arDockTable.prototype.exportToCsv = function (){
    console.log("CSV exporter");
    console.dir(this);
    var filename = "ardock_results.csv";
    var csvContent = this.data.map(function(e){
        return e.join(',');
    })
    csvContent.unshift(this.header.join(','));
    var blob = new Blob([csvContent.join("\n")], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            }
    }
}
/*
function exportToCsv(filename, rows) {
        var processRow = function (row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
*/

arDockTable.prototype.display = function(opt) {
        var self = this;

        var nArgs = opt ? opt : {};
        Bookmark.prototype.display.call(this);


        var parse = function(s) {
            if (s === "") return 0;
            return parseInt(String(s).replace('px', ''));
        }
        if ('pdbObj' in nArgs) {
            this.hook(nArgs['pdbObj']);
            this.read(nArgs['pdbObj'].model(1).name("CA").asArray());
        }

        //console.log( this.pdbRef.model(1).name("CA").dump());

        var cNode = this.getContentNode();
        $(cNode).addClass("datatableW");
        $(cNode).append('<table class="table table-striped table-bordered"></table>');

        $(cNode).find("table").append('<thead>' + '<tr><th colspan="3">Residue</th><th rowspan="2">Score</th></tr>' + '<tr><th>name</th><th>number</th><th>chain</th></tr></thead><tbody></tbody>');
        $tBody = $(cNode).find("table tbody");
        this.data.forEach(function(e) {
            var tr = e.join('</td><td>');
            tr = '<tr><td>' + tr + '</td></tr>';
            $tBody.append(tr);
        });
        console.log($(cNode).find("table"));

        var drawButtonDL = function (cNode){
             $(cNode).find('.dataTables_info').append(
                '<div class="cFooter"><div class="btn btn-primary xlDL btn-lg">' + '<i class="fa fa-file-excel-o fa-2x" aria-hidden="true"></i><span>Download</span></div></div>');
                $(cNode).find('.dataTables_info').css({
                            'float': 'none',
                            'padding': '5px 5px 5px 10px'
                        })
                $(cNode).find('.dataTables_info div.btn.xlDL').on("click", function(){self.exportToCsv();});
        };

        $(cNode).find("table").DataTable({
                drawCallback : function (){drawButtonDL( cNode )},
                initComplete: function() {
                        self.dtObj = this;
                    },
                    "scrollY": "200px",
                    "scrollCollapse": true,
                    "paging": false
                        //data: this.data,
                        //columns: this.header.map(function(e) {return { title : e };}),
                        //bAutoWidth: false
    } );



    var w = $(cNode).children().first().width();
    var h = $(cNode).children().first().height();

    $(cNode).css({"width" : w + 'px'});
    var unSelContent = '<span><i class="fa fa-table fa-3x"></i></span>';
    var unSelDynamic = function(selDomElement){};

    var selContent = '<span><i class="fa fa-chevron-circle-right fa-3x"></i></span>';
    var selDynamic = function(selDomElement){};

    this.setButtonContent(unSelContent, unSelDynamic, selContent, selDynamic);

    var bNode = this.getButtonNode();
    $(bNode).addClass("ardockDTcBut");
    if (nArgs.hasOwnProperty('position')) {
        console.log('putting at w/');
        console.dir(nArgs);

        var param = {};
        if (nArgs.hasOwnProperty('absPosSpecs'))
            param['absPosSpecs'] = nArgs['absPosSpecs'];
        if (nArgs["position"] == 'br')  {
            param['border'] = 'right';
            param['size'] = $(bNode).outerWidth() + $(cNode).outerWidth()
                            + parse($(this.node).css('padding-left'))
                            + parse($(this.node).css('padding-right'));
            param['sizeUpAbs'] = -1;
            //param['sizeLowAbs'] =     $('.willSlide.content.ardockDLctrl').outerWidth();
            param['sizeLowAbs'] = $(this.getContentNode()).outerWidth();
        }
        this.putAt(param);
        $(bNode).css('height', '');
    }
    console.log("display Out");
    console.dir(this);

}

arDockTable.prototype._display = function(opt) {
    if (bBookMark){
        console.log("This is bookmark style display");
        Bookmark.prototype.display.call(this);
    }

    var node = bBookMark ? this.getContentNode() : this.getNode();
    //this.setFrame("window");
    $(node).addClass("datatableW");
    $(node).append('<table class="table table-striped table-bordered"></table>');
    var self = this;
    $(node).find("table").DataTable( {
        initComplete: function () {
           self.dtObj = this;
        },
        data: this.data,
        columns: this.header.map(function(e) {return { title : e };}),
        bAutoWidth: false
    } );

    var w = $(node).children().first().width();
    var h = $(node).children().first().height();

    $(node).css({"width" : w + 'px'});

    $(node).css({"height" : (h + 50) + 'px'});

    if (bBookMark) {
        var offset = w;
        console.log("offset is " + offset);
        $(node).css("margin-right", '-' + offset + 'px');

        console.log('uu :>');
        console.dir($(node));
        console.log('ii :> ' + $(node).css('margin-right'));
    }

    var unSelContent = '<span><i class="fa fa-table fa-3x"></i></span>';
    var unSelDynamic = function(selDomElement){};

    var selContent = '<span><i class="fa fa-chevron-circle-right fa-3x"></i></span>';
    var selDynamic = function(selDomElement){};

    this.setButtonContent(unSelContent, unSelDynamic, selContent, selDynamic);



    //console.log('ii :> ' + $(node).width() );
}


var pdbObject;

var test = function (data){
    var emiter = new events.EventEmitter();
    var s = new stream.Readable();
    s.push(data.toString("utf8"));
    s.push(null);
    console.log('Testing');

    var oDt = new arDockTable();

    pdbLib.parse({ 'rStream' : s })
        .on("end", function(pdbObjInp){
            pdbObject = pdbObjInp;
            emiter.emit('pdbLoad', pdbObject);

            oDt.read(pdbObject.model(1).name("CA").asArray());
            oDt.hook(pdbObject);
            emiter.emit('load', oDt);
            //Math.floor(Math.random() * 6) + 1

            //console.log(pdbObject.model(1).dump());
   });


    return emiter;
}



module.exports = {
    test : test,
    new : function(opt) {
        var o = new arDockTable(opt);
    return o;}
};
