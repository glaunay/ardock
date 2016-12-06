window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;
var events = require('events');
var Core =require('./Core.js').Core;

var Bookmarkable = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
}
Bookmarkable.prototype = Object.create(Core.prototype);
Bookmarkable.prototype.constructor = Bookmarkable;


Bookmarkable.prototype.display = function(opt) {

    // Check construction precedence and exit TO DO

    var btnReadyContent = 'CLICK!';
    var btnExpandContent = 'Expanded!';

    if (opt) {
        btnReadyContent = 'btnReadyContent' in opt ? opt['btnReadyContent'] : btnReadyContent;
        btnExpandContent = 'btnExpandContent' in opt ? opt['btnExpandContent'] : btnExpandContent;
    }

    $(this.getNode()).addClass('bookmarkable')
        .append('<div class="willSlide content"></div>'
                + '<div class="btn willSlide">'
                + '<span class="click">' + btnReadyContent + '</span>'
                + '<span class="expandedTxt">' + btnExpandContent + '</span>'
                + '</div>');


/*
    var easing = 1 //enable or disable easing | 0 or 1
    var easing_effect = 'swing';//easeOutBounce
    var animation_speed = 500 //ms
    var self = this;
    var btn = $(this.getNode()).find('div.btn.willSlide')[0];
    $(btn).on('aclick', function() {//diabling for new layout
        console.log(this);
        var nodeRoot = self.getNode();
        console.log(nodeRoot);
        var slider_width = $(nodeRoot).find('div.content').width();//get width automaticly

        console.dir($(nodeRoot).first('div.content'));
        console.log("-->" + slider_width);
        console.dir(this);
    //check if slider is collapsed
        console.log($(this).css("margin-right") + '  =====  ' + slider_width+"px");

        var is_collapsed = $(this).css("margin-right") == slider_width+"px" && !$(this).is(':animated');

    //minus margin or positive margin
        var sign = (is_collapsed) ? '-' : '+';

        if(!$(this).is(':animated')) { //prevent double margin on double click
            if(easing) {
                $(nodeRoot).find('.willSlide').animate({"margin-right": sign+'='+slider_width},animation_speed, easing_effect);
            } else {
                $(nodeRoot).find('.willSlide').animate({"margin-right": sign+'='+slider_width},animation_speed);
            }
        }
     //if you need you can add class when expanded
 */
    var self = this;
    self.is_collapsed = true;
    $(this.getButtonNode()).on('click', function() {
        if (self.is_collapsed) {
            self.is_collapsed = false;
            $(self.node).find('.willSlide').addClass('expanded');
        } else {
            self.is_collapsed = true;
            $(self.node).find('.willSlide').removeClass('expanded');
        }
    });
}

Bookmarkable.prototype.getContentNode = function() {
    return $(this.getNode()).find('div.content')[0];
}
Bookmarkable.prototype.getButtonNode = function() {
    return $(this.getNode()).find('div.btn.willSlide')[0];
}

Bookmarkable.prototype.setButtonContent = function(unSelectedContent, unSelectedDynamic, selectedContent, selectedDynamic) {
    selectedContent = selectedContent ? selectedContent : unselectedContent;
    var btn = this.getButtonNode();

    $(btn).empty();
    $(btn).append(unSelectedContent);
    $(btn).append(selectedContent);
    $($(btn).children()[0]).addClass('click');
    $($(btn).children()[1]).addClass('expandedTxt');

    unSelectedDynamic(this.node, this.getContentNode(), $(btn).children()[0]);
    selectedDynamic(this.node, this.getContentNode(), $(btn).children()[0]);
    var node = this.getContentNode();
   // var w = $(node).css('width') === "" ? $(node).width() + 'px' : $(node).css('width');
    var h = $(node).css('height') === "" ? $(node).height() + 'px': $(node).css('height');

    $(btn).css( 'height', h);

    $(btn).prependTo($(btn).parent());
}

Bookmarkable.prototype.putAt = function(opt) {
    var nArgs = opt ? opt : {};
    var node = this.getContentNode();
    console.log('***' + $(node).css('width'));



    var $container = $(this.nodeRoot);
    var btn = this.getButtonNode();;

    var w = $(node).css('width') === "" ? $(node).width() + 'px' : $(node).css('width');
    var h = $(node).css('height') === "" ? $(node).height() + 'px': $(node).css('height');
    w = parseInt(String(w).replace('px', ''));

    var p_w = $container.css('width') === "" ? $container.width(): $container.css('width');
    var p_h = $container.css('height') === "" ? $container.height(): $container.css('height');

    p_w = parseInt(String(p_w).replace('px', ''));

    var slider_len = nArgs.hasOwnProperty('size') ? nArgs['size'] : null;

    var absPositionSpecs = nArgs.hasOwnProperty('absPosSpecs') ? nArgs['absPosSpecs'] : null;

    var self = this;
    var bClickCallback = null;
    if (absPositionSpecs) {
        $(this.node).css('margin-left', '0px');
        $(this.node).css(absPositionSpecs);
        $(this.node).css('position', 'absolute');
        if ( nArgs.hasOwnProperty('border') ) {
            if (nArgs['border'] === 'right') {
                var off = nArgs['sizeLowAbs']
                var up = nArgs['sizeUpAbs']
                $(this.node).css('right', ((-1) * off  ) + 'px');
                bClickCallback = function () {
                    if ($(this).hasClass('clicked'))
                        console.log ("is clicked");
                    else
                        console.log ("is NOT clicked");

                    if ($(this).hasClass('clicked'))
                        $(self.node).animate({"right": ((-1) * off) + 'px'}, 500, 'swing');
                    else
                        $(self.node).animate({"right": ((-1) * up) + 'px'}, 500, 'swing');

                    $(this).toggleClass('clicked');
                };
            }
        }
    }
    // No absolute positioning we use margin
    else if ( nArgs.hasOwnProperty('border') ) {
        if (nArgs['border'] === 'right') {
            var p_pad = $container.css('padding-left') === "" ? 0 : $container.css('padding-left');
            p_pad = parseInt(String(p_pad).replace('px', ''));
            console.log("offset Right is " + p_w + '-' +  $(btn).outerWidth() + '-' + p_pad);

            this.offset_rest = p_w - $(btn).outerWidth() - p_pad;
            var l = slider_len ? slider_len : w;
            this.offset_show = p_w - l - p_pad;
            console.log("offset Right show is " + p_w + '-' + l + '-' + p_pad);
            console.log("offset rest is " +  this.offset_rest + 'offset show is' + this.offset_show);
            $(this.node).css('margin-left', this.offset_rest + 'px');


            bClickCallback =  function() {
                if ($(btn).hasClass('clicked'))
                    $(self.node).animate({"margin-left": self.offset_rest + 'px'}, 500, 'swing');
                    //$(self.node).css('margin-left', self.offset_rest + 'px');
                else
                    $(self.node).animate({"margin-left" : self.offset_show + 'px'}, 500, 'swing');
                    //$(self.node).css('margin-left', self.offset_show + 'px');
                $(btn).toggleClass('clicked');
            };

        }
    }

    $(btn).on('click', bClickCallback);
  /*  var w = $(node).css('width') === "" ? $(node).width() + 'px' : $(node).css('width');
    var h = $(node).css('height') === "" ? $(node).height() + 'px': $(node).css('height');

    console.log('computed WxH of content node to position = ' + w + 'x' + h);
    console.dir(node);

    // Compute width and push stuff
    if ( nArgs.hasOwnProperty('border') ) {
        if (nArgs['border'] === 'right') {
            $(node).css('margin-right', '-' + w);
        }
    }
    */
}

module.exports = {
    Bookmark : Bookmarkable
}