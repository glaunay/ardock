window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;
var events = require('events');

// Base Class provides emiter interface
var Core = function (opt) {

    this.nodeRoot = opt ? 'root' in opt ? $(opt.root)[0] : $('body')[0] : $('body')[0];
    this.idNum = opt ? 'idNum' in opt ? opt.idNum : 0 : 0;


    this.emiter = new events.EventEmitter();

    this._scaffold = '<div class="widget" id="w_' + this.idNum + '"></div>';
};

Core.prototype.scaffold = function(opt) {
    if (opt)
        this._scaffold = opt;
    else
        return this._scaffold;

    return null;
}

Core.prototype.on = function(eventName, callback) {
    this.emiter.on(eventName, callback);
};

Core.prototype.setFrame = function (type) {
    if (type === "window") {
        $(this.getNode()).append('<div class="w_window_header">'
            + '<span class="fa-stack fa-pull-right fa-lg"><i class="fa fa-square-o fa-stack-2x"></i><i class="fa fa-minus fa-stack-1x"></i></span></div>');
    }
}

Core.prototype.getNode__ = function() {
    if (! this.node) {
       // console.log("Adding div " + 'div.widget#w_' + this.idNum + " to " + this.nodeRoot);
        var string = this.scaffold();
        this.node = $(this.nodeRoot).append(string)[0];
        //this.node = $('div.widget#w_' + this.idNum)[0];
    }
    return this.node;
}

Core.prototype.display__ = function(event, callback) {

    if (! this.node) {
        /*
        this.node = $(this.scaffold());
        $(this.nodeRoot).append(this.node);
        this.node = this.node[0];
        */
        var string = this.scaffold();
        $(this.nodeRoot).append(string);
        this.node = $('div.widget#w_' + this.idNum)[0];
    }

    /*
    console.log("i display id num " + this.idNum);
    console.log(this.scaffold());
    */

    $(this.node).show();
};

Core.prototype.getNode = function() {
    if (! this.node) {
       // console.log("Adding div " + 'div.widget#w_' + this.idNum + " to " + this.nodeRoot);
        var string = this.scaffold();
        $(this.nodeRoot).append(string);
        this.node = $('div.widget#w_' + this.idNum)[0];
    }
    return this.node;
}

Core.prototype.display = function(event, callback) {

    if (! this.node) {
        var string = this.scaffold();
        $(this.nodeRoot).append(string);
        this.node = $('div.widget#w_' + this.idNum)[0];
    }

    /*
    console.log("i display id num " + this.idNum);
    console.log(this.scaffold());
    */

    $(this.node).show();
};



Core.prototype.show = function(event, callback) {
    $(this.node).show();
};

Core.prototype.hide = function(event, callback) {
    $(this.node).hide();
};

Core.prototype.destroy = function(event, callback) {
    $(this.node).remove();
};


module.exports = {
    Core : Core
}