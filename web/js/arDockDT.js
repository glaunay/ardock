var stream = require('stream');
var pdbLib = require("pdb-lib");
var Bookmark = require('./Bookmarks.js').Bookmark;
var $  = require( 'jquery' );
var DataTable = require( 'datatables.net' )();
$.fn.DataTable = DataTable;
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
var fieldNames = ['resName', 'resSeq', 'chainID', 'tempFactor'];
// Define a mapper to columnheaders



var arDockTable = function(opt) {
    //console.log("ardockTable constructor w/ Normalization");

    var nArgs = opt ? opt : {};

    Bookmark.call(this, nArgs);
    this.pdbRef = 'pdbObj' in nArgs ? nArgs['pdbObj'] : null;
    this.mode = null;
    this._patchAssigned = false;
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
    /* We exclude amino acid w/ negative score, ie non-accesible*/
    this.data = []
    var self = this;
    dataArray.forEach(function(e){
        //console.log(e);
        /*console.log("oo" + mapper['Score'](e));
        console.log("oo" + typeof(mapper['Score'](e)));*/
        if (mapper['Score'](e) === -1) {
            /*console.log("discarding "
                    + mapper['residue Name'](e) + ' '
                    + mapper['residue Number'](e) + ' '
                    + mapper['chain ID'](e) );*/
            return;
        }
        self.data.push([ mapper['residue Name'](e),
                    mapper['residue Number'](e),
                    mapper['chain ID'](e),
                    mapper['Score'](e)
                    ]);
    });

    /*this.data = dataArray.map(function(e){
        return [ mapper['residue Name'](e),
                mapper['residue Number'](e),
                mapper['chain ID'](e),
                mapper['Score'](e) ];
    });*/
    this.normalize();
    this.patchAssign();
    this.header = ['residue Name', 'residue Number', 'chain ID', 'Score', 'Norm'];
    this.emiter.emit('parsed', this.data);


}
// Perform score standardization
arDockTable.prototype.normalize = function() {
    //console.log("Normalizing");
    var mean = 0,
        sigma = 0,
        N = this.data.length;

    this.data.forEach(function(e){
        mean += e[3];
    });
    mean /= N;

    this.data.forEach(function(e){
        sigma += (e[3] - mean) * (e[3] - mean);
    });

    sigma = Math.sqrt(sigma / N);

    this.data.forEach(function(e){
        var x = (e[3] - mean) / sigma;
        e.push(Math.round(x * 100) / 100);
    });

}

arDockTable.prototype.patchAssign = function (){


    var trace = this.pdbRef.model(1).name('CA').asArray();
    var popSize = trace.length - 1;

    //console.log("Assigning patches over " + popSize + 'residue');

    this.pdbRef.model(1);

    var pFrac = 6.11 * Math.pow(popSize,-0.75)

    this.maxRank = Math.round(pFrac * popSize +0.5);

    var i = this.data[0].length - 1;
   // console.log("I is " + i);
    var sorted = this.data.sort(function(a,b){
        return parseFloat(b[i]) - parseFloat(a[i]);
    });
    this.data = sorted;
    /*console.log(this.data);
    console.log(">><<" + this.maxRank);*/
    this._patchAssigned = true;

}

/*
    Call these functions after patchAssigned
*/
arDockTable.prototype.getMaxMinScore = function (){
    return [ this.data[0][3], this.data[this.data.length - 1][3] ]
}

arDockTable.prototype.getPatchFloorScore = function (){
    return this.data[ this.maxRank + 1][3] //  ["LYS", "188", "A", 69, 1.92]
}

arDockTable.prototype.hook = function(pdbObj) {
    this.pdbRef = pdbObj;
}
arDockTable.prototype.download = function() {

    var filename="ardockResults.pdb";
    //console.log(this.pdbRef.dump());

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
  /*  console.log("CSV exporter");
    console.dir(this);
    */
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

        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

        if (link.download !== undefined || isSafari) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            if (isSafari) link.setAttribute('target', '_blank');

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

        this.mode = nArgs.hasOwnProperty('mode') ? nArgs.mode : null;

        if(this.mode === 'zFixed') {
            $(this.getButtonNode()).remove();
            $(this.node).addClass('zFixed');
        }


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

       // $(cNode).find("table").append('<thead>' + '<tr><th colspan="3">Residue</th><th rowspan="2">Score</th></tr>' + '<tr><th>name</th><th>number</th><th>chain</th></tr></thead><tbody></tbody>');
        $(cNode).find("table").append('<thead>' + '<tr><th colspan="3">Residue</th><th colspan="2">Score</th></tr>' +
                                      '<tr><th>name</th><th>number</th><th>chain</th><th>raw</th><th>norm</th></tr></thead><tbody></tbody>');

        $tBody = $(cNode).find("table tbody");

        var minScore = -20.0;

        this.data.forEach(function(e,i ) {
            var tr = e.join('</td><td>');
            var _trOpen = '<tr><td>';
            if (i <= self.maxRank) {
                if (parseFloat(e[4]) > 0.0) {
                    _trOpen = '<tr class="predicted"><td>';
                    minScore = parseFloat(e[4]);
                }
            } else if(parseFloat(e[4]) === minScore) { // We class as predicted residue w/ identical normalized score as long as one of them is part of patch population
                _trOpen = '<tr class="predicted"><td>';
            }

            tr = _trOpen + tr + '</td></tr>';
            $tBody.append(tr);
        });
        //console.log($(cNode).find("table"));

        var drawButtonDL = function (cNode){
            // if ($(cNode).find('.dataTables_wrapper.no-footer .xlDL').length >0) return
            // $(cNode).find('.dataTables_wrapper.no-footer').prepend(
                $(cNode).append(
                '<div class="dtFooter">'
                + '<div class="btn btn-primary xlDL btn-md">'
                + '<i class="fa fa-file-excel-o fa-2x" aria-hidden="true"></i><span>Download</span></div>'
                + '</div>');
               /* $(cNode).find('.dataTables_info').css({
                            'float': 'none',
                            'padding': '5px 5px 5px 10px'
                        })*/
                $(cNode).find('div.btn.xlDL').on("click", function(){self.exportToCsv();});
        };
        if (this.mode === 'zFixed')
            drawButtonDL(cNode);
       $(cNode).find("table").DataTable({
                drawCallback : function (){
                    self.dtObj = this.api();
                  //  drawButtonDL( cNode );
                },
                initComplete: function() {
                   $(this)
                    .find('tbody tr').on('click', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            /*console.log(e.target);
                            console.log(e.originalEvent);*/
                            var idx = self.dtObj
                                .row( this )
                                .index();

                        self.emiter.emit("cellClick", { i : idx,  data : self.data[idx] });
                    });

                    },
                    "scrollY": "125px",
                    "scrollCollapse": true,
                    "paging": false,
                    "info": false
                        //data: this.data,
                        //columns: this.header.map(function(e) {return { title : e };}),
                        //bAutoWidth: false
    } );



    var w = $(cNode).children().first().width();
    var h = $(cNode).children().first().height();
    if (this.mode !== 'zFixed')
        $(cNode).css({"width" : w + 'px'});
    var unSelContent = '<span><i class="fa fa-table fa-3x"></i></span>';
    var unSelDynamic = function(selDomElement){};

    var selContent = '<span><i class="fa fa-chevron-circle-right fa-3x"></i></span>';
    var selDynamic = function(selDomElement){};

    this.setButtonContent(unSelContent, unSelDynamic, selContent, selDynamic);

    var bNode = this.getButtonNode();
    $(bNode).addClass("ardockDTcBut");
    if (nArgs.hasOwnProperty('position')) {
        /*console.log('putting at w/');
        console.dir(nArgs);*/

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
    /*console.log("display Out");
    console.dir(this);*/

    if (nArgs.hasOwnProperty('draggable')) {
        $(self.getContentNode()).prepend('<div style="height:1.5em;cursor:crosshair" class="dragTarget"></div>')
        Draggable.create(self.node, {
   // type:"y",
            bounds: self.nodeRoot,
            trigger : $(self.getContentNode()).find(".dragTarget")[0],
        //throwProps:true,
            onClick:function() {
            /*console.log("clicked");
            self.fire('onDragClick');*/
        },
        onDragEnd:function() {
            //console.log("drag ended");
            /*self.fire('onDragEnd');*/
        }

    });
    }


}
/*
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
             $(this)
                    .find('tbody tr').on('click', function() {
                        self.fire("cellClick");
                    });
            //self.dtObj = this;
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
*/

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
