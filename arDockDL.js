var stream = require('stream');
var Bookmark = require('./Bookmarks.js').Bookmark;
var $  = require( 'jquery' );
var events = require('events');

// This module control all the export procedures
// Download file as PDB, as EXCEL, PIPE TO ENDSCRIPT and SESSION save.
// All w/ proper button

var arDockDownloader = function(opt) {
    console.log("ardock Download constructor");
    console.dir(opt);
    var nArgs = opt ? opt : {};
    console.log($(nArgs.root));
    Bookmark.call(this, nArgs);
}

arDockDownloader.prototype = Object.create(Bookmark.prototype);
//arDockTable.prototype = Object.create(widgets.Core.prototype);

arDockDownloader.prototype.constructor = arDockDownloader;


arDockDownloader.prototype.hook = function(pdbObj) {
    this.pdbRef = pdbObj;
}

arDockDownloader.prototype.display = function(opt) {
    var nArgs = opt ? opt : {};

    Bookmark.prototype.display.call(this);

    var cNode = this.getContentNode();
    var bNode = this.getButtonNode();
    $(cNode).addClass("ardockDLctrl");
    $(cNode).append(//$('body').append('<div class="ardockDLctrl">'
                 '<div class="btn-group">'
                + '<div class="btn btn-primary cuPEND"><img width="125px" src="assets/END_awesome.png"></img></div>'
                + '<div class="btn btn-primary cuPdbDl" style="padding : 13px 12px 13px 12px"><img width="125px" src="assets/pdb.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL" style="padding: 4px 32px 5px 32px;"><i class="fa fa-file-excel-o fa-5x"></i></div>'
                + '</div>'
                 /* '<div class="btn-group">'
                + '<div class="btn btn-primary cuPEND"><img width="125px" src="assets/END_awesome.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL"><i class="fa fa-cloud-download fa-5x"></i></div>'
                + '</div>'
                + '<div class="btn-group" style="margin-top:4px">'
                + '<div class="btn btn-primary cuPdbDl" style="padding : 13px 12px 13px 12px"><img width="125px" src="assets/pdb.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL" style="padding: 4px 32px 5px 32px;"><i class="fa fa-file-excel-o fa-5x"></i></div>'
                + '</div>'*/
                );//+ '</div>');

    $(cNode).find('.cuPdbDl').mouseout(function(){
        $(this).find('img').attr("src","assets/pdb.png");
        });

    $(cNode).find('.cuPdbDl').mouseover(function(){
        $(this).find('img').attr("src","assets/pdb_alt.png");
    });
    $(cNode).find('.cuPEND').mouseout(function(){
        $(this).find('img').attr("src","assets/END_awesome.png");
    });

    $(cNode).find('.cuPEND').mouseover(function(){
        $(this).find('img').attr("src","assets/END_awesome_alt.png");
    });

    //We want all button in single line
    var parse = function(s){
            if (s === "") return 0;
            return parseInt(String(s).replace('px', ''));
    }



  //  $(node).append('<span><i class="fa fa-floppy-o fa-3x"></i></span>');
    var self = this;

    var unSelContent = '<span><i class="fa fa-floppy-o fa-3x"></i></span>';
    var unSelDynamic = function(bookmarkDiv, buttonDiv, contentDiv){};

    var selContent = '<span><i class="fa fa-angle-double-right fa-3x"></i></span>';
    var selDynamic = function(bookmarkDiv, buttonDiv, contentDiv){
    };

    this.setButtonContent(unSelContent, unSelDynamic, selContent, selDynamic);
    $(bNode).addClass("ardockDLcBut");
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
            console.log($(this.getContentNode()).outerWidth())
            console.log($('.willSlide.content.ardockDLctrl').outerWidth());
            /*param['sizeLowAbs'] = $(cNode).outerWidth()
                            + parse($(this.node).css('padding-left'))
                            + parse($(this.node).css('padding-right'));// + $(bNode).css('padding-left');
            */
        }
        this.putAt(param);
    }
}


module.exports = {
    new : function(opt) { var o = new arDockDownloader(opt); return o;}
};
