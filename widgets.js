window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;

var NGLVIEW = require('nglview-js');

var events = require('events');



///////////////////////////////////////////////////////////////////////////////////////// GLOBAL //////////////////////////////////////////////////////////////
var test = new NGLVIEW.NGLView("300");
console.log(test);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/*
 *  Definition of the front-end widgets
 *
 */
////////////////////////////////////////////////////////////////////////////////////////// CORE ///////////////////////////////////////////////////////////////
// Base Class provides emiter interface
var Core = function (opt) {

    this.nodeRoot = opt ? 'root' in opt ? $(opt.root)[0] : $('body')[0] : $('body')[0];

    this.emiter = new events.EventEmitter();
    WidgetsUtils.W_counts++;
    this.idNum = WidgetsUtils.W_counts;

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

    WidgetsUtils.socketApp = opt.skt;
    
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

    WidgetsUtils.tabTabs.forEach(function(el){
        if(name === el.name){
            alert("File already open !");
            alreadyExist = true;
            return false;
        }
    });

    if(alreadyExist){return false};

    WidgetsUtils.tabTabs.push(new Tab({name:name,pdbObj: opt.pdbObj,tabList: '#tabs',tabAdd:'#addFile',container: '.tab-content', pdbText : opt.pdbText}));

    var navDT = function(name){

        $("." + name + " a").click();

        $("." + name + " i").on('click',function(){

            var index = WidgetsUtils.tabTabs.findIndex(function(element){return element.name == name}),
                      nextClassName = (WidgetsUtils.tabTabs.length > 1 && index !== WidgetsUtils.tabTabs.length - 1) ? WidgetsUtils.tabTabs[index +1].name : false,
                      prevClassName = (WidgetsUtils.tabTabs.length > 1 && index !== 0) ? WidgetsUtils.tabTabs[index - 1].name : false ;

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

            WidgetsUtils.tabTabs.splice(index,1);
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
    this.stage = null;
    this.canvas = null;
    this.storeDiv = null;
    
    
    this.send = function(pdbObj){//Emit after click Submit ('PROBE')
        //WidgetsUtils.socketApp.emit('ardockPdbSubmit', {data : pdbObj.dump(), uuid: "string"});
        WidgetsUtils.socketApp.emit('ardockPdbSubmit', pdbObj.dump());
    };
    
    this.canvasNGLChange = function(){
        //console.log(self.stage);
        /*setTimeout(function(){
            self.stage.signals.clicked( function( pickingData ){
                WidgetsUtils.clickNGLCanvas(pickingData);
            });
        },100);*/
        console.log(self.canvas);
        $(self.canvas)[0].addEventListener('click', function(e){
            WidgetsUtils.clickNGLCanvas(e.offsetX,e.offsetY,self.stage);
            //console.log(e.offsetX);
        });
    };
    
    var container = document.createElement('div');
    document.body.appendChild(container);
    container.setAttribute("id", "jobContainer" + opt.name);
    $(container).hide();
    

    //##################################### Launch Jobs ############################################
    this.listWidgets = {pC: null, pS: null, pThreeD: null};
    
    var initJobs = function(){
        //-->PanelControls
        self.listWidgets["pC"] = new PanelControls({root: container, job: self});//$(this.workspace)[0];
        
        //-->PdbSummary
        self.listWidgets["pS"] = new PdbSummary({fileName : opt.name, pdbObj : opt.pdbObj, root: container, job: self});//$(this.workspace)[0]
        self.listWidgets["pS"].display();
    
        //-->PdbTheeD
        self.listWidgets["pThreeD"] = new PdbThreeD({name: self.name, pdbObj: opt.pdbObj, pdbText : opt.pdbText, root: container, job: self});//$(this.workspace)[0]
        
    };
    
    //Actions after creating objects 
    $.when(initJobs()).done(function(){
        
        $(container).appendTo($(self.workspace)[0]).show();
        
        self.listWidgets["pThreeD"].ChangeCanvasSize();
        self.canvasNGLChange();
        
        
        self.listWidgets["pS"].setNavigationRules();
        self.listWidgets["pS"].on('submit', self.send);
        
        
        
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
        var panel = WidgetsUtils.getStoreDiv(
            "panelControls" + self.idNum,
            WidgetsUtils.widthPanelControls,
            window.innerHeight - WidgetsUtils.heightUntilWorkspace,
            "panelControls"
        );
        
        self.panel = panel;
    
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
    this.job = opt.job;
    
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

PdbSummary.prototype.setNavigationRules = function(storeDiv, canvas) {
    
    var self = this;
    
    this.removeAddChain = function(){
        var stringBlob = null;
        var chains = [];
        var componentsNGL = null;
        var pdbObjTransformed = null;
        
        
        $(self.job.storeDiv).width($(self.job.storeDiv).width()).height($(self.job.storeDiv).height());
        $(self.job.canvas).remove();
                    
        
        if(($(self.node).find('input[name=chainBox]:checked')).length >= 1){
            
            $(self.node).find('input[name=chainBox]:checked').each(function(e){
                chains.push((($(this).attr('id')).split("-"))[0]);
            });
            
            pdbObjTransformed = self.pdbObj.model(1).chain(chains).pull();
            stringBlob = new Blob( [ pdbObjTransformed.dump() ], { type: 'text/plain'} );
            
        }else{
            console.log("PdbSummary setNavigationRules removeAddChain: Tab chain = null");
        }
                    
        componentsNGL = WidgetsUtils.getNGLComponents(stringBlob, self.job.storeDiv);
                    
        self.job.canvas = componentsNGL.canvas;
        self.job.stage = componentsNGL.stage;
        self.job.canvasNGLChange();
    }
    
    if(self.job.storeDiv === null) {
        console.log("PdbSummary setNavigationRules : job storeDiv = null");
    }   
    if(self.job.canvas === null) {
        console.log("PdbSummary setNavigationRules : job canvas = null");
    }
    
    
    
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
                    
                    //Uncheck chain
                    $("#" + $(this).parent(".checkChains").attr("for")).prop("checked", false);
                    
                    //Move chain from representation
                    self.removeAddChain();
                    
                }else{
                    //Check chain
                    $("#" + $(this).parent(".checkChains").attr("for")).prop("checked", true);
                    
                    //Add chain to representation
                    self.removeAddChain();
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
    
    if(opt.job)    
        this.job = opt.job;
    
    console.log("OPTNAME : " + opt.name);

    this.divID = "threeD" + opt.name;
    this.pdbObj = opt.pdbObj;
    this.pdbText = opt.pdbText;
    
    var header = document.getElementById("header");

    var createCanvasStoreDiv = function(){
        
        self.storeDiv = WidgetsUtils.getStoreDiv(
            "storeDiv" + self.divID,
            header.getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight),
            window.innerHeight - WidgetsUtils.heightUntilWorkspace,
            "storeDivThreeD"
        );
        
        document.body.appendChild(self.storeDiv);
        
        if(self.job)
            self.job.storeDiv = self.storeDiv;
        
        return {storeD: $(self.storeDiv)[0]} ;
    };
    
    var createCanvas = function(args){
        
        var stringBlob = null;
        if(self.pdbObj !== null){
            stringBlob = new Blob( [ self.pdbObj.dump() ], { type: 'text/plain'} );    
        }else{
            console.log("PdbThreeD create canvas : PdbObj = null");
        }
        
        var componentsNGL = null;
        if(stringBlob !== null){
            componentsNGL = WidgetsUtils.getNGLComponents(stringBlob, args.storeD);
        }else{
            console.log("PdbThreeD create canvas : PdbBlob = null");
        }
        
        if(componentsNGL.stage !== null && componentsNGL.canvas !== null){
            self.stage = componentsNGL.stage;
            self.job.stage = componentsNGL.stage;
            
            console.log(self.stage);
            
            self.canvas = componentsNGL.canvas;
            self.job.canvas = componentsNGL.canvas;
        }else{
            console.log("PdbThreeD create canvas : componentsNGL = null");
        }
        
        $(args.storeD).appendTo($(opt.root));
        
    }

    $.when(createCanvasStoreDiv()).done(function(args){
        createCanvas(args);
    });
    
    //Detach storeDiv and resize, then reappend
    var changeCanvas = function(){
        $(self.storeDiv).detach();
        setTimeout(function(){
            
            $(self.canvas).width(header.getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight));
            $(self.storeDiv).appendTo($(opt.root));
            self.stage.viewer.centerView();
            
        },100);
    };

    return {ChangeCanvasSize: changeCanvas};

};

PdbThreeD.prototype = Object.create(Core.prototype);
PdbThreeD.prototype.constructor = PdbThreeD;

////////////////////////////////////////////////////////////////////////////////// Widgets Utils ///////////////////////////////////////////////////////////////////////////////////

//Lib of functions and variables
WidgetsUtils = {
    
    /*
    *Object Core iteration identifier
    *
    *@Integer
    */
    W_counts: 0,
    
    /*
    *Object socket connection from app.js
    *
    *@socket.io
    */
    socketApp: null,
    
    /*
    *List of Tab Objects which are for a single pdb file
    *
    *@Array
    */
    tabTabs: [],
    
    /*
    *The margin left and right of the body document
    *
    *@Integer
    */
    marginBodyLeftRight: 30,
    
    /*
    *The height dimension until the workspace of application
    *
    *@Integer
    */
    heightUntilWorkspace: 230,
    
    /*
    *The width dimension of the PanelControls div element
    *
    *@Integer
    */
    widthPanelControls: 180,
    
    
    /*Return stage, and canvas element from NGLVIEW-JS
    *
    *Append canvas to storeDiv
    *
    *@Params
    *@pdbBlob(StringBlob from pdbtext or pdbobject.dump)
    *@storeDiv(A Dom Element with fixed dimensions)
    *
    */
    getNGLComponents: function(pdbBlob, storeDiv) {
        var id = $(storeDiv).get(0).id;
        var stage = null;
        var canvas = null;
        
        stage = new NGLVIEW.NGL.Stage(id.valueOf());
        
        if(pdbBlob !== null){ 
            stage.setParameters({'backgroundColor': 'black'})
            
            stage.loadFile(pdbBlob,{ext : "pdb", defaultRepresentation:true, asTrajectory: true})
            .then(function(o){//o = nr --> structure
                //var component = stage.compList[0];
                //component.addRepresentation("cartoon", {'sele' : 'protein'});
                //component.addRepresentation("licorice", {'sele': 'not hydrogen and not protein'});
                o.viewer.centerView();
                //console.log(o);        
            });            
        }
        
        stage.signals.clicked.add(function(pd) {
            var pd2 = {};
            if (pd.atom) {
                pd2.atom = pd.atom.toObject();
                console.log("ATOM : ");
                console.log(pd.atom);
                console.log("RESIDUEBONDS : ");
                console.log(pd.atom.getResidueBonds()); //donne les atomes en lien permet éventuellement de récupérer l'index des atomes de l'acide aminé
            }
            if (pd.bond){
                pd2.bond = pd.bond.toObject();
                console.log("BOND : ");
                console.log(pd.bond);
            }
            if (pd.instance){
                pd2.instance = pd.instance;
                console.log("INSTANCE : ");
                console.log(pd.instance);
            } 
                
            //this.model.set("picked", pd2);
            //this.touch();
            var pickingText = "";
            if (pd.atom) {
                console.log("PICKING DATA : ");
                console.log(pd);
                //console.log(pd.atom.residue);
                var residueIndex = pd.atom.residue.index;
                var structure = stage.compList[0].structure;
                var residueProxy = pd.atom.residue;
                
                //var colorMaker = NGLVIEW.NGL.colorMaker({residueindex: residueIndex, color:255}, structure);
                
                console.log(NGLVIEW.NGL);
                
                //console.log("ResProx : ");
                console.log("RESIDUE INDEX : ")
                console.log(residueIndex);
                
                
                //pd.atom.residue : resno + resname + residueType
                
                //console.log(structure.getResidueProxy(residueIndex));
                console.log("RESNO - RESNAME - RESIDUETYPE");
                console.log(residueProxy.resno);
                console.log(residueProxy.resname);
                console.log(residueProxy.residueType);
                
                console.log("GETBONDS OF RESIDUETYPE : ");
                console.log(residueProxy.residueType.getBonds());
                
                console.log("getBondReferenceAtomIndex OF RESIDUETYPE : ");
                console.log(residueProxy.residueType.getBondReferenceAtomIndex());
                
                console.log("traceAtomIndex OF RESIDUETYPE : ");
                console.log(residueProxy.residueType.traceAtomIndex);
                
                //console.log("traceAtomIndex OF RESIDUETYPE : ");
                //console.log(residueProxy.residueType.traceAtomIndex());
                
                //residueType.traceAtomIndex + this.atomOffset
                
                
                
                
                pickingText = "Atom: " + pd.atom.qualifiedName();
            } else if (pd.bond) {
                pickingText = "Bond: " + pd.bond.atom1.qualifiedName() + " - " + pd.bond.atom2.qualifiedName();
            }
            
            console.log(stage);
            
            console.log(pickingText);
            //this.$pickingInfo.text(pickingText);
            
        }, this);
        
        canvas = $(storeDiv).find('canvas');
        
        return {stage: stage, canvas: canvas};
    },
    
    /*Return a div element with 
    *
    *@Div Element
    *
    *@Params (all are optional)
    *@width (Integer)
    *@height (Integer)
    *@id (String)
    *@classes (String)
    */
    getStoreDiv: function(id = null, width = null, height = null, classes = null){
        var storeDiv = null;
        storeDiv = document.createElement('div');
        
        if(id !== null)
            storeDiv.setAttribute("id", id.valueOf());
        if(height !== null)
            storeDiv.style.height = height + "px";
        if(width !== null)
            storeDiv.style.width = width + "px";
        if(classes !== null)
            storeDiv.className += classes.valueOf();
        
        //document.body.appendChild(self.storeDiv);
        
        return storeDiv;
    },
    
    
    /*Click make an action on canvas NGL
    *
    *@pickingData Object from NGLVIEW-JS
    */
    clickNGLCanvas: function(c, d, stage){
        /*var a = new Float32Array(4),
            b = new Uint8Array(4);
        //return function (c, d) {
            c *= window.devicePixelRatio;
            d *= window.devicePixelRatio;
            var e, f, g, h = NGLVIEW.NGL.supportsReadPixelsFloat ? a : b;
            stage.viewer.render(null, !0);
            stage.viewer.renderer.readRenderTargetPixels(stage.viewer.pickingTarget, c, d, 1, 1, h);
            e = NGLVIEW.NGL.supportsReadPixelsFloat ? Math.round(255 * h[0]) << 16 & 16711680 | Math.round(255 * h[1]) << 8 & 65280 | Math.round(255 * h[2]) & 255 : h[0] << 16 | h[1] << 8 | h[2];
            (f = stage.viewer.pickingGroup.getObjectById(Math.round(h[3]))) && f.userData.instance && (g = f.userData.instance);
            NGLVIEW.NGL.debug && (f = Array.apply([], h), NGLVIEW.NGL.log(h), NGLVIEW.NGL.log("picked color", [f[0].toPrecision(2), f[1].toPrecision(2), f[2].toPrecision(2), f[3].toPrecision(2)]), NGLVIEW.NGL.log("picked gid", e), NGLVIEW.NGL.log("picked instance", g), NGLVIEW.NGL.log("picked position", c, d), NGLVIEW.NGL.log("devicePixelRatio", window.devicePixelRatio));
            //return {
            //    gid: e,
            //    instance: g
            //}
        //}*/
    
        /*c *= window.devicePixelRatio;
        d *= window.devicePixelRatio;
        
        var data = stage.viewer.pick(c,d);
        console.log(data);*/
        //console.log(JSON.stringify(stage));
        //console.log(e);
        //console.log(g);
        //console.log("STAGE WIDGETUTIL :");
        //console.log(stage);
        
        
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////// MODULES EXPORT /////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    header : function(opt){ var obj = new Header(opt);return obj; },
    loader : function(opt){ var obj = new Loader(opt);return obj; },
    pdbSummary : function(opt){ var obj = new PdbSummary(opt);return obj; },
    displayTabs : function(opt){ var obj = new DisplayTabs(opt);return obj; },
    uploadBox : function(opt){ var obj = new UploadBox(opt);return obj; }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////