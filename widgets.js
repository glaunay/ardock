window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;


var events = require('events');
var W_counts = 0;
var tabTabs =[];
/*
    Definition of the front-end widgets

*/


////////////////////////////////////////////////////////////////////////////////////////// CORE /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////// UPLOADBOX /////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////// DISPLAY TABS /////////////////////////////////////////////////////////////////////////////////
var DisplayTabs = function(opt){
   // var self = this;

    var nArgs = opt ? opt : {};
   Core.call(this, nArgs);
    
    //this.pdbObj = opt.pdbObj;

    this.scaffold ('<div  class="container-fluid" id="displayTabs">'+
                                '<ul class="nav nav-tabs" id="tabs">'+   
                                    '<li role="presentation" class="active" id="addFile"><a href="#divAddFile">+ Add File</a></li>'+
                                '</ul>'+
                                '<div class="tab-content">'+
                                    '<div class="tab-pane fade in active" id="divAddFile">'+
                                    '</div>'+
                                '</div>'+
                            '</div>');

    this.display();
}

DisplayTabs.prototype = Object.create(Core.prototype);
DisplayTabs.prototype.constructor = DisplayTabs;

//Methode addTab
DisplayTabs.prototype.addTab = function(opt){ 
    
    var name =  opt.fileName.replace(/(?:\.([^.]+))?$/i,"");
    
    $('#tabs').append('<li role="presentation" class="'+ name +'"><a href="#' + name + '">' + name + '</a><i class="glyphicon glyphicon-remove-circle"></i></li>');  
    $('.tab-content').append('<div class="tab-pane fade" id="'+ name +'">');
    $("#tabs li").last().insertBefore('#addFile');

    tabTabs.push(name);
    //console.log(tabTabs);
    var navDT = function(name){

        $("." + name + " a").click()

        $("." + name + " i").on('click',function(){

            var index = tabTabs.indexOf(name),
                      nextClassName = (tabTabs.length > 1 && index !== tabTabs.length - 1) ? tabTabs[index +1] : false,
                      prevClassName = (tabTabs.length > 1 && index !== 0) ? tabTabs[index - 1] : false ;

            if ($("." + name).hasClass('active')){
                      if(nextClassName){
                          $("." + nextClassName + " a").trigger('click');
                          $('#' + nextClassName).toggleClass('active in');
                      }
                      else if(prevClassName){
                          $("." + prevClassName + " a").trigger('click');
                          $('#' + prevClassName).toggleClass('active in');
                      }
                      else{
                          $('#addFile a').trigger('click');
                          $('#divAddFile').toggleClass('active in');
                      }
            }

            tabTabs.splice(index,1);
            $("." + name).remove();
            $("#" + name).remove();
            //console.log(tabTabs);
        });
    }

    $(".nav-tabs a").click(function(){
        $(this).tab('show');
    });

    return {navDT :navDT(name), name : name};
};



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////// PDB SUMMARY /////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////// MODULES EXPORT /////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    pdbSummary : function(opt){ var obj = new PdbSummary(opt);return obj; },
    displayTabs : function(opt){ var obj = new DisplayTabs(opt);return obj; },
    uploadBox : function(opt){ var obj = new UploadBox(opt);return obj; }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
