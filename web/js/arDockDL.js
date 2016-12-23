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

    this.bDisabled = false;
}

arDockDownloader.prototype = Object.create(Bookmark.prototype);
//arDockTable.prototype = Object.create(widgets.Core.prototype);

arDockDownloader.prototype.constructor = arDockDownloader;


arDockDownloader.prototype.hook = function(pdbObj, uuid) {
    this.pdbRef = pdbObj;
    this.uuid = uuid;
}

arDockDownloader.prototype.enable = function (){
    if(!this.bDisabled) return;
    var cNode = this.getContentNode();
    this.bDisabled = false;
    $(cNode).find(".cuPdbDl,.cuPEND").removeClass('disabled');
}

arDockDownloader.prototype.disable = function (){
    if(this.bDisabled) return;
    var cNode = this.getContentNode();
    this.bDisabled = true;
    $(cNode).find(".cuPdbDl,.cuPEND").addClass('disabled');
}



arDockDownloader.prototype.display = function(opt) {
    var nArgs = opt ? opt : {};

    Bookmark.prototype.display.call(this);

    this.bDisabled = nArgs.hasOwnProperty('disabled') ? nArgs['disabled'] : true;

    var cNode = this.getContentNode();
    var bNode = this.getButtonNode();
    $(cNode).addClass("ardockDLctrl");
    $(cNode).append(//$('body').append('<div class="ardockDLctrl">'
                 '<div class="btn-group">'
                + '<div class="btn btn-primary cuPEND"><img width="125px" src="assets/END_awesome.png"></img></div>'
                + '<div class="btn btn-primary cuPdbDl" style="padding : 13px 12px 13px 12px"><img width="125px" src="assets/pdb.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL" style="padding: 4px 32px 5px 32px;"><i class="fa fa-cloud-upload fa-5x"></i></div>'
                + '</div>'
                );
    var self = this;
    $(cNode).find('.cuPdbDl').mouseout(function(){
        if (self.bDisabled) return;
        $(this).find('img').attr("src","assets/pdb.png");
        });

    $(cNode).find('.cuPdbDl').mouseover(function(){
        if (self.bDisabled) return;
        $(this).find('img').attr("src","assets/pdb_alt.png");
    });

    if (this.bDisabled) $(cNode).find(".cuPdbDl,.cuPEND").addClass('disabled');


    $(cNode).find('.cuPdbDl').on('click', function (){
        if (self.bDisabled) return;
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(self.pdbRef.model(1).dump()));
        element.setAttribute('download', 'ardockResults.pdb');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    $(cNode).find('.cuPEND').mouseout(function(){
        if (self.bDisabled) return;
        $(this).find('img').attr("src","assets/END_awesome.png");
    });
    $(cNode).find('.cuPEND').mouseover(function(){
        if (self.bDisabled) return;
        $(this).find('img').attr("src","assets/END_awesome_alt.png");
    });
    $(cNode).find('.cuPEND').on('click', function(){
        if (self.bDisabled) return;
        self.emiter.emit('END_click');
    });

    $(cNode).find('.faBtnDL').on('click', function(){
        $(cNode).find('.btn-group').hide();
        var w =  $(cNode).find('.btn-group').width(),
            h =  $(cNode).find('.btn-group').height();

        $(cNode).append('<div class="container keyContainer">'
                        + '<div class="row"><div class="input-group keyPaste">'
                        + '<span class="input-group-addon invit"><i class="fa fa-key fa-fw"></i></span>'
                        + '<div class="form-control keyPasteForm">' + self.uuid + '</div>'
                        + '<span class="input-group-addon pull-left close"><i class="fa fa-remove"></i></span>'
                        + '</div></div>'
                        + '<div class="row keyComment">Copy the above key to restore present session at any time.</div></div>');
        $(cNode).find('div.container').css({'width' :  w + 'px'});
        $(cNode).find('span.close').on('click', function(){ $(cNode).find('div.keyContainer').remove(); $(cNode).find('.btn-group').show();});

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
            console.log(">>>>>>>=========================<<<<<<<<<<<<<<");
            console.log($(this.getContentNode()).outerWidth())
            console.log($('.willSlide.content.ardockDLctrl').outerWidth());
            /*param['sizeLowAbs'] = $(cNode).outerWidth()
                            + parse($(this.node).css('padding-left'))
                            + parse($(this.node).css('padding-right'));// + $(bNode).css('padding-left');
            */
        }
        console.log("arDockDL parameters");
        console.log(param);

        this.putAt(param);
        console.log("--->" + $('.willSlide.content.ardockDLctrl').outerWidth());
    }
}


module.exports = {
    new : function(opt) { var o = new arDockDownloader(opt); return o;}
};
