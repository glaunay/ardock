window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;

//var NGLVIEW = require('nglview-js');

var NGL = require('ngl');

var events = require('events');



///////////////////////////////////////////////////////////////////////////////////////// GLOBAL //////////////////////////////////////////////////////////////
//var test = new NGLVIEW.NGLView("300");
//console.log(test);

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
    this.targetInput = null;
   
    this.scaffold ('<div class="widget uploadBox dropzone container-fluid" id="w_' + this.idNum + '">'
                    + '<div class="btn btn-primary browse">Browse</div>'
                    + '<p>Or DrOp File(s) (.pdb, .fasta)</p>'
                    + '<div class="btn btn-info test-pdb">Test 4MOW</div>'
                    + '<p class="info" style="color: red"></p>'
                    + '<input type="file" style="display:none" accept=".pdb,.fasta" multiple/>'
                    + '</div>');
   
    this.display();
   
    this.input = $(this.node).find('input')[0];
   
    $(this.input).on('change', function(){ self.emiter.emit('change', self.input, self); });

    $(this.node).find('div.browse').on('click', function(){
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
    
      $(".dropzone").height($(document.body).height() - (WidgetsUtils.heightUntilNavJob + WidgetsUtils.heightFooter));
    //###########################################################
    
    //Click button TEST PDB
    $(".test-pdb").click(function(e){
        var waitLoader = new Loader({root: $('.tab-content')});
        waitLoader.display();
        
        var alreadyExist = false;
        
        WidgetsUtils.tabTabs.forEach(function(el){
            if(el.name === "4MOW"){
                waitLoader.destroy();
                alert("File already open !");
                alreadyExist = true;
                return false;
            }
        });
        
        if ( alreadyExist ) { return false }
        
        console.log("AJAX");
        
        $.ajax({
            url: 'http://srdev.ovh:8081/4MOW',//?fileFormat=pdb&compression=NO&structureId=4MOW
            type: 'GET',
            success: function(file) {
                console.log(file);
                var s = WidgetsUtils.stream.Readable();
                s.push(file, 'utf-8');
                s.push(null);
                var pdbParse = WidgetsUtils.pdbLib.parse({'rStream': s})
                    .on('end', function (pdbObjInp) {
                        var opt = {fileName: "4MOW", pdbObj: pdbObjInp};
                        waitLoader.destroy();
                        var navDT = WidgetsUtils.displayTabs.addTab(opt);
                    });
            },
            error: function(jqXHR, textStatus, error){
                waitLoader.destroy();
                $(".info").text("Oups ! it seems something is broken : " + jqXHR.responseText  + " " + textStatus + ((error)? " - " + error : ""));
                setTimeout(function(){$(".info").text("")},5000);
            },
            timeout: 8000,

        });
    });
    
    $(".browse").css("margin-top", (($(document.body).height() - (WidgetsUtils.heightUntilNavJob + WidgetsUtils.heightFooter)) / 2) - 50);
    
    $(window).resize(function(e){
        $(".dropzone").height($(document.body).height() - (WidgetsUtils.heightUntilNavJob + WidgetsUtils.heightFooter));
        $(".browse").css("margin-top", (($(document.body).height() - (WidgetsUtils.heightUntilNavJob + WidgetsUtils.heightFooter)) / 2) - 50);
    });

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
    this.widgetsUtils = WidgetsUtils;
    
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
    //return {widgetsUtils: WidgetsUtils};
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
        //rezise elements
        setTimeout(function(){$(window).trigger('resize');}, 160);
        //show
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
    var job = new Job({node: $('#' + this.name + this.nbJob)[0] ,nbJob: this.nbJob,name: this.name + this.nbJob,pdbObj: this.pdbObj, pdbText : this.pdbText});
    this.jobs.push(job);
    //WidgetsUtils.tabJobs.push(job);


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
    this.pdbObj = opt.pdbObj;
    this.uuid = WidgetsUtils.getUUID();
    this.probe = 1;
    this.pdbOjProbeList = [];
    this.currentSchemeID = null;
    this.currentSelection = null;
    this.removeAddChainPdb = opt.pdbObj;
    this.structureComponent = null;
    this.baseRepresentation = null;
    
    
    
    this.send = function(pdbObj){//Emit after click Submit ('PROBE')
        WidgetsUtils.socketApp.emit('ardockPdbSubmit', {data : pdbObj.dump(), uuid: self.uuid});
        //WidgetsUtils.socketApp.emit('ardockPdbSubmit', pdbObj.dump());
    };
    
    this.canvasNGLChange = function(){
        $(self.canvas)[0].addEventListener('click', function(e){
            //WidgetsUtils.clickNGLCanvas(e.offsetX,e.offsetY,self.stage);
            
        });
        
        $(self.canvas)[0].addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            console.log('success!');
            return false;
        }, false);
        
        $(self.canvas).one('mouseover', function(e){
            //WidgetsUtils.clickNGLCanvas(e.offsetX,e.offsetY,self.stage);
            //console.log("MOUSE OVER CANVAS !!!");
            self.stage.handleResize();
        });
    };
    
    var container = document.createElement('div');
    document.body.appendChild(container);
    container.setAttribute("id", "jobContainer" + opt.name);
    $(container).hide();
    

    //##################################### Launch Jobs ############################################
    this.listWidgets = {pC: null, pS: null, pThreeD: null, magnify: null};
    
    var initJobs = function(){
        //-->PanelControls
        self.listWidgets["pC"] = new PanelControls({root: container, job: self});//$(this.workspace)[0];
        
        //-->PdbSummary
        self.listWidgets["pS"] = new PdbSummary({fileName : opt.name, pdbObj : opt.pdbObj, root: self.listWidgets["pC"].panel, job: self, UUID: self.uuid});
        self.listWidgets["pS"].display();
    
        //-->PdbTheeD
        self.listWidgets["pThreeD"] = new PdbThreeD({name: self.name, pdbObj: opt.pdbObj, pdbText : opt.pdbText, root: container, job: self, UUID: self.uuid});
        
        //Get just one Magnify Object
        if(!($(document.body).find(".magnify").length)){
            //-->Magnify
            self.listWidgets["magnify"] = new Magnify({job: self});
        }
        
        
    };
    
    //Actions after creating objects 
    $.when(initJobs()).done(function(){
        
        $(container).appendTo($(self.workspace)[0]).show();
        
        
        self.listWidgets["pThreeD"].ChangeCanvasSize();
        self.canvasNGLChange();
        
        $(window).resize(function(e){
            $(self.storeDiv).width("auto").height("auto");
            $(self.canvas)
                .width(header.getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight))
                .height(WidgetsUtils.getHeightLeft())//window.innerHeight - WidgetsUtils.heightUntilWorkspace)
            ;
            
            self.stage.handleResize();
            
            $(self.listWidgets.pC.panel).height($(self.canvas).height());
            $(self.storeDiv).height($(self.canvas).height());
            
            
        });
        //self.stage.handleResize();
        
        
        self.listWidgets["pS"].setNavigationRules();
        self.listWidgets["pS"].on('submit', self.send);  
        
        WidgetsUtils.tabJobs.push(self);
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
            WidgetsUtils.getHeightLeft(),//window.innerHeight - WidgetsUtils.heightUntilWorkspace,
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

//////////////////////////////////////////////////////////////////////////////////////////// Magnify /////////////////////////////////////////////////////////////////////////////////
// 

var Magnify = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this,nArgs);
    
    var self = this;
    
    this.panel = null;
    
    //DOM 
    var initMagnify = function() {
        //panel
        var magnify = WidgetsUtils.getStoreDiv(
            "magnify" + self.idNum,
            50,
            50,
            "magnify"
        );
        
        magnify.style.position = "absolute";
        
        self.magnify = magnify;
    }
    
    $.when(initMagnify()).done(function(){
        $(self.magnify).appendTo(document.body);
        $(self.magnify).hide();
    });
    
}

Magnify.prototype = Object.create(Core.prototype);
Magnify.prototype.constructor = Magnify;

//////////////////////////////////////////////////////////////////////////////////////////// PDB SUMMARY /////////////////////////////////////////////////////////////////////////////////
// Display a summary of a loaded pdb file
var PdbSummary = function(opt) {
    
    var nArgs = opt ? opt : {};
    
    Core.call(this, nArgs);

    var self = this;
    
    this.pdbObj = nArgs.pdbObj;

    this.UUID = nArgs.UUID;
    this.NGLComponent = null;
    
    var chains = this.pdbObj.model(1).listChainID();
    
    var scaffold = '<div class="widget pdbSummary" id="w_' + this.idNum + '">';//draggable="true" 
    
    if (chains.length > 0) {
        scaffold += '<div class="panelChains">';//btn-group data-toggle="buttons"
        
        /*chains.forEach(function(e,i) {
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
        
        */
        scaffold += '<div class="submitChainsContainer">' 
                        +'<div class="border"></div>'
                        +'<div class="submitChains">'
                            +'<span>GO</span>'
                            //+'<span class="joinChain"></span>'
                            + '<div class="overlay"></div>'
                        +'</div>'
                   +'</div>'
                   +'<div class="chainSeparator">'
                        +'<div class="border"></div><span></span>'
                   +'</div>'
        ; 
        
        chains.forEach(function(e,i) {
            scaffold += '<input type="checkbox" class="" name="chainBox" id="' + e + "-" + self.idNum + '" autocomplete="off" checked>' //active btn 
                        + '<div class="checkChainsContainer"><div class="border"></div><label class="checkChains" for="' + e + "-" + self.idNum + '"><span class="disable-select">' + e + '</span><div class="overlay"></div></label></div>'; //btn-primary btn btn-default //<span class="joinChain"></span>
            if(chains.length > 1 && i < chains.length -1){
                scaffold += '<div class="chainSeparator"><div class="border"></div><span></span></div>';
            }
        });
           
        scaffold += '</div></div>';
    }
    
     
    this.scaffold (scaffold);
}

PdbSummary.prototype = Object.create(Core.prototype);
PdbSummary.prototype.constructor = PdbSummary;

PdbSummary.prototype.setNavigationRules = function() {//storeDiv, canvas
    
    var self = this;
    
    //Hover, mouseout, click a chain
    $(this.node).find(".checkChains").each(function(e){
        $(this).find(".overlay")
            .hover(function(e){
                if(($("#" + $(this).parent(".checkChains").attr("for")).prop("checked"))){
                    $(this).parent(".checkChains").css("background-color", "dimgray");    
                }
                $(this).css("backgroundColor", "rgba(0,0,0,0.1)");
            })
            .mouseout(function(e){          
                if(($("#" + $(this).parent(".checkChains").attr("for")).prop("checked"))){
                    $(this).parent(".checkChains").css("background-color", "white");
                }
                $(this).css("backgroundColor", "");
            })
            .click(function(e){
                e.preventDefault();
                e.stopPropagation();
            
                if(self.NGLComponent === null){
                    self.NGLComponent = WidgetsUtils.tabNGLComponents[self.UUID];
                }
                
                var $checkboxElement = $("#" + $(this).parent(".checkChains").attr("for"));
                var targetChain = $checkboxElement.attr('id').split("-")[0];        
                
                if($("#" + $(this).parent(".checkChains").attr("for")).prop("checked")){
                    
                    //Uncheck chain
                    $("#" + $(this).parent(".checkChains").attr("for")).prop("checked", false);
                    
                    //Change background color of the label
                    $(this).parent(".checkChains").css("background-color", "dimgray");
                                
                    //Remove chain from representation
                    WidgetsUtils.removeAddChain(self.UUID, targetChain, false);
                    
                    
                }else{
                    //Check chain
                    $("#" + $(this).parent(".checkChains").attr("for")).prop("checked", true);
                    
                    //Change background color of the label
                    $(this).parent(".checkChains").css("background-color", "white");
                    
                    //Add chain to representation
                    WidgetsUtils.removeAddChain(self.UUID, targetChain, true);
            
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
    this.structureComponent = null;
    this.UUID = nArgs.UUID;
    //this.baseRepresentation = null;
    //this.currentChainsVisible = nArgs.pdbObj.model(1).listChainID();
    
    if(opt.job)    
        this.job = opt.job;
    
    //console.log("OPTNAME : " + opt.name);

    this.divID = "threeD" + opt.name;
    this.pdbObj = opt.pdbObj;
    this.pdbText = opt.pdbText;
    
    var header = document.getElementById("header");

    var createCanvasStoreDiv = function(){
        
        self.storeDiv = WidgetsUtils.getStoreDiv(
            "storeDiv" + self.divID,
            header.getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight),
            WidgetsUtils.getHeightLeft(),//window.innerHeight - WidgetsUtils.heightUntilWorkspace,
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
            //stringBlob = new Blob( [ self.pdbText ], { type: 'text/plain'} );
        }else{
            console.log("PdbThreeD create canvas : PdbObj = null");
        }
        
        var componentsNGL = null;
        if(stringBlob !== null){
            componentsNGL = WidgetsUtils.getNGLComponents(stringBlob, args.storeD, self.pdbObj, self.UUID);
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
    *Object stream from app.js
    *
    *@stream
    */
    stream: null,
    
    /*
    *Object pdbLib from app.js
    *
    *@pdb-lib
    */
    pdbLib: null,
    
    /*
    *Object displayTab from app.js
    *
    *@DisplayTab
    */
    displayTabs: null,
    
    /*
    *List of Tab Objects which are for a single pdb file
    *
    *@Array
    */
    tabTabs: [],
    
    /*
    *List of Job Objects
    *
    *@Array
    */
    tabJobs: [],
    
    
    /*
    *List of NGLComponents by uuid
    *
    *@Array of objects(Key:uuid --> can be generated by WidgetUtils.getUUID())
    *(properties : stage, structureComponent, baseRepresentation, canvas)
    *
    */
    tabNGLComponents: [],
    
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
    heightUntilWorkspace: 199,
    
    /*
    *The height dimension until div navJob
    *
    *@Integer
    */
    heightUntilNavJob: 158,
    
    /*
    *The height dimension of the footer
    *
    *@Integer
    */
    heightFooter: 15,
    
    /*
    *Return height dimension between the begin of the workspace and footer
    *
    *@Integer
    */
    getHeightLeft: function(){
        return $(document.body).height() - (WidgetsUtils.heightUntilWorkspace + WidgetsUtils.heightFooter);
    },
    
    /*
    *The width dimension of the PanelControls div element
    *
    *@Integer
    */
    widthPanelControls: 180,
    
    /*
    *The position x and y, in px of the mouse on the page
    *
    *@Integer
    */
    mousePagePosition: {
        x: null,
        y: null
    },
    
    
    /*
    *List of molecular representation
    *
    *@Array
    */
    tabRepresentationType : ["tube", "cartoon", "ribbon", "trace", "rope","spacefill", "ball+stick",
                             "licorice", "hyperball", "backbone", "rocket", "helixorient", "contact", "distance", "dot"],
    
    /*
    *List of color that NGL use
    *
    *@Array
    */
    /*tabColorScheme : ["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue",
                      "chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen",
                      "darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray",
                      "darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen",
                      "fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","green","greenyellow","grey","honeydew","hotpink","indianred","indigo","ivory","khaki",
                      "lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey",
                      "lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen",
                      "magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise",
                      "mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid",
                      "palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","red","rosybrown",
                      "royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen",
                      "steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"],*/
    
    
    /*
    *List of color that NGL use
    *
    *@Array
    */
    tabColorScheme :  {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
                       "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
                       "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
                       "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b",
                       "darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b",
                       "darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
                       "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700",
                       "goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0","hotpink":"#ff69b4","indianred ":"#cd5c5c",             "indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd",
                       "lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1",
                       "lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0",
                       "lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd",
                       "mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc",
                       "mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080",
                       "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa","palegreen":"#98fb98",
                       "paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6",
                       "purple":"#800080","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57",
                       "seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f",
                       "steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3",
                       "white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd32"}, //,"red":"#ff0000" remove for picking data when click
    
    
    /*
    *List of color that NGL use and have a good contrast against red
    *
    *@Array
    */
    tabColorSchemePrefered : ["mediumspringgreen","silver","turquoise","olive","lightgrey"], //,"ivory","beige"
    
    
    /*
    *List of prefix opacity for hexadecimal colors, + to -
    *
    *@Array
    */
    tabHexaOpacityPrefix : ["FF","F2","E6","D9","CC","BF","B3","A6","99","8C","80","73","66","59","4D","40","33","26","1A","0D","00"],
    
    
    /*
    *List of gray's color, light to dark
    *
    *@Array
    */
    tabShadeOfGray : ["#d3d3d3","#bdbdbd","#a8a8a8","#939393","#7e7e7e","#696969","#545454","#3f3f3f","#2a2a2a","#151515","#000000"],
    
    
    /*
    *Return stage, and canvas element from NGLVIEW-JS
    *Append canvas to storeDiv
    *
    *@Params
    *@pdbBlob(StringBlob from pdbtext or pdbobject.dump)
    *@storeDiv(A Dom Element with fixed dimension, could be generated by WidgetUtils.getStoreDiv)
    *@pdbObj(PdbLib object)
    *@representationType(ex:"cartoon","ball+stick")
    *
    */
    getNGLComponents: function(pdbBlob, storeDiv, pdbObj, uuid, representationType = null) {
        var id = $(storeDiv).get(0).id;
        var stage = null;
        var canvas = null;
       
        var structureComponent = null;
        var baseRepresentation = null;
        
        var rType = representationType;
        if(rType === null || WidgetsUtils.tabRepresentationType.indexOf(rType) === -1){
            rType = "cartoon";
        }
        
        stage = new NGL.Stage(id.valueOf());
          
        if(pdbBlob !== null){ 
            stage.setParameters({'backgroundColor': 'black'})
            
            try{
            
                stage.loadFile(pdbBlob,{ext : "pdb", defaultRepresentation:false, asTrajectory: true})
                .then(function(o){//o = --> structureComponent
                    var baseRepresentation = o.addRepresentation(rType, {'color': WidgetsUtils.getNGLScheme(pdbObj.model(1).listChainID())});
                    var structureComponent = o;
                    //var canvas = canvas = $(storeDiv).find('canvas');
                
                    WidgetsUtils.tabNGLComponents[uuid] = { stage: stage,
                                                            structureComponent: structureComponent,
                                                            baseRepresentation: baseRepresentation,
                                                            baseChain: pdbObj.model(1).listChainID(),
                                                            currentChainsVisible: pdbObj.model(1).listChainID(),
                                                            storeDiv: storeDiv,
                                                            canvas: canvas,
                                                            lastSelection: ":",
                                                            probe: 0,
                                                            pdbObj: pdbObj
                                                          };
                    stage.centerView();
                    
                    WidgetsUtils.setNGLClickedFunction(uuid);
                    WidgetsUtils.setNGLHoveredFunction(uuid);
                });          
            
            }catch(e){
                console.warn("Error : Pdb file seems not complete or is corrupted");
                console.warn(e);
            }
             
        }else{
            console.warn("WidgetUtils getNGLComponent function : pdbBlob === null");
            return;
        }
        
        canvas = $(storeDiv).find('canvas');
        
        
        return {stage: stage, canvas: canvas, UUID: uuid};     
    },
    
    
    /*
    *Return a string represent a random color name in tabColorScheme (note this color can't be in tabColorSchemePrefered)
    */
    getRandomColor : function(){
        var tabColor = Object.keys(WidgetsUtils.tabColorScheme);
        
        //console.log(tabColor);
        
        var index = parseInt(Math.floor(Math.random() * tabColor.length)); //WidgetsUtils.tabColorScheme
        //console.log(index);
        var colorName = tabColor[index];
        
        
        console.log(colorName);
        
        if(WidgetsUtils.tabColorSchemePrefered.indexOf(colorName) !== -1){
            colorName = WidgetsUtils.getRandomColor();
        }
          
        if(WidgetsUtils.tabColorSchemePrefered.indexOf(colorName) === -1){
            WidgetsUtils.tabColorSchemePrefered.push(colorName);
        }
        console.log(WidgetsUtils.tabColorSchemePrefered);
        return colorName;
    },
    
    
    /*
    *Return a custom NGL scheme color representation from pdbObj
    *
    *@Params (both optional, if emty return an empty colorScheme)
    *@baseChain (Array with String represent a chain to color)
    *@additionalRange (Array of String(s)/NGL Expression -  wich represent a residue to color in red)
    *
    */                  
    getNGLScheme : function(baseChain = null, additionalRange = null){
        var chains = null;
        var chainsFull = null;
        var tabDefinition = [];
       
        //Push some additional conditions in tabDefinition
        if(null !== additionalRange){
            for(a = 0; a < additionalRange.length; a++){
                tabDefinition.push(additionalRange[a]);
            }    
        }
        
        //Push chains with color picked in tabColorSchemePrefered or a random color if chains[] length > 
        if(null !== baseChain){
            
            chains = baseChain;
            
            for(i = 0; i < chains.length; i++){
                var index = null;
                var colorChain = null;
                var rangeClassic = null;

                colorChain = WidgetsUtils.tabColorSchemePrefered[i];

                rangeClassic =  ":" + chains[i];

                if( i > WidgetsUtils.tabColorSchemePrefered.length - 1){ colorChain = WidgetsUtils.getRandomColor() }

                tabDefinition.push([colorChain, rangeClassic]);
            }
        }
        
        var schemeId = NGL.ColorMakerRegistry.addSelectionScheme( tabDefinition, "ardock" );
        
        return schemeId;
    },
    
    
    /*
    *Remove listener(s) clicked and add a new which change the representation to color a clicked residue
    *
    *@Params
    *@uuid (String represent the key of an Ardock nglComponent object which is in tabNGLComponents)
    *
    */   
    setNGLClickedFunction : function(uuid){
        
        var nglComponent = WidgetsUtils.tabNGLComponents[uuid];
        
        nglComponent.stage.signals.clicked.removeAll();    
        
        nglComponent.stage.signals.clicked.add(function(pd) {          
            if (pd.atom) {
                var chainName = pd.atom.chainname;
                var resno = pd.atom.resno;
                var additionalRange = [["red", ":" + chainName + " and " + resno]];
                var schemeId = WidgetsUtils.getNGLScheme(nglComponent.baseChain, additionalRange);//, nglComponent.currentChainsVisible);
                
                nglComponent.baseRepresentation.setParameters({'colorScheme': schemeId});
                nglComponent.baseRepresentation.update({'color':true});
            }
        });
    },
    
    
    /*
    *Remove listener(s) Hovered and add a new which display a div with atom info of a hovered residue
    *
    *@Params
    *@uuid (String represent the key of an Ardock nglComponent object which is in tabNGLComponents)
    *
    */
    setNGLHoveredFunction : function(uuid){
        
        var nglComponent = WidgetsUtils.tabNGLComponents[uuid];
        
        nglComponent.stage.signals.hovered.removeAll();
        
        nglComponent.stage.signals.hovered.add(function(pd) {
            if(pd.atom){
                //$(document.body).find(".magnify").stop();
                
                var $magnify = $(document.body).find(".magnify");
                
                $magnify
                    .css("background-color", "rgba(255,255,255,0.8)")
                    .css("padding", "10px")
                    .css("width", "auto")
                    .css("height", "auto")
                    .css("border-radius", "15px")
                    .css("left", (WidgetsUtils.mousePagePosition.x + 1) + "px")
                    .css("top", (WidgetsUtils.mousePagePosition.y + 1) + "px")
                    .text("Atom: " + pd.atom.qualifiedName())
                    .stop(true,true)
                    .show()
                    .fadeOut(6000)
                ;
                
                var widthBody = document.body.clientWidth;
                var heightBody = document.body.clientHeight;
                var widthMagnify = parseInt($magnify.css('width'));
                var heightMagnify = parseInt($magnify.css('height'));
                var leftMagnify = parseInt($magnify.css('left'));
                var topMagnify = parseInt($magnify.css('top'));
                
                
                if(widthBody < (leftMagnify + widthMagnify)){
                    $magnify.css("left", (widthBody + 1 - (widthMagnify * 2)) + "px");
                }
                
                if(heightBody < (topMagnify + heightMagnify)){
                    $magnify.css("top", (heightBody + 1 - (heightMagnify * 2)) + "px");
                }
            }
            
        });
    },

    
    /*
    *Remove or add a chain of the base representation from a NGL stage component
    *
    *@Params
    *@uuid (String represent the key of an Ardock nglComponent object which is in tabNGLComponents)
    *@targetChain (String represent the chain to add or remove)
    *@addOrRemove (Boolean : true if add, false if remove)
    */
    removeAddChain : function(uuid, targetChain, addOrRemove){
            var nglComponent = WidgetsUtils.tabNGLComponents[uuid];    
            
            var indexColor = nglComponent.baseChain.indexOf(targetChain);
            var chainAddRemoveColor = WidgetsUtils.tabColorSchemePrefered[indexColor];
            var chainAddRemoveRepresentation = null;
            
            var selectionVisible = "";
  
            var cCV = nglComponent.currentChainsVisible;
            if( !addOrRemove ) { cCV.splice(cCV.indexOf(targetChain),1) }
        
            selectionVisible = cCV.map((chain,i,tab) => { return ":" + chain + ((tab.length <= 1) ? "" : (i === (tab.length - 1)) ? "" : " OR ") } ).join('');
            
            if( !selectionVisible.length ){ selectionVisible = "NOT:" }
        
            nglComponent.lastSelection = selectionVisible;
            
            if(!addOrRemove){ nglComponent.baseRepresentation.setSelection(selectionVisible.valueOf()) }
        
            var schemeId = WidgetsUtils.getNGLScheme(null,[[chainAddRemoveColor , ":" + targetChain]]);
                            
            var sele = "";
            if(addOrRemove){sele = ":NOT"}else{sele = ":" + targetChain}
            
            chainAddRemoveRepresentation = nglComponent.structureComponent.addRepresentation("cartoon", {'color': schemeId, 'sele': sele, 'opacity': (addOrRemove)? 0 : 1});
            chainAddRemoveRepresentation.name = "ardock";
        
            if( addOrRemove ) { nglComponent.currentChainsVisible.push(targetChain) }
  
            var iteration = 60;//40
            var timeOut = 10;//16
            //console.log("opacity");
            var fadeChain = function(i){
                //var faderAdd = (i > (iteration - 15))? 1.5 : 2; //  / faderAdd
                var opacity = (addOrRemove)? parseFloat((i * (1 / iteration)))  : parseFloat((iteration - i) * (1 / iteration));
                if(i === iteration - 2){
                    opacity = (addOrRemove)? 1 : 0;
                }
                var timeOuty = i * timeOut;
                var lastSelection = nglComponent.lastSelection;
                
                //console.log(opacity);
                
                if(i === iteration - 1){
                    if(addOrRemove){
                        setTimeout(function(){
                            selectionVisible += " OR :" + targetChain;
                            nglComponent.structureComponent.removeRepresentation(chainAddRemoveRepresentation);
                            nglComponent.baseRepresentation.setSelection(selectionVisible);
                            chainAddRemoveRepresentation.setSelection('NOT:');
                            chainAddRemoveRepresentation = null;
                        },timeOuty);
                    }else{
                        setTimeout(function(){
                            nglComponent.structureComponent.removeRepresentation(chainAddRemoveRepresentation);
                            chainAddRemoveRepresentation.setSelection('NOT:');
                            chainAddRemoveRepresentation = null;
                        },timeOuty);
                    }
                }else{
                    setTimeout(function(){
                        
                        if(addOrRemove && i === 0){
                        chainAddRemoveRepresentation.setParameters({'opacity': opacity});
                        chainAddRemoveRepresentation.update({'opacity':true});
                        chainAddRemoveRepresentation.setSelection(":" + targetChain);
                        }else if(!addOrRemove){
                            nglComponent.baseRepresentation.setSelection(lastSelection);
                            chainAddRemoveRepresentation.setParameters({'opacity': opacity});
                            chainAddRemoveRepresentation.update({'opacity':true});
                        }else{
                            chainAddRemoveRepresentation.setParameters({'opacity': opacity});
                            chainAddRemoveRepresentation.update({'opacity':true});
                        }
                        
                    },timeOuty);
                }
            };
              
            for(i = 0; i < iteration; i++){
                fadeChain(i);
            }
    },
    
    
    /*
    *Return a div element with 
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
        
        return storeDiv;
    },
    
    
    /*
    *Return a UUID generated dynamicly
    *
    *@return String
    */
    getUUID: function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    
    
    /*
    *Operations on job when server response
    *
    *@Object literal with function(s)
    */
    jobOperations: {
        
        /*Change the color of residues depending of bfactor
        *
        *@function
        *
        *@Params
        *data(object with properties pdbObj, uuid, left-->number of received packet)
        */
        onArdockChunck: function(data){
            //console.log(data.pdbObj.model(1));
            var job = null;
            
            var tabAtoms = data.pdbObj.model(1).currentSelection;
            var tabchains = data.pdbObj.model(1).listChainID();
            
            var nglComponent = WidgetsUtils.tabNGLComponents[data.uuid];
            
            nglComponent.stage.signals.clicked.removeAll();
            
            nglComponent.probe++;
            
            /*WidgetsUtils.tabJobs.forEach(function(el){
                if(data.uuid === el.uuid){
                    job = el;
                    job.probe++;
                    job.pdbOjProbeList.push(data.pdbObj);
                } 
            });*/
            
            var objectAtoms = {};
            for( i = 0 ; i < tabAtoms.length ; i++){
                objectAtoms[tabAtoms[i].serial] = {chainID : tabAtoms[i].chainID, tempFactor : tabAtoms[i].tempFactor}; 
            }
            
            var schemeId = NGL.ColorMakerRegistry.addScheme( function( params ){
                this.atomColor = function( atom ){
    
                    var atom2 = objectAtoms[atom.serial];
                    if(atom2.tempFactor > 0){
                        var colorRGB = "255," + (255 / atom2.tempFactor) + ",0";
                        colorRGB = colorRGB.split(",");

                        var colorHex = colorRGB.map(function(x){           
                                    x = parseInt(x).toString(16);       
                                    return (x.length==1) ? "0"+x : x;   
                        });

                        colorHex = "0x"+colorHex.join("");

                        return colorHex;
                    }else{
                        var index = tabchains.indexOf(atom2.chainID);
                        var colorHex = WidgetsUtils.tabColorScheme[WidgetsUtils.tabColorSchemePrefered[index]].replace("#", "0x");
                        return colorHex;
                    }
                   
                };
            });
            
            var timeOut = nglComponent.probe === 1 ? 0 : 800 * nglComponent.probe;
            
            setTimeout(function(){
                nglComponent.baseRepresentation.setParameters({'colorScheme': schemeId});
                nglComponent.baseRepresentation.update({'color': true});
            },timeOut);
                
            
            //console.log("LEFT LEFT LEFT LEFT !!!");
            //console.log(data.left);
        }
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