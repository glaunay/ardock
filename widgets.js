window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;


var events = require('events');
var W_counts = 0;
/*
    Definition of the front-end widgets

*/

// Base Class provides emiter interface
var Core = function (opt) {
    this.nodeRoot = opt ? 'root' in opt ? $(opt.root)[0] : $('body')[0] : $('body')[0];

    this.emiter = new events.EventEmitter();
    W_counts++;
    this.idNum = W_counts;
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

Core.prototype.display = function(event, callback) {
    if (! this.node) {
        var string = this.scaffold();
        $(this.nodeRoot).append(string);
        this.node = $('div.widget#w_' + this.idNum)[0];
    }
    $(this.node).show();
};

Core.prototype.hide = function(event, callback) {
    $(this.node).hide();
};

Core.prototype.destroy = function(event, callback) {
    $(this.node).remove();
};

// Display an upload box
var UploadBox = function (opt) {
    var self = this;
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    this.scaffold ('<div class="widget uploadBox" id="w_' + this.idNum + '">'
                    + '<div class="btn btn-primary">Process PDB</div>'
                    + '<input type="file" style="display:none"/>'
                    + '</div>');
    this.display();
    this.input = $(this.node).find('input')[0];
    $(this.input).on('change', function(){ self.emiter.emit('change', self.input, self); });

    $(this.node).find('div.btn').on('click', function(){
        $(self.input).click();
    });

}
UploadBox.prototype = Object.create(Core.prototype);
UploadBox.prototype.constructor = UploadBox;

// Display a summary of a loaded pdb file
var PdbSummary = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    var scaffold = '<div class="widget pdbSummary" id="w_' + this.idNum + '">';
    this.pdbObj = opt.pdbObj;
    var chains = this.pdbObj.model(1).listChainID();
    console.log("-->" + chains);
    if (chains.length > 0) {
        scaffold += '<div class="btn-group" data-toggle="buttons">';
        chains.forEach(function(e) {
            scaffold += '<label class="btn btn-primary active">'
            + '<input type="checkbox" name="chainBox" id="' + e + '" autocomplete="off" checked>' + e + '</label>'
        });
        scaffold += '</div>';
    }
    scaffold += '<div class="btn btn-primary btn-lg btn-danger"> SUBMIT>></div></div>'
    this.scaffold (scaffold);
}
PdbSummary.prototype = Object.create(Core.prototype);
PdbSummary.prototype.constructor = PdbSummary;

PdbSummary.prototype.display = function(event, callback) {
    Core.prototype.display.call(this);
    var self = this;
    $(this.node).find("div.btn-danger").on('click', function() {
        var chains = [];
        $(self.node).find('input[name=chainBox]:checked').each(function(e){
            chains.push($(this).attr('id'));
        });
        var pdbObj = self.pdbObj.model(1).chain(chains).pull();
        self.emiter.emit('submit', pdbObj);
    });
};



module.exports = {
    pdbSummary : function(opt){ var obj = new PdbSummary(opt);return obj; },
    uploadBox : function(opt){ var obj = new UploadBox(opt);return obj; }
};