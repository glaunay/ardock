window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;

//var NGL
var NGLVIEW = null;// = require('nglview-js');
var NGLAA = require('nglview-js');

var events = require('events');

//var THREE = require('three');


///////////////////////////////////////////////////////////////////////////////////////// GLOBAL //////////////////////////////////////////////////////////////
var W_counts = 0;
var tabTabs =[];
var jobsOperations = null;

var socketApp = null;


/*
    Definition of the front-end widgets

*/


////////////////////////////////////////////////////////////////////////////////////////// CORE ///////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////////////// HEADER /////////////////////////////////////////////////////////////////////////////////////////
var Header = function(opt){
    var self = this;
   
    var nArgs = opt ? opt : {};
   
    Core.call(this, nArgs);

    this.id = "W_" + this.idNum;
   
    this.scaffold ('<header id="header" class="container-fluid">'
                                +'<div class="widget header row" id="w_' + this.idNum + '">'
                                    + '<img src="assets/logo.png" class="col-xs-4" />'
                                    +'<p class="col-xs-8">Probe your Prot</p>'
                                + '</div>'
                                //+'<hr>'
                        +'</header>');
   
    this.display();
}
Header.prototype = Object.create(Core.prototype);
Header.prototype.constructor = Header;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////// UPLOADBOX /////////////////////////////////////////////////////////////////////////////////////////
// Display an upload box
var UploadBox = function (opt) {
  
    var self = this;
   
    var nArgs = opt ? opt : {};
   
    Core.call(this, nArgs);

    var uploadBoxId = "W_" + this.idNum;
   
    this.scaffold ('<div class="widget uploadBox dropzone container-fluid" id="w_' + this.idNum + '">'
                    + '<div class="btn btn-primary">Browse</div>'
                    +'<p>Or DrOp File(s) (.pdb, .fasta)</p>'
                    + '<input type="file" style="display:none" accept=".pdb,.fasta" multiple/>'
                    + '</div>');
   
    this.display();
   
    this.input = $(this.node).find('input')[0];
   
    $(this.input).on('change', function(){ self.emiter.emit('change', self.input, self); });

    $(this.node).find('div.btn').on('click', function(){
        $(self.input).click();
    });
    //###############DRAG & DROP################################
      $('.dropzone').bind('dragover',function(event){
             event.stopPropagation();
             event.preventDefault();
             $(this).css({ "background-color": "#fbf9f9"});
      });

      $('.dropzone').bind('dragleave',function(event){
             event.stopPropagation();
             event.preventDefault();
             $(this).css({ "background-color": "#efefef"});
      });

      $('.dropzone').bind('dragenter',function(event) {
             event.preventDefault();
             event.stopPropagation();
      });
      
      $('.dropzone').bind('drop', function(event){
            event.preventDefault();
    
            var files = event.originalEvent.dataTransfer.files; // FileList object.
            
            self.emiter.emit('change', files);
      });
    //###########################################################

}
UploadBox.prototype = Object.create(Core.prototype);
UploadBox.prototype.constructor = UploadBox;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////// LOADER /////////////////////////////////////////////////////////////////////////////////////////
var Loader = function(opt){
    var self = this;
   
    var nArgs = opt ? opt : {};
   
    Core.call(this, nArgs);

    var loaderId = "W_" + this.idNum;
   
    this.scaffold ('<div class="widget loader" id="w_' + this.idNum + '">');
}

Loader.prototype = Object.create(Core.prototype);
Loader.prototype.constructor = Loader;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////// DISPLAY TABS /////////////////////////////////////////////////////////////////////////////////
var DisplayTabs = function(opt){

    var nArgs = opt ? opt : {};
   Core.call(this, nArgs);

   NGLVIEW = opt.ngl;
   jobsOperations = opt.jobsOP;

   socketApp = opt.skt;
    
    //this.pdbObj = opt.pdbObj;

    this.scaffold ('<div  class="container-fluid" id="w_' + this.idNum + '">'+
                                '<ul class="nav nav-tabs" id="tabs">'+   
                                    '<li role="presentation" class="active" id="addFile"><a href="#divAddFile">+ Add File</a></li>'+
                                '</ul>'+
                                '<div class="tab-content">'+
                                    '<div class="tab-pane fade in active" id="divAddFile">'+
                                    '</div>'+
                                '</div>'+
                            '</div>');

    //this.display();
}

DisplayTabs.prototype = Object.create(Core.prototype);
DisplayTabs.prototype.constructor = DisplayTabs;

//Methode addTab
DisplayTabs.prototype.addTab = function(opt){ 
    
    var name =  opt.fileName.replace(/(?:\.([^.]+))?$/i,""),
        alreadyExist = false;

    tabTabs.forEach(function(el){
        if(name === el.name){
            alert("File already open !");
            alreadyExist = true;
            return false;
        }
    });

    if(alreadyExist){return false};

    tabTabs.push(new Tab({name:name,pdbObj: opt.pdbObj,tabList: '#tabs',tabAdd:'#addFile',container: '.tab-content', pdbText : opt.pdbText}));

    var navDT = function(name){

        $("." + name + " a").click();

        $("." + name + " i").on('click',function(){

            var index = tabTabs.findIndex(function(element){return element.name == name}),
                      nextClassName = (tabTabs.length > 1 && index !== tabTabs.length - 1) ? tabTabs[index +1].name : false,
                      prevClassName = (tabTabs.length > 1 && index !== 0) ? tabTabs[index - 1].name : false ;

            //console.log(index);

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
            
        });
    }

    $(".nav-tabs a").click(function(){
        $(this).tab('show');
    });

    return {navDT :navDT(name), name : name};
};



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////// TAB //////////////////////////////////////////////////////////////////////////////////////////////////////
var Tab = function(opt){
    var self = this;
    var nArgs = opt ? opt : {};
   
   Core.call(this, nArgs);
    
    this.pdbObj = opt.pdbObj;
    this.pdbText = opt.pdbText;
    this.nbJob = 0;//number of job 
    this.name = opt.name;//pdb name
    this.tabList = opt.tabList;//ul
    this.tabClass = "." + name;//tab
    //this.divTabId = "#" + this.name ;
    this.tabAdd = opt.tabAdd;//tab addTab
    this.container = opt.container;
    this.jobs = [];

    //console.log("PDBTEXT" + nArgs.pdbText);

    var initTab = function(){
    	$(self.tabList).append('<li role="presentation" class="'+ self.name +'"><a href="#' + self.name + '">' + self.name + '</a><i class="glyphicon glyphicon-remove-circle"></i></li>');  
	    $(self.container).append('<div class="tab-pane fade container-fluid" id="'+ self.name +'">');
	    $(self.tabList + " li").last().insertBefore(self.tabAdd);

	    self.node = $('#' + self.name)[0];

	    $(self.node).append('<div id="navJobs' + self.name+ '" class="row navJobs"></div>');
	    
	    self.navJobs = $("#navJobs" + self.name)[0];//id liste job

	    $(self.navJobs).append('<button class="btn btn-xs navJobAdd" id="addJob' + self.name +'"><span class="glyphicon glyphicon-plus"></span></button>');

	    self.btnAddJob = $('#addJob' + self.name)[0];

	    $(self.btnAddJob).click(function(){
	        self.addJob();
	    });
    };

    $.when(initTab()).done(function(){
    	self.addJob();
    });

}

Tab.prototype = Object.create(Core.prototype);
Tab.prototype.constructor = Tab;

//#######################################Tab.addJob#########################
Tab.prototype.addJob = function(){
    
    var self = this;

    this.nbJob++;
    $(this.navJobs).append('<button class="btn btn-sm '+ this.name + this.nbJob +' navJob">Job' + this.nbJob +'&nbsp;<i class="glyphicon glyphicon-remove-circle"></i></button>');
    $('.' + this.name + this.nbJob).insertBefore($(this.btnAddJob));
    $(this.node).append('<div class="row divJob" id="'+ this.name + this.nbJob +'"></div>');
    this.jobs.push(new Job({node: $('#' + this.name + this.nbJob)[0] ,nbJob: this.nbJob,name: this.name + this.nbJob,pdbObj: this.pdbObj, pdbText : this.pdbText}));
    //console.log(this.jobs[0].workspace);


    var navJobs = function(name){//Rules of navigation

        $("." + name).click(function(e){
            e.preventDefault();
            $(self.navJobs).find('.navJob').removeClass('navJobActive');
            $(this).addClass('navJobActive');
            $(self.node).find('.divJob').removeClass('divJobActive');
            $(self.node).find('#' + name).addClass('divJobActive');
        }).click();


        $("." + name + " i").on('click',function(){

            var index = self.jobs.findIndex(function(element){return element.name == name}),
                      nextClassName = (self.jobs.length > 1 && index !== self.jobs.length - 1) ? self.jobs[index +1].name : false,
                      prevClassName = (self.jobs.length > 1 && index !== 0) ? self.jobs[index - 1].name : false ;

            
            if ($("." + name).hasClass('navJobActive')){
                      if(nextClassName){
                          $("." + nextClassName).click();
                      }
                      else if(prevClassName){
                          $("." + prevClassName).click();
                      }
            }

            self.jobs.splice(index,1);
            $("." + name).remove();
            $("#" + name).remove();
            
        });
    }
    return navJobs(self.name + self.nbJob);
}
//#########################################################################

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////// JOB //////////////////////////////////////////////////////////////////////////////////////////////////////

var Job = function(opt){
    var self = this;
    
    this.workspace = opt.node;
    this.name = opt.name;
    
    var container = document.createElement('div');
    document.body.appendChild(container);
    container.setAttribute("id", "jobContainer" + opt.name);
    $(container).hide();
    

    //##################################### Launch Jobs ############################################
    this.listWidgets = {pC: null, pS: null, pThreeD: null};
    
    var initJobs = function(){
        //-->PanelControls
        self.listWidgets["pC"] = new PanelControls({root: container});//$(this.workspace)[0];
        
        //-->PdbSummary
        var pS = new PdbSummary({fileName : opt.name, pdbObj : opt.pdbObj, root: container});//$(this.workspace)[0]
        pS.display();
        
        var send = function(pdbObj){//Emit after click Submit
            //socketApp.emit('ardockPdbSubmit', {data : pdbObj.dump(), uuid: "string"});
            socketApp.emit('ardockPdbSubmit', pdbObj.dump());
        };

        pS.on('submit', send);
        
    
        //-->PdbTheeD
        self.listWidgets["pThreeD"] = new PdbThreeD({name: self.name, pdbObj: opt.pdbObj, pdbText : opt.pdbText, root: container});//$(this.workspace)[0]
        
        
        
    };
    
    $.when(initJobs()).done(function(){
        
        $(container).appendTo($(self.workspace)[0]).show();
        
        self.listWidgets["pThreeD"].cC();
        
    });
    
    //##############################################################################################
    


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////// PANEL CONTROLS /////////////////////////////////////////////////////////////////////////////////
// 

var PanelControls = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this,nArgs);
    
    var self = this;
    
    this.panel = null;
    
    //DOM 
    var initPanelControls = function() {
        //panel
        var panel = document.createElement('div');
        self.panel = panel;
        self.panel.setAttribute("id", "panelControls" + self.idNum);
        self.panel.style.height = (window.innerHeight - 230) + "px";
        self.panel.style.width = "180px";
        self.panel.className += "panelControls";
        
    }
    
    $.when(initPanelControls()).done(function(){
        $(self.panel).appendTo(opt.root);
    });
    
}

PanelControls.prototype = Object.create(Core.prototype);
PanelControls.prototype.constructor = PanelControls;

//////////////////////////////////////////////////////////////////////////////////////////// PDB SUMMARY /////////////////////////////////////////////////////////////////////////////////
// Display a summary of a loaded pdb file
var PdbSummary = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);

    var self = this;
    
    this.pdbObj = opt.pdbObj;
    
    var chains = this.pdbObj.model(1).listChainID();
    
    console.log("-->" + chains);



    var scaffold = '<div class="widget pdbSummary" id="w_' + this.idNum + '">';//draggable="true" 
    
    if (chains.length > 0) {
        scaffold += '<div class="panelChains">';//btn-group data-toggle="buttons"

        chains.forEach(function(e,i) {
            scaffold += '<input type="checkbox" class="" name="chainBox" id="' + e + "-" + self.idNum + '" autocomplete="off" checked>' //active btn 
                        + '<label class="checkChains" for="' + e + "-" + self.idNum + '"><div><span>' + e + '</span></div><div class="overlay"></div></label>'; //btn-primary btn btn-default
            if(chains.length > 1 && i < chains.length -1){
                scaffold += '<div class="chainSeparator"><div><span></span></div></div>';
            }
        });
           
        scaffold += '</div>';
    }
    
    scaffold += '<div class="submitChains"><span>PROBE</span><div class="overlay"></div></div></div>' //btn-primary btn-danger btn btn-lg btn-default btn 
    this.scaffold (scaffold);
}

PdbSummary.prototype = Object.create(Core.prototype);
PdbSummary.prototype.constructor = PdbSummary;


PdbSummary.prototype.display = function(event, callback) {

    Core.prototype.display.call(this);
    var self = this;
    
    //Hover a chain
    $(this.node).find(".checkChains").each(function(e){
        $(this).find(".overlay")
            .hover(function(e){
                $(this).css("backgroundColor", "rgba(0,0,0,0.1)");
            })
            .mouseout(function(e){
                $(this).css("backgroundColor", "");
            })
            .click(function(e){
                e.preventDefault();
                e.stopPropagation();
                
                if($("#" + $(this).parent(".checkChains").attr("for")).prop("checked")){
                    $("#" + $(this).parent(".checkChains").attr("for")).prop("checked", false);
                }else{
                    $("#" + $(this).parent(".checkChains").attr("for")).prop("checked", true);                
                }
            })
        ;
    });

    //Click Submit
    $(this.node).find(".submitChains")
            .find(".overlay")
                .click(function() {
                    var chains = [];

                    $(self.node).find('input[name=chainBox]:checked').each(function(e){
                        //chains.push($(this).attr('id'));
                        chains.push((($(this).attr('id')).split("-"))[0]);
                    });
        
                    console.log(chains);

                    if(chains.length){
                        var pdbObj = self.pdbObj.model(1).chain(chains).pull();
                        self.emiter.emit('submit', pdbObj);
                    }else{
                        alert("Neither chain selected !");
                    }

                    })
                    .hover(function(e){
                            $(this).css("backgroundColor", "rgba(0,0,0,0.1)");
                    })
                    .mouseout(function(e){
                            $(this).css("backgroundColor", "");
                    })
    ;
    
    
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////// PDB ThreeD /////////////////////////////////////////////////////////////////////////////////////////////
var PdbThreeD = function(opt){

    var nArgs = opt ? opt : {};

    Core.call(this, nArgs);

    var self = this;

    this.stage = null;
    this.canvas = null;
    this.stageViewer = null;
    this.storeDiv = null;
    
    console.log("OPTNAME : " + opt.name);

    this.divID = "threeD" + opt.name;
    this.pdbObj = opt.pdbObj;
    this.pdbText = opt.pdbText;
    
    var header = document.getElementById("header");

    var createStoreDiv = function(){
        self.storeDiv = document.createElement('div');
        self.storeDiv.setAttribute("id", "storeDiv" + self.divID);
        self.storeDiv.style.height = (window.innerHeight - 230) + "px";
        self.storeDiv.style.width = (header.getBoundingClientRect().width - 210) + "px";
        self.storeDiv.className += "storeDivThreeD";
        
        document.body.appendChild(self.storeDiv);
        
        return {id: $(self.storeDiv).get(0).id, storeD: $(self.storeDiv)[0]} ;
    };
    
    var createCanvas = function(args){
        self.stage = new NGLAA.NGL.Stage(args.id.valueOf());
        self.stage.setParameters({'backgroundColor': 'black'})
        //var stringBlob = new Blob( [ self.pdbText ], { type: 'text/plain'} );
        var stringBlob = new Blob( [ self.pdbObj.dump() ], { type: 'text/plain'} );
        //console.log(self.pdbObj.model(1).chain('C','D').dump());
        self.stage.loadFile(stringBlob,{ext : "pdb", defaultRepresentation:true, asTrajectory: true})
        .then(function(o){
            //var component = stage.compList[0];
            //component.addRepresentation("cartoon", {'sele' : 'protein'});
            //component.addRepresentation("licorice", {'sele': 'not hydrogen and not protein'});
            o.centerView();
            self.stageViewer = o;
        });
        
        $(args.storeD).appendTo($(opt.root));
        
        self.canvas = $(self.storeDiv).find('canvas');
        console.log(self.stage);
    }

    $.when(createStoreDiv()).done(function(args){
        createCanvas(args);
    });
    
    var changeCanvas = function(){
        $(self.storeDiv).detach();
        setTimeout(function(){
            console.log("DETACH");
            $(self.canvas).width(header.getBoundingClientRect().width - 210);
            $(self.storeDiv).appendTo($(opt.root));
            self.stageViewer.centerView;
        },100);
    };

    return {cC: changeCanvas};

};

PdbThreeD.prototype = Object.create(Core.prototype);
PdbThreeD.prototype.constructor = PdbThreeD;

////////////////////////////////////////////////////////////////////////////////// MODULES EXPORT /////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    header : function(opt){ var obj = new Header(opt);return obj; },
    loader : function(opt){ var obj = new Loader(opt);return obj; },
    pdbSummary : function(opt){ var obj = new PdbSummary(opt);return obj; },
    displayTabs : function(opt){ var obj = new DisplayTabs(opt);return obj; },
    uploadBox : function(opt){ var obj = new UploadBox(opt);return obj; }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////