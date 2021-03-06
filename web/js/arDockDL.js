var stream = require('stream');
var Bookmark = require('./Bookmarks.js').Bookmark;
var $  = require( 'jquery' );
var events = require('events');




// This module control all the export procedures
// Download file as PDB, as EXCEL, PIPE TO ENDSCRIPT and SESSION save.
// All w/ proper button

var arDockDownloader = function(opt) {
  //  console.dir(opt);
    var nArgs = opt ? opt : {};
   // console.log($(nArgs.root));
    Bookmark.call(this, nArgs);
    this.mode = null;
    this.bDisabled = false;
}

arDockDownloader.prototype = Object.create(Bookmark.prototype);
//arDockTable.prototype = Object.create(widgets.Core.prototype);

arDockDownloader.prototype.constructor = arDockDownloader;


arDockDownloader.prototype.hook = function(pdbObj, uuid) {
    this.pdbRef = pdbObj;
    if (uuid !== undefined)
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
    this.mode = nArgs.hasOwnProperty('mode') ? nArgs.mode : null;

    var cNode = this.getContentNode();
    var bNode = this.getButtonNode();
    
    $(cNode).addClass("ardockDLctrl");
    $(cNode).append(//$('body').append('<div class="ardockDLctrl">'
                 '<div class="btn-group">'
                + '<div class="btn btn-primary cuPEND"><img width="45px" src="assets/END_awesome.png"></img></div>'
                + '<div class="btn btn-primary cuPdbDl" ><img width="45px" src="assets/pdb.png"></img></div>'
                + '<div class="btn btn-primary faBtnDL" ><i class="fa fa-cloud-upload fa-2x"></i></div>'
                + '</div>'
                );

    //let emailFieldWidth = $(bNode).width() + $(cNode).find('.btn-group').width();
    let emailFieldWidth = 243;
    $(cNode).find('.email-input').width(emailFieldWidth + 'px');
            $(cNode).find('.email-input').css('margin-left', '-40px'/*'-' + $(bNode).width() + 'px'*/);
    var self = this;
    $(cNode).find('.cuPdbDl').mouseout(function(){
        if (self.bDisabled) return;
        $(this).find('img').attr("src","assets/pdb.png");
        });

    $(cNode).find('.cuPdbDl').mouseover(function(){
        if (self.bDisabled) return;
        $(this).find('img').attr("src","assets/pdb_alt.png");
    });

    $(cNode).find('.faBtnDL').on('mouseover', function() {
        $(this).css('color','white');
    })
    .on('mouseout', function() {
        $(this).css('color','black');
    })

    if (this.bDisabled) $(cNode).find(".cuPdbDl,.cuPEND").addClass('disabled');


    $(cNode).find('.cuPdbDl').on('click', function (){
        if (self.bDisabled) return;
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(self.pdbRef.model(1).dump()));
        element.setAttribute('download', 'ardockResults.pdb');
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
        if (isSafari) element.setAttribute('target', '_blank');


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
        var w,h;

        if (self.mode === 'pill') {
            $(bNode).hide();
            w =  $(self.node).find('.btn-group').width(),
            h =  $(self.node).outerHeight();
        } else {
            w =  $(cNode).find('.btn-group').width(),
            h =  $(cNode).find('.btn-group').height();
        }

        $(cNode).find('.btn-group').hide();
        $(cNode).find('.email-input').hide();

        $(cNode).append('<div class="container keyContainer">'
                        + '<div class="row"><div class="input-group keyPaste">'
                        + '<span class="input-group-addon invit"><i class="fa fa-key fa-fw"></i></span>'
                        + '<div class="form-control keyPasteForm">' + self.uuid + '</div>'
                        + '<span class="input-group-addon pull-left close"><i class="fa fa-remove"></i></span>'
                        + '</div></div>'
                        + '<div class="row keyComment">Use this key to restore current session in the future.</div></div>');
        if (self.mode !== 'pill')
            $(cNode).find('div.container').css({'width' :  w + 'px'});
        $(cNode).find('span.close').on('click', function(){
            var _h = $(self.node).outerHeight();
            //console.log(_h + ' -> ' + h + ' transition');
            $(self.node).css('height', _h);
            $(cNode).find('div.keyContainer').remove();
            $(cNode).find('.btn-group').show();
            $(cNode).find('.email-input').show();
            $(bNode).show();
            $(self.node).animate({
                height: h ,
                }, 500, function() {
                    $(self.node).css('height', 'auto');
    // Animation complete.
                });
        });

    });


    // HACK GL -- no time
    if (nArgs.hasOwnProperty('position'))
        if (nArgs.position === 'tm' && this.mode === 'pill') {
                $(this.node).addClass('ardockDLcontainer pill topCenter');
                $(this.getButtonNode()).unbind('click');
        }


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
        //console.log('putting at w/');
        //console.dir(nArgs);

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
            //console.log(">>>>>>>=========================<<<<<<<<<<<<<<");
            //console.log($(this.getContentNode()).outerWidth())
            //console.log($('.willSlide.content.ardockDLctrl').outerWidth());
            /*param['sizeLowAbs'] = $(cNode).outerWidth()
                            + parse($(this.node).css('padding-left'))
                            + parse($(this.node).css('padding-right'));// + $(bNode).css('padding-left');
            */
        }
        //console.log("arDockDL parameters");
        //console.log(param);

        this.putAt(param);
        //console.log("--->" + $('.willSlide.content.ardockDLctrl').outerWidth());
    }


    if (nArgs.hasOwnProperty('effect')) {
        if (nArgs.effect === 'shadowOut') {
            $(self.node).css('opacity',0);
            setTimeout( function() {
                //console.log('appearing');
                $(self.node).animate({opacity : 1}, 2500);
            }, 250);
        }
    }

}

module.exports = {
    new : function(opt) { var o = new arDockDownloader(opt); return o;}
};
