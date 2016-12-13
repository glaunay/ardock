window.$ = window.jQuery = require('jquery')
var Backbone = require('backbone');
Backbone.$ = $;

//var NGLVIEW = require('nglview-js');

var NGL = require('ngl');

//var events = require('events');
var Core = require('./Core.js').Core;
var arDockDL = require('./arDockDL.js');
var arDockDT = require('./arDockDT.js');
var fastaWidget = require('./arDockSQ.js');

///////////////////////////////////////////////////////////////////////////////////////// GLOBAL //////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/*
 *  Definition of the front-end widgets
 *
 */
////////////////////////////////////////////////////////////////////////////////////////// CORE ///////////////////////////////////////////////////////////////

var createAndRegister = function(self, nArgs) {
    WidgetsUtils.W_counts++;
    nArgs['idNum'] = WidgetsUtils.W_counts
    Core.call(self, nArgs);
}

var externalCreateAndRegister = function(constructor, nArgs) {
    WidgetsUtils.W_counts++;
    nArgs['idNum'] = WidgetsUtils.W_counts
    var obj = constructor(nArgs);
    return obj;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////// HEADER /////////////////////////////////////////////////////////////////////////////////////////
var Header = function(opt){
    var self = this;
    var nArgs = opt ? opt : {};
    createAndRegister(self,nArgs);


    this.id = "W_" + this.idNum;
    this.slided = false;

    this.scaffold ('<header id="w_' + this.idNum + '" class="container-fluid header widget">'
                                +'<div class="header-head row" id="headerHead">'
                                    +'<div class="col-xs-3 logo logo-cnrs">'
                                        +'<a target="_blank" href="http://www.cnrs.fr/"><img src="assets/img/logo-cnrs.png" alt="logo CNRS"class="" /></a>'
                                    +'</div>'
                                    +'<div class="col-xs-6 title-site">'
                                        +'<p class="title disable-select">ARBITRARY DOCKING</p>'
                                        +'<span class="quote disable-select" >"protein-protein docking with arbitrary partners"</span>'
                                    +'</div>'
                                    +'<div class="col-xs-3 logo logo-uni-lyon">'
                                        +'<a target="_blank" href="http://www.univ-lyon1.fr/"><img alt="logo Université de Lyon 1" class="pull-right" src="assets/img/logo-uni-lyon.png" /></a>'
                                    +'</div>'
                                +'</div>'

                                +'<div class="header-core jumbotron" id="headerCore">'
                                    +'<h4>Welcome</h4>'
                                    +'<h2>To the arbitrary docking webserver</h2>'
                                    +'<p>Arbitrary docking can reveal potential interaction sites on the surface of a protein using docking with a set of <span class="text-number">25</span> random protein “probes”.</p>'
                                    +'<p>We have shown that the random probes interact in a non-random manner on protein surfaces, and that targeted regions are enriched in biological interfaces.</br>Docking is made using the Hex software using spherical polar Fourier Correlations.</p>'
                                    +'<quote>Reference: <span class="text-number">1</span>. Martin J, Lavery R. Arbitrary protein-protein docking targets biologically relevant interfaces. BMC Biophysics <span class="text-number">2012;5(1):7.</span>'
                                    +'</quote>'
                                    +'<div class="overlay">'
                                    +'</div>'
                                +'</div>'

                                +'<div class="header-slide">'
                                    +'<div class="button-slide">'
                                        +'<div class="button-slide-inside">'
                                            +'<div class="button-slide-triangle-top triangle-slide">'
                                            +'</div>'
                                            +'<div class="overlay">'
                                            +'</div>'
                                        +'</div>'
                                    +'</div>'
                                +'</div>'

                        +'</header>');

    this.display();

    $('.button-slide').click( function(){ self.slide() });
}
Header.prototype = Object.create(Core.prototype);
Header.prototype.constructor = Header;


Header.prototype.slide = function(){//Slide the description in the header
    var self = this;

    this.slided = this.slided? false : true;

    $('.triangle-slide').toggleClass("button-slide-triangle-top button-slide-triangle-bottom");

    $(".header-core").toggle({
        duration: 400,
        progress: function(){
            $(window).trigger("resize");
        }
    });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////// FOOTER /////////////////////////////////////////////////////////////////////////////////////////
var Footer = function(opt){
    var self = this;

    var nArgs = opt ? opt : {};

    createAndRegister(self,nArgs);

    this.id = "W_" + this.idNum;
    this.slided = false;

    this.scaffold('<footer class="widget footer">'
                    +'<span>FrontEnd-Interface: '
                        +'<a href="mailto:reillesebastien@gmail.com">ceber</a>'
                        +' <pipe>&nbsp|&nbsp</pipe> Molecular-representation "Lib": '
                        +'<a target="_blank" href="http://arose.github.io/ngl/api/">arose</a>'
                    +'</span>'
                  +'</footer>');

    this.display();

}

Footer.prototype = Object.create(Core.prototype);
Footer.prototype.constructor = Footer;

////////////////////////////////////////////////////////////////////////////////////////// UPLOADBOX /////////////////////////////////////////////////////////////////////////////////////////
// Display an upload box
var UploadBox = function (opt) {

    var self = this;

    var nArgs = opt ? opt : {};

    createAndRegister(self, nArgs);

    var uploadBoxId = "W_" + this.idNum;

    console.log("-->" + uploadBoxId);

    this.targetInput = null;

    this.scaffold ('<div class="widget uploadBox dropzone container-fluid" id="w_' + this.idNum + '">'
                        + '<div class="dropzone-center">'
                            + '<div class="dropzone-center-inside">'
                                + '<div class="browse dropzone-btn">'
                                    + '<div class="dropzone-btn-border">'
                                        + '<img src="assets/img/browse.png" alt="Rechercher un fichier">'
                                        + '<div class="dropzone-btn-overlay"></div>'
                                    + '</div>'
                                + '</div>'
                                + '<div class="drop-text">'
                                        + '<img src="assets/img/drop.png" alt="Drag and drop available">'
                                + '</div>'
                                + '<div class="test-pdb dropzone-btn">'
                                    + '<div class="dropzone-btn-border">'
                                        + '<img src="assets/img/test-pdb-1hv4.png" alt="Test 1hv4.pdb">'
                                        + '<div class="dropzone-btn-overlay"></div>'
                                    + '</div>'
                                +'</div>'
                                + '<input type="file" style="display:none" accept=".pdb" multiple/>'//,.fasta
                            + '</div>'
                        + '</div>'
                        + '<div class="info"></div>'
                    + '</div>');

    this.display();

    this.input = $(this.node).find('input')[0];

    $(this.input).on('change', function(){ self.emiter.emit('change', self.input, self); });

    $(this.node).find('div.browse').on('click', function(){
        //Handle compatibility browser
        if(!WidgetsUtils.getBrowserCompatibility()){
            $(".info").text('Sorry, your browser is not compatible with some WEBGL features. Please change to an updated version of "Chrome" or "Firefox" !');
            return false;
        }

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

      $(".dropzone").height(WidgetsUtils.getBodyHeight() - (WidgetsUtils.heightUntilNavJob() + WidgetsUtils.heightFooter));

    //###########################################################




/* All test button disable to replace by restore session
    //Click button TEST PDB, ajax get a streamed pdb file
    $(".test-pdb").click(function(e){

        //Handle compatibility browser
        if(!WidgetsUtils.getBrowserCompatibility()){
            $(".info").text('Sorry, your browser is not compatible with some WEBGL features. Please change to an updated version of "Chrome" or "Firefox" !');
            return false;
        }

        //Launch a waiter gif
        var waitLoader = new Loader({root: $('.tab-content')});
        waitLoader.display();

        //Check if file is already open
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
        //Get pdb on server
        $.ajax({
            url: 'http://srdev.ovh:8081/4MOW',
            type: 'GET',
            success: function(file) {

                var s = WidgetsUtils.stream.Readable();
                s.push(file, 'utf-8');
                s.push(null);
                var pdbParse = WidgetsUtils.pdbLib.parse({'rStream': s})
                    .on('end', function (pdbObjInp) {
                        var opt = {fileName: "4MOW", pdbObj: pdbObjInp};
                        waitLoader.destroy();

                        //Slide the header description once
                        if ( WidgetsUtils.displayTabs.nbTabs === 1 && !WidgetsUtils.header.slided ) { WidgetsUtils.header.slide() }

                        setTimeout(function(){
                            var navDT = WidgetsUtils.displayTabs.addTab(opt);
                        }, 500);

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
*/

    //$(".browse").css("margin-top", ((WidgetsUtils.getBodyHeight() - (WidgetsUtils.heightUntilNavJob() + WidgetsUtils.heightFooter)) / 2) - 50);

    $(window).resize(function(e){
        $(".dropzone").height(WidgetsUtils.getBodyHeight() - (WidgetsUtils.heightUntilNavJob() + WidgetsUtils.heightFooter));
        //$(".browse").css("margin-top", ((WidgetsUtils.getBodyHeight() - (WidgetsUtils.heightUntilNavJob() + WidgetsUtils.heightFooter)) / 2) - 50);
    });

    setTimeout(function(){ $(window).trigger("resize") }, 100);

}
UploadBox.prototype = Object.create(Core.prototype);
UploadBox.prototype.constructor = UploadBox;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////// LOADER /////////////////////////////////////////////////////////////////////////////////////////
var Loader = function(opt){
    var self = this;

    var nArgs = opt ? opt : {};

    createAndRegister(self, nArgs);

    var loaderId = "W_" + this.idNum;

    this.scaffold ('<div class="widget loader" id="w_' + this.idNum + '">');
}

Loader.prototype = Object.create(Core.prototype);
Loader.prototype.constructor = Loader;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////// DISPLAY TABS /////////////////////////////////////////////////////////////////////////////////
var DisplayTabs = function(opt){

    var nArgs = opt ? opt : {};
    createAndRegister(this, nArgs);

    WidgetsUtils.socketApp = opt.skt;
    this.widgetsUtils = WidgetsUtils;
    this.nbTabs = 1;

    //this.pdbObj = opt.pdbObj;

    this.scaffold('<div  class="container-fluid after-head" id="w_' + this.idNum + '">'+
                                '<ul class="nav nav-tabs" id="tabs" style="border: none;">'+
                                    '<li role="presentation" class="active" id="addFile"><a href="#divAddFile">+ Add .pdb</a><div class="mask"></div></li>'+
                                '</ul>'+
                                '<div class="tab-content">'+
                                    '<div class="tab-pane fade in active" id="divAddFile">'+
                                    '</div>'+
                                '</div>'+
                            '</div>');

}

DisplayTabs.prototype = Object.create(Core.prototype);
DisplayTabs.prototype.constructor = DisplayTabs;

/*DisplayTabs.prototype.display = function() {
    console.log("trying to display tab");
    console.log('displayTabs registered id is ' + this.idNum);
    Core.prototype.display.call(this);
}*/

DisplayTabs.prototype.addTab = function(opt){

    this.nbTabs++;

    //Remove file extension and non-AlphaNumeric
    var name =  opt.fileName.replace(/(?:\.([^.]+))?$/i,"");
    name = name.replace(/\W+/g, "");

    //Check if pdb is valid by searching empty chain, return if true
    var chains = opt.pdbObj.model(1).listChainID(),
        chainEmpty = false;
    chains.forEach(function(el, i){
        if(!el.trim().length){ chainEmpty = true }
    });
    if(!chains.length || chainEmpty){
        console.warn('PDB file " ' + name + ' "seems incomplete or corrupted !');
        WidgetsUtils.magnifyError('PDB file " ' + name + ' "seems incomplete or corrupted !', null, $(".dropzone"), {top: "20px", left: "20px", right: "20px"});
        return false;
    }

    //Check if file is already open, return if true
    var alreadyExist = false;
    WidgetsUtils.tabTabs.forEach(function(el){
        if(name === el.name){
            alert("File already open !");
            alreadyExist = true;
            return false;
        }
    });
    if(alreadyExist){return false};

    //Create a new Tab and push it in Array
    WidgetsUtils.tabTabs.push(new Tab({name:name,pdbObj: opt.pdbObj,tabList: '#tabs',tabAdd:'#addFile',container: '.tab-content', pdbText : opt.pdbText}));

    var navDT = function(name){

        $("." + name + " a").click();

        $("." + name + " i").on('click',function(){

            var index = WidgetsUtils.tabTabs.findIndex(function(element){return element.name == name}),
                      nextClassName = (WidgetsUtils.tabTabs.length > 1 && index !== WidgetsUtils.tabTabs.length - 1) ? WidgetsUtils.tabTabs[index +1].name : false,
                      prevClassName = (WidgetsUtils.tabTabs.length > 1 && index !== 0) ? WidgetsUtils.tabTabs[index - 1].name : false ;

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

        //If Addfile div --> no border
        if($(this).attr("href") === "#divAddFile"){ $("#tabs").css("border", "none") }
        else{ $("#tabs").css("border-bottom", "1px solid #ddd") }

        //remove all magnify
        $(".magnify-residue").find(".container-flow").empty();
        $(".magnify").stop(true,true);

        //rezise elements
        setTimeout(function(){ $(window).trigger('resize') }, 200);
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

    createAndRegister(self, nArgs);

    this.pdbObj = opt.pdbObj;
    this.pdbText = opt.pdbText;
    this.nbJob = 0;//number of job
    this.name = opt.name;//pdb name
    this.tabList = opt.tabList;//ul
    this.tabClass = "." + name;//tab
    this.divTabId = "#" + this.name ;
    this.tabAdd = opt.tabAdd;//tab addTab
    this.container = opt.container;
    this.jobs = [];

    var initTab = function(){
    	$(self.tabList).append('<li role="presentation" class="'+ self.name +'"><a href="#' + self.name + '">' + self.name + '</a><i class="remove-tab"></i></li>');
	    $(self.container).append('<div class="tab-pane fade container-fluid" id="'+ self.name +'">');//container-fluid
	    $(self.tabList + " li").last().insertBefore(self.tabAdd);

	    self.node = $('#' + self.name)[0];

	    $(self.node).append('<div id="navJobs' + self.name+ '" class="row navJobs"></div>');

	    self.navJobs = $("#navJobs" + self.name)[0];//id list job

	    $(self.navJobs).append('<button class="btn btn-xs navJobAdd" id="addJob' + self.name +'"><span class="glyphicon glyphicon-plus"></span></button>');

	    self.btnAddJob = $('#addJob' + self.name)[0];

	    $(self.btnAddJob).click(function(){
            //remove all magnify
            $(".magnify-residue").find(".container-flow").empty();
            $(".magnify").stop(true,true);

            //rezise elements
            $(window).trigger("resize");

            //Add one job
            self.addJob();
	    });
    };

    $.when(initTab()).done(function(){
        //Append mask background black for animation
        setTimeout(function(){
           $("#" + self.name).append('<div id="bkJob' + self.name + '" class="background-job"><span></span></div>');

           $(window).resize(function(){
               $("#bkJob" + self.name).css({"top": $("#" + self.name).outerHeight(), "height": $("#bkJob" + self.name).parent().find("canvas").height()});//WidgetsUtils.getHeightLeft()
           });
           $(window).trigger("resize");
        }, 2000);


        //add one job at creation
    	self.addJob();
    });

}

Tab.prototype = Object.create(Core.prototype);
Tab.prototype.constructor = Tab;

//#######################################Tab.addJob#########################
Tab.prototype.addJob = function(){

    var self = this;

    /*var len = self.pdbObj.model(1).listChainID().length;
    var plural = len > 1 ? "chains" : "chain";
    len + plural*/
    var text = self.pdbObj.model(1).listChainID().join("");

    this.nbJob++;
    $(this.navJobs).append('<div class="' + this.name + this.nbJob + ' navJob"><button class="btn job-text' + this.nbJob + '" >' + text + '</button><i class="remove-job"></i><div class="mask"></div></div>');
    $('.' + this.name + this.nbJob).insertBefore($(this.btnAddJob));
    $(this.node).append('<div class="row divJob" id="'+ this.name + this.nbJob +'"></div>');
    var job = new Job({node: $('#' + this.name + this.nbJob)[0] ,nbJob: this.nbJob,name: this.name + this.nbJob,pdbObj: this.pdbObj, pdbText : this.pdbText});
    this.jobs.push(job);

    //Handle position absolute top of the workspace
    setTimeout(function(){
        $("#" + self.name).find(".divJob").css("top", $(self.navJobs).css("height"));
        $(window).trigger("resize");
    }, 100);

    var navJobs = function(name){//Rules of navigation

        //Handle position absolute top of the workspace
        $(window).on("resize", function(e){ $("#" + self.name).find(".divJob").css("top", $(self.navJobs).css("height")) });

        //Click on a job button
        $("." + name).click(function(e){
            e.preventDefault();

            //Disable click if active
            if($(this).hasClass('navJobActive')){ return false }

            //remove all magnify
            $(".magnify-residue").find(".container-flow").empty();
            $(".magnify").stop(true,true);

            $(self.navJobs).find('.navJob').removeClass('navJobActive');
            $(this).addClass('navJobActive');
            //$(self.node).find('.divJob').removeClass('divJobActive');
            //$(self.node).find('#' + name).addClass('divJobActive');
            $(self.node).find('.divJob').animate({ opacity: 0 }, 400, function() {
                $(this).removeClass('divJobActive')
            });

            setTimeout(function(){
                $(self.node).find('#' + name).addClass('divJobActive').animate({ opacity: 1,},400, function(){
                    $(window).trigger("resize");
                });
            }, 600);

        }).click();//Job added is display

        //Click remove a job
        $("." + name + " i").on('click',function(e){
            e.preventDefault();
            e.stopPropagation();

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


    console.log("This is job Constructor, parameters are:")
    console.dir(opt)

    var nArgs = opt ? opt : {};
    Core.call(this,nArgs);

    var self = this;

    this.workspace = opt.node;
    this.nbJob = nArgs.nbJob;
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



    this.send = function(pdbObj){//Emit after click Submit ('GO')
        WidgetsUtils.socketApp.emit('ardockPdbSubmit', {data : pdbObj.dump(), uuid: self.uuid});
        //WidgetsUtils.socketApp.emit('ardockPdbSubmit', pdbObj.dump());
    };

    this.canvasNGLChange = function(){
        $(self.canvas).one('mouseover', function(e){ self.stage.handleResize() });
    };

    var container = document.createElement('div');
    document.body.appendChild(container);
    container.setAttribute("id", "jobContainer" + opt.name);
    $(container).hide().css("position", "relative");


    //##################################### Launch Jobs ############################################
    this.listWidgets = {pC: null, pS: null, pThreeD: null, magnify: null, selectRepresentation: null};

    var initJobs = function(){
        //-->PanelControls
        self.listWidgets["pC"] = new PanelControls({root: container, job: self});

        //-->PdbTheeD
        self.listWidgets["pThreeD"] = new PdbThreeD({name: self.name, pdbObj: opt.pdbObj, pdbText : opt.pdbText, root: container, job: self, UUID: self.uuid});

        //-->PdbSummary
        self.listWidgets["pS"] = new PdbSummary({fileName : opt.name, pdbObj : opt.pdbObj, root: self.listWidgets["pC"].panel, job: self, UUID: self.uuid});
        self.listWidgets["pS"].display();

        //-->SelectRepresentation
        self.listWidgets['selectRepresentation'] = new SelectRepresentation({root: self.listWidgets["pC"].panel, UUID: self.uuid, pdbObj: self.pdbObj, fileName : opt.name});
        self.listWidgets['selectRepresentation'].display();

        // RESUME HERE
        //--> add new component here, root value is PAnelControl which ensure that visual of new component will be place relative to canvas

        self.listWidgets['bookmarkDL'] = externalCreateAndRegister(arDockDL.new, {root: self.listWidgets["pC"].panel, /*UUID: self.uuid, */ pdbObj: self.pdbObj});
        self.listWidgets['bookmarkDT'] = externalCreateAndRegister(arDockDT.new, {root: self.listWidgets["pC"].panel, /*UUID: self.uuid, */ pdbObj: self.pdbObj});
        //WidgetsUtils.tabTabs[0].jobs[1].listWidgets.bookmarkDL.display({ position : 'br', absPosSpecs : {'top' : '200px'}})
       //WidgetsUtils.tabTabs[0].jobs[1].listWidgets.bookmarkDL.display({ position : 'br', absPosSpecs : {'top' : '400px'}, 'pdbObj' : self.pdbObj})
       //WidgetsUtils.tabTabs[0].jobs[0].listWidgets.bookmarkDT.display({ position : 'br', absPosSpecs : {'top' : '300px'}, pdbObj : WidgetsUtils.tabTabs[0].jobs[0].pdbObj })
        //pdbObj
        //arDockDL.new({root: self.listWidgets["pC"].panel, /*UUID: self.uuid, */ pdbObj: self.pdbObj});
    };

    //Actions after creating objects
    $.when(initJobs()).done(function(){

        $(container).appendTo($(self.workspace)[0]).show();


        self.listWidgets["pThreeD"].ChangeCanvasSize();
        self.canvasNGLChange();

        $(window).resize(function(e){
            $(self.storeDiv).width("auto").height("auto");

            setTimeout(function(){
                $(self.canvas)
                    .width($(".header")[0].getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight))
                    .height(WidgetsUtils.getHeightLeft() - 10)//-10 because when handle resize canvas take 5px
                ;

                self.stage.handleResize();

            }, 200);

            $(self.canvas)
                .width($(".header")[0].getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight))
                .height(WidgetsUtils.getHeightLeft() - 10)//-10 because when handle resize canvas take 5px
            ;

            self.stage.handleResize();

            $(self.listWidgets.pC.panel).height($(self.canvas).height());
            $(self.storeDiv).height($(self.canvas).height());

        });

        self.listWidgets["pS"].setNavigationRules();
        self.listWidgets["pS"].on('submit', self.send);

        self.listWidgets['selectRepresentation'].setNavigationRules();

        //Fill taJobs with self - Key --> uuid
        WidgetsUtils.tabJobs[self.uuid] = self;
    });

    //##############################################################################################

}

Job.prototype = Object.create(Core.prototype);
Job.prototype.constructor = Job;

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
            "100%",//WidgetsUtils.widthPanelControls,
            WidgetsUtils.getHeightLeft(),
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

    //DOM
    var initMagnify = function() {

        var magnify = WidgetsUtils.getStoreDiv(
            "magnify" + self.idNum,
            50,
            50,
            nArgs.class? nArgs.class : "magnify"
        );

        magnify.style.position = "absolute";

        self.magnify = magnify;
    }

    $.when(initMagnify()).done(function(){
        //$(self.magnify).appendTo(document.body);
        $(document.body).append(self.magny);
        $(self.magnify).hide();

        //Handle click for remove magnify
        $( document )
            .on( "click", function( event ) {
                $(self.magnify).stop(true,true).hide();
        });
    });

}

Magnify.prototype = Object.create(Core.prototype);
Magnify.prototype.constructor = Magnify;

//////////////////////////////////////////////////////////////////////////////////////////// PDB SUMMARY /////////////////////////////////////////////////////////////////////////////////
// Display a summary of a loaded pdb file

// GL added sequence visualization possibility

var PdbSummary = function(opt) {

    var nArgs = opt ? opt : {};
    var self = this;
    createAndRegister(self, nArgs);

    this.pdbObj = nArgs.pdbObj;
    this.job = nArgs.job;

    this.UUID = nArgs.UUID;
    this.NGLComponent = null;
    this.probeStart = false;
    this.nbStep = 0;
    this.$progressElements = [];
    this.progressTimeOutId = [];
    this.progressElIndex = null;
    this.$submitText = null;
    this.fileName = nArgs.fileName;

    var chains = this.pdbObj.model(1).listChainID();

    var scaffold = '<div class="widget pdbSummary" id="w_' + this.idNum + '">';//draggable="true"

    if (chains.length > 0) {
        scaffold += '<div class="panelChains">';

        scaffold += '<div class="submitChainsContainer">'
                        +'<div class="border"></div>'
                        +'<div class="submitChains">'
                            +'<span>GO</span>'
                            + '<div class="overlay"></div>'
                        +'</div>'
                   +'</div>'
                   +'<div class="chainSeparator">'
                        +'<div class="border"></div><span></span>'
                   +'</div>'
        ;

        chains.forEach(function(e,i) {
            scaffold += '<div>'
                        +'<input type="checkbox" class="" name="chainBox" id="' + e + "-" + self.idNum + '" autocomplete="off" checked>'
                        +'<div class="checkChainsContainer">'
                            +'<div class="border"></div>'
                            +'<label class="checkChains" for="' + e + "-" + self.idNum + '">'
                                +'<span class="disable-select">' + e + '</span>'
                                +'<div class="overlay"></div>'
                            +'</label>'
                        +'</div>';

            if(chains.length > 1 && i < chains.length -1){
                scaffold += '<div class="chainSeparator"><div class="border"></div><span></span></div>';
            }

            scaffold += '</div>';
        });

        scaffold += '</div></div>';
    }


    this.scaffold (scaffold);
}

PdbSummary.prototype = Object.create(Core.prototype);
PdbSummary.prototype.constructor = PdbSummary;

PdbSummary.prototype.setNavigationRules = function() {

    var self = this;

    this.latest = null;
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
                console.log('!!!!click!!!!');

                var component = this;

                $(self.nodeRoot).find('div.summaryMenu').remove();


                console.log("who am i ? ");
                console.log($(component).parent(".checkChains").attr("for"));
                console.log("latest known is " + this.latest);

                //this.latest = this.latest ? $(component).parent(".checkChains").attr("for") :
                if( !this.latest ){
                    this.latest = $(component).parent(".checkChains").attr("for");
                } else if (this.latest === $(component).parent(".checkChains").attr("for")){
                    this.latest = null;
                    return;
                }


                // Get Position of current chain circle
                // append two fa circle to allow for view or suppress
                // Get y as center of clicked div
                // Get x as border of pdbSummary

                /*console.log(WidgetsUtils.mousePagePosition.x + ' , ' + WidgetsUtils.mousePagePosition.y);
                console.log("Clicked Elem content and position");
                console.dir(this);
                console.log($(this).position());
                console.log("Closest parent non abosulte");
                console.log($(this).closest('.checkChainsContainer').position());
                console.log("pdbSummary position");
                console.log($(self.node).position());
                console.log($(self.node).outerWidth());

                console.log("Spawning point is " + $(this).closest('.checkChainsContainer').position()["top"] + ' , ' + $(self.node).outerWidth() );
                */
                var x = $(self.node).outerWidth();
                var y = $(this).closest('.checkChainsContainer').position()["top"];
                var html =  '<div class="summaryMenu">'
                            + '<div class="view"><span class="fa-stack fa-lg">'
                            + '<i class="fa fa-circle fa-stack-2x fa-inverse"></i>'
                            + '<i class="fa fa-search fa-stack-1x"></i>'
                            + '</span></div>'
                            + '<div class="ban">'
                            + '<span class="fa-stack fa-lg">'
                            + '<i class="fa fa-circle fa-stack-2x fa-inverse"></i>'
                            + '<i class="fa fa-ban fa-stack-2x text-danger"></i>'
                            + '</span></div>'
                            + '</div>'

                $(self.nodeRoot).remove('div.summaryMenu');
                $(self.nodeRoot).append(html);
                $(self.nodeRoot).find('div.summaryMenu').css({'top' : y, 'right' : x});


                $(self.nodeRoot).find('div.summaryMenu div.view').on('click', function() {
                    var $checkboxElement = $("#" + $(component).parent(".checkChains").attr("for"));
                    var targetChain = $checkboxElement.attr('id').split("-")[0];

                    if($(self.nodeRoot).find('#arDockSQ_' + targetChain).length > 0) {
                        console.log("fastawidget already displayed");
                        return;
                    }
                    console.log("--->");console.dir(self.nodeRoot);
                    var windowSeq = fastaWidget.new(
                        {   pdbObj : self.pdbObj,
                            chain : targetChain, node : self.nodeRoot
                        });
                    windowSeq._draw({ shape : [90, 402]});
                });

            $(self.nodeRoot).find('div.summaryMenu div.ban').on('click', function() {


                if (self.NGLComponent === null) {
                    self.NGLComponent = WidgetsUtils.tabNGLComponents[self.UUID];
                }

                //Check if representation'change is ongoing
                if (WidgetsUtils.tabNGLComponents[self.UUID].changeReprOngoing) {
                    WidgetsUtils.magnifyError("Can not remove a chain when a representation change is ongoing !", 3000, $('#tabs'), {
                        top: "-8px",
                        right: "0px"
                    });
                    return false;
                }

                var $checkboxElement = $("#" + $(component).parent(".checkChains").attr("for"));
                var targetChain = $checkboxElement.attr('id').split("-")[0];

                if ($("#" + $(component).parent(".checkChains").attr("for")).prop("checked")) {

                    //Uncheck chain
                    $("#" + $(component).parent(".checkChains").attr("for")).prop("checked", false);

                    //Change background color of the label
                    $(component).parent(".checkChains").css("background-color", "dimgray");

                    //Remove chain from representation
                    WidgetsUtils.removeAddChain(self.UUID, targetChain, false);


                } else {
                    //Check chain
                    $("#" + $(component).parent(".checkChains").attr("for")).prop("checked", true);

                    //Change background color of the label
                    $(component).parent(".checkChains").css("background-color", "white");

                    //Add chain to representation
                    WidgetsUtils.removeAddChain(self.UUID, targetChain, true);

                }
            });



/*
                if(self.NGLComponent === null){
                    self.NGLComponent = WidgetsUtils.tabNGLComponents[self.UUID];
                }

                //Check if representation'change is ongoing
                if(WidgetsUtils.tabNGLComponents[self.UUID].changeReprOngoing){
                    WidgetsUtils.magnifyError("Can not remove a chain when a representation change is ongoing !", 3000, $('#tabs'),{top: "-8px", right: "0px"});
                    return false;
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
    */
            })
        ;
    });

    //Click Submit
    $(this.node).find(".submitChains")
            .find(".overlay")
                .click(function() {
                    var chains = [];
                    var $chainSeparatorChecked = [];
                    var timeFadeOut = 1000;
                    var $inputUnchecked = [];

                    $(self.node).find('input[type=checkbox]').each(function(i, el){//input[name=chainBox]:checked
                        //Fill array unchecked chain(s)
                        if(!($(this).prop("checked"))){ $inputUnchecked.push($(this)) }
                        else{
                            //Fill chain(s) checked
                            chains.push((($(this).attr('id')).split("-"))[0]);

                            //Push element(s) visible to hide after
                            $chainSeparatorChecked.push($(this).parent().find(".chainSeparator"));
                        }
                    });

                    if(chains.length){
                        //When probe operation start, click is disabled
                        if(WidgetsUtils.tabNGLComponents[self.UUID].probeStart){ return false }
                        WidgetsUtils.tabNGLComponents[self.UUID].probeStart = true;

                        //Hide unchecked chain(s)
                        $inputUnchecked.forEach(function(el,i){
                                setTimeout(function(){
                                    el.parent().find(".chainSeparator").remove();
                                    el.parent().find(".checkChainsContainer").remove();
                                },i * 100);
                        });

                        //Hide the latest chainSeparator
                        if($chainSeparatorChecked.length){
                            $chainSeparatorChecked[$chainSeparatorChecked.length - 1].remove();
                        }

                        //One probeStep and query server
                        setTimeout(function(){
                            //Change the representation type to "surface"
                            if(WidgetsUtils.tabNGLComponents[self.UUID].baseRepresentation.name !== "surface"){
                                //WidgetsUtils.changeRepresentation(self.UUID, "surface");
                                $(self.node).parent().find('label').each(function(i,el){
                                    var valFor = $(this).attr("for");
                                   if( valFor.includes("surface") ){ $(this).find('.overlay').trigger("click") }
                                });
                            }
                            // triggered by clic on go
                            self.probeStep(chains);

                            //Change name of the job tab buton
                            /*var len = chains.length;
                            var plural = len > 1 ? "chains" : "chain";*/
                            var text = chains.join("");
                            $('.job-text' + self.job.nbJob).text(text);

                            //Get new version of pdbobj without chain(s) unchecked
                            var pdbObj = self.pdbObj.model(1).chain(chains).pull();

                            //Clear self PdbObj chains after a pull
                            self.pdbObj.model(1).listChainID();

                            self.emiter.emit('submit', pdbObj);

                        },110 * $inputUnchecked.length);

                    }else{
                        alert("Neither chain selected !");
                        return false;
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


PdbSummary.prototype.probeStep = function(chains, probeLeft) {
    //console.log("OUHOU " + probeLeft);
    console.log("node ref");


    //Handle Safari
    if(probeLeft === undefined){
        probeLeft = null;
    }

    var self = this;

    this.nbStep++;

    var timeIncrease = 50;

    console.log("This is probeStep");

    //First Step from PDBSUMMARY
    if(this.probeStart === false){ // 1st ardock Chunck signal
        console.log("This is probeStep, premier remplissage");
        //Say probe operation is starting
        this.probeStart = true;

        //Find Span submit
        //$(this.node).find(".submitChainsContainer span").first();
        this.$submitText = $(this.node).find(".submitChainsContainer span").first();

        //Fill in array all the elements to fill in color
        this.$progressElements.push($(this.node).find(".submitChainsContainer .overlay"));
        this.$progressElements.push($(this.node).find(".chainSeparator span").first());

        //Change text to "start"
        this.$submitText.text("Begin");

        //Load elements in array
        chains.forEach(function(el,i){
            self.$progressElements.push($('#' + el + "-" + self.idNum).parent().find('label'));
            if(i !== chains.length - 1){
                self.$progressElements.push($('#' + el + "-" + self.idNum).parent().find('.chainSeparator span'));
            }
        });

        //Append a div in each element to fill
        self.$progressElements.forEach(function(el, i){
            el.append('<div class="probe-progress" style="width: 100%; height: 0px; background-color: rgba(0,133,82,0.6); position: absolute; bottom:0px;left:0px;right:0px; z-index:9"></div>');
        });

        //Fill 1px
        var progress = function(time, a, len, $el, $layProgress){
            var timeoutId = setTimeout(function(){

                var ray = len / 2;
                var sideKnown = null;
                var sideUnknown = null;

                if($el.is('label') || $el.is('.overlay')){

                    if(a < ray){

                        sideKnown = ray - a;
                        if(a > ray - 8){ sideUnknown = Math.round(Math.sqrt( ( ray * ray ) - ( sideKnown * sideKnown ) )); }
                        else{ sideUnknown = Math.floor(Math.sqrt( ( ray * ray ) - ( sideKnown * sideKnown ) )); }

                        $layProgress.css({
                            "height": a + "px",
                            "width": sideUnknown * 2,
                            "left": ray - sideUnknown,
                            "right": ray - sideUnknown,
                            "border-bottom-left-radius": sideUnknown + "px " + a + "px",
                            "border-bottom-right-radius": sideUnknown  + "px " + a + "px",
                        });

                    }else{

                        sideKnown = a - ray;
                        if(a > len - 8){ sideUnknown = Math.floor(Math.sqrt( ( ray * ray ) - ( sideKnown * sideKnown ) )) - 0.3 }
                        else{ sideUnknown = Math.round(Math.sqrt( ( ray * ray ) - ( sideKnown * sideKnown ) )); }

                        $layProgress.css({
                            "height": a + "px",
                            "border-bottom-left-radius": ray + "px " + ray + "px",
                            "border-bottom-right-radius": ray + "px " + ray + "px",
                            "border-top-left-radius": ray - sideUnknown + "px " +  sideKnown + "px",
                            "border-top-right-radius": ray - sideUnknown + "px " +  sideKnown + "px",
                        });

                    }

                }else if($el.is('span')){
                    $layProgress.css("height", (a + 4));
                }

                //Increment counIt and display percentage in submit text
                countIt++;
                self.$submitText.text((Math.floor(countIt / percent)) + "%");

                if(countIt === totalLen){
                    var waitLoader = new Loader({root: self.$submitText});
                    waitLoader.display();
                    $(waitLoader.node).css({ borderRadius: "50%" });
                    console.log("-->Max iteration reached -->");
                    //self.$submitText.text(self.probeMax);
                }

            }, time);

            self.progressTimeOutId.push(timeoutId);
        }

        var timeOut = 0;
        var totalLen = 0;
        var countIt = 0;

        //Get Total len
        for(i = (self.$progressElements.length - 1) ; i >= 0 ; i--){
            var $el = self.$progressElements[i];
            //var $layProgress = $el.find('.probe-progress');

            var len = parseInt(($el.height()));
            len = ($el.is('label')) ? len + 6 : ($el.is(".overlay")) ? len : len - 4;

            totalLen += len;
        }

        totalLen += self.$progressElements.length;
        var percent = totalLen / 100;

        //Loop progress
        for(i = (self.$progressElements.length - 1) ; i >= 0 ; i--){
            var $el = self.$progressElements[i];
            var $layProgress = $el.find('.probe-progress');

            var len = parseInt(($el.height()));
            len = ($el.is('label')) ? len + 6 : ($el.is(".overlay")) ? len : len - 4;

            for(a = 0; a <= len ; a++){
                timeOut += timeIncrease;
                progress(timeOut, a, len, $el, $layProgress);
            }
        }
    } else {//Others step(s) from ardockchunck

        console.log("this is not 1st probeStep")
        console.log("probe Left is " + probeLeft);

        if(probeLeft === 0){
            //Change text to "1"
            //this.$submitText.text("1");
            //Say "End"
            setTimeout(function(){
                self.$submitText.text("Surface probed");
                $(self.node).find('div.submitChains').first().css({'padding-top' : '8px', 'font-size' : '0.8em'});
            }, 1000);
        }else{
            if(self.nbStep === 2){
                //Clear all timeout for the progress bar
                self.progressTimeOutId.forEach(function(el,i){ clearTimeout(el) });

                //Fill all the progress bar
                //setTimeout(function(){
                    self.$progressElements.forEach(function(el,i){
                        $el = el.find('.probe-progress');
                        if(el.is('label') || el.is('.overlay')){ $el.css({width: "100%", height: "100%", borderRadius: "50%", top: "0px", bottom: "0px", left: "0px", right: "0px",}) }
                        else if(el.is('span')){ $el.css({width: "100%", height: "100%"}) }
                    });
                //},timeIncrease);
            }

            console.log("Change text to n probe left");
            this.$submitText.text(probeLeft);
            $(self.node).find('div.submitChains').first().css({'font-size' : '1.75em', 'padding-top' : '7px'});

            var waitLoader = new Loader({root: self.$submitText});
            waitLoader.display();
        }
    }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////// SELECT REPRESENTATION /////////////////////////////////////////////////////////////////////////////////
// Display a representations selector, bind by WidgetsUtils.tabRepresentationAvailable
var SelectRepresentation = function(opt) {

    var nArgs = opt ? opt : {};
    var self = this;
    createAndRegister(self, nArgs);



    this.UUID = nArgs.UUID;
    this.pdbObj = nArgs.pdbObj;


    var scaffold = '<div class="widget selectRepresentation" id="w_' + this.idNum + '">';
    scaffold += '<div class="panelSelectRepresentation">';

    WidgetsUtils.tabRepresentationTypeChangeable.forEach(function(el, i){

        //el.base (Boolean) --> get the representation is diplay first

        scaffold += '<div>'
                    +'<input type="checkbox" class="" name="' + el.type + '" id="' + el.type.replace(/\W+/g, "") + "-" + self.idNum + '" autocomplete="off" ' + (el.base? " " : "checked") + '>'
                    +'<div class="sRContainer">'
                        +'<div class="border"></div>'
                        +'<label class="checkRepresentation" for="' + el.type.replace(/\W+/g, "") + "-" + self.idNum + '">'
                            +'<img src="' + el.url + '" />'
                            +'<div class="overlay"></div>'
                        +'</label>'
                   +'</div></div>'
        ;
    });

    scaffold += '</div></div>';

    this.scaffold (scaffold);
}

SelectRepresentation.prototype = Object.create(Core.prototype);
SelectRepresentation.prototype.constructor = SelectRepresentation;

SelectRepresentation.prototype.setNavigationRules = function() {

    var self = this;

    //Set one the select representation
    $(self.node).find('input[type=checkbox]').each(function(e){
        if(!($(this).prop("checked"))){

            //Change background color of the label
            $(this).parent().find(".overlay").css("background-color", "rgba(105, 105, 105, 0.6)");
        }
    });


    //Hover, mouseout, click a representation
    $(this.node).find(".checkRepresentation").each(function(e){
        $(this).find(".overlay")
            .hover(function(e){
                if(($("#" + $(this).parent(".checkRepresentation").attr("for")).prop("checked"))){
                    $(this).css("backgroundColor", "rgba(105, 105, 105, 0.6)");
                }
            })
            .mouseout(function(e){
                if(($("#" + $(this).parent(".checkRepresentation").attr("for")).prop("checked"))){
                    $(this).css("backgroundColor", "");
                }else{
                    $(this).css("background-color", "rgba(105, 105, 105, 0.6)");
                }
            })
            .click(function(e){
                e.preventDefault();
                e.stopPropagation();

                var $checkboxElement = $("#" + $(this).parent(".checkRepresentation").attr("for"));
                var targetRepresentation = $checkboxElement.attr('name').split("-")[0];

                //Is already select || representation's change is ongoing || add or remove chain operation is ongoing, return
                if($checkboxElement.prop("checked") === false || WidgetsUtils.tabNGLComponents[self.UUID].changeReprOngoing || WidgetsUtils.tabNGLComponents[self.UUID].addRemoveReprOngoing > 0){

                    if(WidgetsUtils.tabNGLComponents[self.UUID].changeReprOngoing){
                        WidgetsUtils.magnifyError("A representation change is already ongoing !", 3000, $('#tabs'),{top: "-8px", right: "0px"});
                    }else if(WidgetsUtils.tabNGLComponents[self.UUID].addRemoveReprOngoing){
                        WidgetsUtils.magnifyError("A remove or add chain operation is already ongoing !", 3000, $('#tabs'),{top: "-8px", right: "0px"});
                    }

                    return false;

                }else{

                    //Check other representation and change css
                    $(self.node).find('input[type=checkbox]').each(function(e){
                        var nameRepresentation = $(this).attr('id').split("-")[0];

                        if(nameRepresentation !== targetRepresentation){

                            //Check Representation
                            $(this).prop("checked", true);

                            //Change background color of this //the label//
                            $(this).parent().find(".overlay").css("background-color", "");
                        }
                    });

                    //Uncheck Representation
                    $checkboxElement.prop("checked", false);

                    //Change background color of this  //the label//
                    $(this).css("background-color", "rgba(105, 105, 105, 0.6)");
                    //$(this).parent().css("background-color", "dimgray");

                    //Change the representation
                    WidgetsUtils.changeRepresentation(self.UUID, targetRepresentation);
                }
            })
        ;
    });
}


//////////////////////////////////////////////////////////////////////////////////////////// PDB ThreeD /////////////////////////////////////////////////////////////////////////////////////////////
var PdbThreeD = function(opt){

    var nArgs = opt ? opt : {};
    var self = this;
    createAndRegister(self, nArgs);



    this.stage = null;
    this.canvas = null;
    this.stageViewer = null;
    this.storeDiv = null;
    this.structureComponent = null;
    this.UUID = nArgs.UUID;

    if(opt.job){ this.job = opt.job }

    this.divID = "threeD" + opt.name;
    this.pdbObj = opt.pdbObj;
    this.pdbText = opt.pdbText;

    var $header = $(".header");

    var createCanvasStoreDiv = function(){

        self.storeDiv = WidgetsUtils.getStoreDiv(
            "storeDiv" + self.divID,
            $header[0].getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight),
            WidgetsUtils.getHeightLeft(),
            "storeDivThreeD"
        );

        //Set the left position of store in function of the panel control width
        $(self.storeDiv).css("left", WidgetsUtils.widthPanelControls);

        document.body.appendChild(self.storeDiv);

        if(self.job) self.job.storeDiv = self.storeDiv;

        return {storeD: $(self.storeDiv)[0]} ;
    };

    var createCanvas = function(args){
        //Clear PdbObj chains after a pull on an other operation
        self.pdbObj.model(1).listChainID();

        var stringBlob = null;
        if(self.pdbObj !== null){
            stringBlob = new Blob( [ self.pdbObj.model(1).naturalAminoAcidOnly().dump() ], { type: 'text/plain'} );
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

            //console.log(self.stage);

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

            $(self.canvas).width($header[0].getBoundingClientRect().width - (WidgetsUtils.widthPanelControls + WidgetsUtils.marginBodyLeftRight));
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
    *(Those objects are created at getNGLComponents())
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
    heightUntilWorkspace: function(){
        var $tabPaneActive = $($('li.active a').attr("href"));
        return $tabPaneActive.offset().top + $tabPaneActive.height();
    },//199,

    /*
    *The height dimension until div navJob
    *
    *@Integer
    */
    heightUntilNavJob: function(){
        var $header = $(".header");

        return parseInt(parseInt($header.outerHeight()) + parseInt($('#tabs').outerHeight())) + 36;
    },

    getBodyHeight: function(){
        return document.body.getBoundingClientRect().height;
    },

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
        //var $tabPaneActive = $($('li.active a').attr("href"));
        //var heightUntilWorkspace = $tabPaneActive.offset().top + $tabPaneActive.height();
        return $(document.body).height() - (WidgetsUtils.heightUntilWorkspace() + WidgetsUtils.heightFooter);
    },

    /*
    *The width dimension of the PanelControls div element
    *
    *@Integer
    */
    widthPanelControls: 0,//180,

    /*
    *The position x and y, in px of the mouse on the page
    *
    *@Integer
    */
    mousePagePosition: {
        x: null,
        y: null
    },

    tabRepresentationTypeChangeable : [
        {type: 'cartoon','url':'/assets/cartoon-repr.png', base: false},
        {type: 'ball+stick','url':'/assets/ball-stick.png', base: false},
        {type: 'surface', 'url':'/assets/surface.png', base: false}
    ],


    /*
    *List of molecular representation
    *
    *@Array
    */
    tabRepresentationType : ["tube", "cartoon", "ribbon", "trace", "rope","spacefill", "ball+stick",
                             "licorice", "hyperball", "backbone", "rocket", "helixorient", "contact",
                             "surface","distance", "dot"],

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
                       "beige":"#f5f5dc","bisque":"#ffe4c4","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
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
                       "paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","plum":"#dda0dd","powderblue":"#b0e0e6",
                       "purple":"#800080","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57",
                       "seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f",
                       "steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3",
                       "white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd32"}, //,"red":"#ff0000" remove for picking data when click - "black":"#000000",,"pink":"#ffc0cb"


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
    *Return true if the browser is compatible
    *
    *@Return Boolean
    *
    */
    getBrowserCompatibility(){
        //Handle browser compatibility with WEBGL hard use

        // Opera 8.0+
        var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            // Firefox 1.0+
        var isFirefox = typeof InstallTrigger !== 'undefined';
            // Safari 3.0+ "[object HTMLElementConstructor]"
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
            // Internet Explorer 6-11
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
            // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;
            // Chrome 1+
        var isChrome = !!window.chrome && !!window.chrome.webstore;
            // Blink engine detection
        var isBlink = (isChrome || isOpera) && !!window.CSS;



        return (isChrome || isFirefox || isSafari);//Here we define wich browser we want to access the application    || isIE || isEdge
    },



    /*
    *Return an object Magnify
    *
    *Pattern Singleton --> always the same
    *
    */
    get$Magnify : function(){
        var $magnify = null;

        //Get just one Magnify Object
        if(!($(document.body).find(".magnify").length)){
            var magnify = new Magnify();
            $magnify = $(document.body).find(".magnify");
        }else{
            $magnify = $(document.body).find(".magnify");
        }

        return $magnify;
    },



    /*
    *Display a error message on the screen
    *
    *@Params (timeOut optional, if null --> fade is 15000 duration, appendTo optional, if null --> body, position optional)
    *@message (String to display)
    *@timeOut (Integer represent the time of fade)
    *@appendTo (Dom element wich will receive magnifyError)
    *@position (Object ex:"{top: "5px", left:"5px", bottom:"0px", right: "0px"}")
    */
    magnifyError(message, timeOut, appendTo, position){
        //Handle Safari
        if(timeOut === undefined){ timeOut = null }
        if(appendTo === undefined){ appendTo = null }
        if(position === undefined){ position = null }

        var $magnifyError = null;


        var flushPosition = function(){
            $magnifyError.css({top: "", bottom: "", left:"", right: ""})
        }

        //Get just one MagnifyError Object
        if(!($(document.body).find(".magnify-error").length)){
            var magnifyError = new Magnify({class: "magnify-error"});

            $magnifyError = $(document.body).find(".magnify-error")
                .css({"width": "auto", "height": "auto", "padding-right": "10px", "margin": "0 auto" })
                .addClass("alert alert-danger");
        }else{
            $magnifyError = $(document.body).find(".magnify-error");
            flushPosition();
        }

        var trueTimeOut = 15000;

        if(timeOut !== null){
            trueTimeOut = timeOut;
        }

        if(appendTo !== null){
            $magnifyError.appendTo( $( appendTo ) );
            $magnifyError.hide();
        }

        if(position !== null){

            if( position.top ) { $magnifyError.css( "top", position.top ) }
            if( position.bottom ) { $magnifyError.css( "bottom", position.bottom ) }
            if( position.left ) { $magnifyError.css( "left", position.left ) }
            if( position.right ) { $magnifyError.css( "right", position.right ) }

        }else{

            $magnifyError.css({
                "top" : ($(document.body).width() / 3) + "px",
                "left" : ($(document.body).width() / 4) + "px"
            });
        }

        $magnifyError
            .text(message)
            .stop(true,true)
            .show()
            .fadeOut(trueTimeOut)
        ;

    },


    /*
    *List of setTimeOutId of animation
    *
    *@Array
    */
    magnifyResidueTimeOuts: [],

    /*
    *Display a list of residue atoms
    *
    *@Params (tabAtoms optional, if null --> hide magnifyResidue)
    *@tabAtoms (Array of Strings - begin by residue info ex: ["CHAIN: " + chainName + " RES: " + resname + "-" + resno], and "n" atom info ex :["ATOM: " + atomName])
    *
    */
    magnifyResidue : function(tabAtoms){
        //Handle Safari
        if(tabAtoms === undefined){ tabAtoms = null }

        //Clear setTimOut animation
        WidgetsUtils.magnifyResidueTimeOuts.forEach(function(el,i){ clearTimeout(el) });
        WidgetsUtils.magnifyResidueTimeOuts = [];

        var height = $('.divJobActive').offset();

        var $magnifyResidue = null;
        var heightNotAvailable = 99;

        //Get just one MagnifyResidue Object
        if(!($(document.body).find(".magnify-residue").length)){
            var magnifyResidue = WidgetsUtils.getStoreDiv("magnifyResidue", 50, 50, "magnify-residue disable-select");
            magnifyResidue.style.position = "absolute";
            //document.body.append(magnifyResidue);
            $(document.body).append(magnifyResidue);
            $magnifyResidue = $(document.body).find(".magnify-residue");//z-index:1;

            $magnifyResidue.append('<div class="container-flow" style="width: 100%; height: 100%; overflow: auto;position: absolute; top:0; left:25px; bottom:0; right: -100px; pointer-events:none;"></div>');

            $magnifyResidue.hide();
        }else{
            $magnifyResidue = $(document.body).find(".magnify-residue");
        }

        if(tabAtoms === null){ $magnifyResidue.find(".container-flow").empty() }
        else{

            $magnifyResidue.css({
                "background-color": "transparent",
                "padding": "10px",
                "width": "200px",//"auto",
                "height": (WidgetsUtils.getHeightLeft() - heightNotAvailable) + "px",
                "font-size": "10px",
                "color": "white",
                "cursor": "default",
                "left": "-3px",
                "z-index": "15",
                "pointer-events":"none",
                "overflow": "hidden",
                "top": (WidgetsUtils.heightUntilWorkspace() + 79) + "px"
            })
            .find(".container-flow").empty().stop(true,true);

            $magnifyResidue.show();

            var timeOut = 0;
            var timeIncrease = 15;
            var $tabSpans = [];
            var chainSpanHeight = 17;
            var atomSpanHeight = 14;
            var totalSpanHeight = chainSpanHeight;

            var write = function(line, para, time){ setTimeout(function(){ $(para).text(line) },300 + time); }

            tabAtoms.forEach(function(el,i){
                var $para = $('<span style="display: block; margin:0; padding:0; height: ' + atomSpanHeight + 'px;pointer-events:none;"></span>');
                var line = "";

                if(i === 0){ $para.css({"font-size": "12px", "height": chainSpanHeight + "px"}) }
                else{
                    $tabSpans.push($para);
                    totalSpanHeight += atomSpanHeight;
                }

                $magnifyResidue.find(".container-flow").append($para);

                for(a = 0 ; a < el.length; a++){
                    timeOut += timeIncrease;
                    line += el.charAt(a);
                    write(line, $para, timeOut);
                }

            });

            //Force scrolling if overflow
            var animate = true;
            var delay = 3000;
            var scroll = function(){
                animate = false;
                $(".container-flow").animate({scrollTop: parseInt($magnifyResidue.height())}, (delay / 2),function(){
                        $(this).animate({scrollTop: 0}, (delay / 2));
                });
                var setTimeOutId = setTimeout(scroll, delay + 100);
                WidgetsUtils.magnifyResidueTimeOuts.push(setTimeOutId);
            }

            //Scroll if some span(s) hidden
            if(totalSpanHeight > $magnifyResidue.height()){ scroll() }

            //Handle resize
            $(window).resize(function(){
                $magnifyResidue.css( {"height": (WidgetsUtils.getHeightLeft() - heightNotAvailable), "top": WidgetsUtils.heightUntilWorkspace() + 83 });

                //Scroll if if some span(s) hidden and animate is not already launch
                if(totalSpanHeight > $magnifyResidue.height() && animate){ scroll() }
            });

        }
    },


    /*
    *Return stage, and uuid, and canvas element from NGLVIEW-JS
    *Append canvas to storeDiv
    *
    *@Params(representationType is optional, if null --> default "cartoon")
    *
    *@pdbBlob(StringBlob from pdbtext or pdbobject.dump)
    *@storeDiv(A Dom Element with fixed dimension, could be generated by WidgetUtils.getStoreDiv)
    *@pdbObj(PdbLib object)
    *@uuid (String represent the key provide by Job object wich match with an Ardock nglComponent object which is in tabNGLComponents)
    *@representationType(ex:"cartoon","ball+stick")
    *
    */
    getNGLComponents: function(pdbBlob, storeDiv, pdbObj, uuid, representationType) {
        //Handle Safari
        if(representationType === undefined){ representationType = null }

        var id = $(storeDiv).get(0).id;
        var stage = null;
        var canvas = null;

        var structureComponent = null;
        var baseRepresentation = null;
        var listRepresentationAvailable = [];

        var rType = representationType;
        if(rType === null || WidgetsUtils.tabRepresentationType.indexOf(rType) === -1){
            rType = "cartoon";
        }

        //Fill what the fisrt representation display
        WidgetsUtils.tabRepresentationTypeChangeable.forEach(function(el){ el.base = (el.type === rType) ? true : false });

        stage = new NGL.Stage(id.valueOf());

        if(pdbBlob !== null){
            stage.setParameters({'backgroundColor': 'black'})

            try{
                //Load file and wait for promise
                stage.loadFile(pdbBlob,{ext : "pdb", defaultRepresentation:false, asTrajectory: true})
                .then(function(o){//o = --> structureComponent
                    //var baseRepresentation = o.addRepresentation(rType, {'color': WidgetsUtils.getNGLScheme(pdbObj.model(1).listChainID())});
                    var structureComponent = o;

                    var schemeId = WidgetsUtils.getNGLScheme(pdbObj.model(1).listChainID());

                    //Add more representation from widgetsUtils.tabRepresentationTypeChangeable
                    WidgetsUtils.tabRepresentationTypeChangeable.forEach(function(el, i){
                        listRepresentationAvailable[el.type] = o.addRepresentation(el.type, { 'color': schemeId,
                                                                                              'sele': 'NOT:' })//(el.type === rType)? ':' :
                        ;
                    });

                    listRepresentationAvailable[rType].setSelection(':');

                    WidgetsUtils.tabNGLComponents[uuid] = { stage: stage,
                                                            structureComponent: structureComponent,
                                                            baseRepresentation: listRepresentationAvailable[rType],
                                                            listRepresentationAvailable : listRepresentationAvailable,
                                                            baseChain: pdbObj.model(1).listChainID(),
                                                            currentChainsVisible: pdbObj.model(1).listChainID(),
                                                            changeReprOngoing: false,
                                                            addRemoveReprOngoing: 0,
                                                            lastSchemeId: schemeId,
                                                            storeDiv: storeDiv,
                                                            $canvas: canvas,
                                                            lastSelection: ":",
                                                            probe: 0,
                                                            probeLeft: 0,
                                                            probeSchemeId: null,
                                                            probeStart: false,
                                                            probeEnd: false,
                                                            pdbObj: pdbObj,
                                                            objectAtoms: null,
                                                          };
                    stage.centerView();

                    WidgetsUtils.setNGLClickedFunction(uuid);
                    WidgetsUtils.setNGLHoveredFunction(uuid);

                    //console.log(WidgetsUtils.tabNGLComponents[uuid]);
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
        var index = parseInt(Math.floor(Math.random() * tabColor.length)); //WidgetsUtils.tabColorScheme
        var colorName = tabColor[index];

        if(WidgetsUtils.tabColorSchemePrefered.indexOf(colorName) !== -1){
            colorName = WidgetsUtils.getRandomColor();
        }

        if(WidgetsUtils.tabColorSchemePrefered.indexOf(colorName) === -1){
            WidgetsUtils.tabColorSchemePrefered.push(colorName);
        }

        return colorName;
    },


    /*
    *Return a custom NGL scheme color representation from pdbObj
    *
    *@Params (both optional, if empty return an empty colorScheme)
    *@baseChain (Array with String represent a chain to color)
    *@additionalRange (Array of Array of String(s)/NGL Expression - ex:[ ["red", ":A and 156"], ["yellow", ":B OR :C"] ] )
    *
    */
    getNGLScheme : function(baseChain, additionalRange){
        //Handle Safari
        if(baseChain === undefined){ baseChain = null }
        if(additionalRange === undefined){ additionalRange = null }

        var chains = null;
        //var chainsFull = null;
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
    *Return a custom NGL scheme color representation from pdbObj
    *
    *@Params (additionalRange optional)
    *@uuid (String represent the key provide by Job object wich match with an Ardock nglComponent object which is in tabNGLComponents)
    *@additionalRange (Object to color a selectioned residue ex: {chainName: chainName, resno: resno, color: "0xffc0cb"})
    *
    */
    getNGLCustomScheme : function(uuid, additionalRange){
        //Handle Safari
        if(additionalRange === undefined){ additionalRange = null }

        var nglComponent = WidgetsUtils.tabNGLComponents[uuid];
        var objectAtoms = nglComponent.objectAtoms;
        var maxTempFactor = 0;
        var rgbPercent = 2.55;

        for(var key in objectAtoms){ maxTempFactor = ( objectAtoms[key].tempFactor > maxTempFactor ) ? objectAtoms[key].tempFactor : maxTempFactor }

        var tempFactorPercent = maxTempFactor / 100;

        var schemeId = NGL.ColorMakerRegistry.addScheme( function( params ){
                this.atomColor = function( atom ){

                    var atom2 = objectAtoms[atom.serial];

                    if(atom2){//pd.atom.chainname
                        if(additionalRange !== null && additionalRange.resno === atom.resno && additionalRange.chainName === atom.chainname){
                            return additionalRange.color;
                        }

                        if(atom2.tempFactor > 0){
                            //var colorRGB = "255," + (255 / atom2.tempFactor) + ",0";
                            var colorRGB = "255," + Math.floor( ( 100 - ( atom2.tempFactor / tempFactorPercent ) )  * rgbPercent ) + ",0";
                            colorRGB = colorRGB.split(",");

                            var colorHex = colorRGB.map(function(x){
                                        x = parseInt(x).toString(16);
                                        return (x.length==1) ? "0"+x : x;
                            });

                            colorHex = "0x"+colorHex.join("");

                            return colorHex;
                        }else{
                            var index = nglComponent.baseChain.indexOf(atom2.chainID);
                            var colorHex = WidgetsUtils.tabColorScheme[WidgetsUtils.tabColorSchemePrefered[index]].replace("#", "0x");
                            return colorHex;
                        }
                    }

                };
            });

        return schemeId;
    },


    /*
    *Remove listener(s) clicked and add a new which change the representation to color a clicked residue
    *
    *@Params
    *@uuid (String represent the key provide by Job object wich match with an Ardock nglComponent object which is in tabNGLComponents)
    *@afterProbe (Boolean for get custom colorscheme after probe operation, if undefined === false)
    *
    */
    setNGLClickedFunction : function(uuid, afterProbe){
        //Handle Safari
        if(afterProbe === undefined){ afterProbe = false }

        var nglComponent = WidgetsUtils.tabNGLComponents[uuid];
        var chainName = null;
        var resno = null;
        var additionalRange = null;
        var schemeId = null;
        var tabAtoms = [];

        nglComponent.stage.signals.clicked.removeAll();

        nglComponent.stage.signals.clicked.add(function(pd) {
            tabAtoms = [];

            if (pd.atom) {

                chainName = pd.atom.chainname;
                resno = pd.atom.resno;
                tabAtoms.push("CHAIN: " + chainName + " RES: " + pd.atom.resname + "-" + resno);

                WidgetsUtils.tabNGLComponents[uuid].pdbObj.model(1).naturalAminoAcidOnly().currentSelection.forEach(function(el,i,tab){

                    if(el.resSeq.trim() === resno.toString() && el.chainID.trim() === chainName){ tabAtoms.push("ATOM: " + el.name) }
                });

                //Set Range
                if(afterProbe){ additionalRange = {chainName: chainName, resno: resno, color: "0xffc0cb"} }//pink
                else{ additionalRange = [["red", ":" + chainName + " and " + resno]] }

            }

            WidgetsUtils.magnifyResidue(pd.atom? tabAtoms : null);

            if(afterProbe){
                schemeId = WidgetsUtils.getNGLCustomScheme(uuid, (pd.atom)? additionalRange : null);
            }else{
                schemeId = WidgetsUtils.getNGLScheme(nglComponent.baseChain, (pd.atom)? additionalRange : null);
            }

            //Update SchemeId
            nglComponent.baseRepresentation.setParameters({'colorScheme': schemeId});
            nglComponent.baseRepresentation.update({'color':true});

            //Fill the last schemeId to keep the selected residue display when representation is changing
            nglComponent.lastSchemeId = schemeId;

        });
    },


    /*
    *Remove listener(s) Hovered and add a new which display a div with atom info of a hovered residue
    *
    *@Params
    *@uuid (String represent the key provide by Job object wich match with an Ardock nglComponent object which is in tabNGLComponents)
    *
    */
    setNGLHoveredFunction : function(uuid){

        var nglComponent = WidgetsUtils.tabNGLComponents[uuid];

        nglComponent.stage.signals.hovered.removeAll();

        nglComponent.stage.signals.hovered.add(function(pd) {
            if(pd.atom){

                var $magnify = WidgetsUtils.get$Magnify();//$(document.body).find(".magnify");

                $magnify
                    .css("background-color", "rgba(255,255,255,0.8)")
                    .css("padding", "10px")
                    .css("width", "auto")
                    .css("height", "auto")
                    .css("border-radius", "15px")
                    .css("font-size", "14px")
                    .css("color", "black")
                    .css("left", (WidgetsUtils.mousePagePosition.x + 1) + "px")
                    .css("top", (WidgetsUtils.mousePagePosition.y + 1) + "px")
                    .text("Atom: " + pd.atom.qualifiedName())
                    .stop(true,true)
                    .show()
                    .fadeOut(6000)
                ;

                if(nglComponent.objectAtoms){
                    if(nglComponent.objectAtoms[pd.atom.serial]){
                        $magnify.append('<p>Bfactor : ' + nglComponent.objectAtoms[pd.atom.serial].tempFactor + '</p>');
                    }
                }

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
    *Change the representation to the target representation
    *
    *@Params
    *@uuid (String represent the key provide by Job object wich match with an Ardock nglComponent object which is in tabNGLComponents)
    *@targetRepresentation (String ex:"cartoon")
    */
    changeRepresentation : function(uuid, targetRepresentation){

        var nglComponent = WidgetsUtils.tabNGLComponents[uuid];

        //Fill change is ongoing
        nglComponent.changeReprOngoing = true;

        nglComponent.listRepresentationAvailable[targetRepresentation].setParameters({ 'opacity': 0, 'colorScheme': nglComponent.lastSchemeId });
        nglComponent.listRepresentationAvailable[targetRepresentation].update({ 'opacity' : true, 'color' : true });
        nglComponent.listRepresentationAvailable[targetRepresentation].setSelection(nglComponent.lastSelection);


        //Surface representation need a long time to display it
        if(targetRepresentation === "surface"){
            var waitLoader = new Loader({ root: nglComponent.storeDiv });
            waitLoader.display();
            setTimeout(function(){ waitLoader.destroy() }, 1300 * nglComponent.currentChainsVisible.length);
        }

        var iteration = 141;
        var timeOut = 15;
        var grad = 1 / (((iteration - 1))/2) ;

        //Change opacity of both representation
        var fadeChange = function(it){
            setTimeout(function(){

                if(it === iteration - 1) {

                    nglComponent.baseRepresentation = nglComponent.listRepresentationAvailable[targetRepresentation];
                    nglComponent.changeReprOngoing = false;

                }else if(it >= (iteration / 2)){

                    nglComponent.listRepresentationAvailable[targetRepresentation].setParameters({ 'opacity':  ( it === ( iteration - 2 ) ) ? 1 : (grad * ( it - (iteration / 2) )) });
                    nglComponent.listRepresentationAvailable[targetRepresentation].update({ 'opacity' : true });
                }else{
                    if(it === (((iteration - 1) / 2) - 1)){

                        nglComponent.baseRepresentation.setSelection('NOT:');
                    }else{

                        nglComponent.baseRepresentation.setParameters({ 'opacity': ( 1 - ( grad * (it) ) ) });
                        nglComponent.baseRepresentation.update({ 'opacity' : true });
                    }
                }

            },  timeOut * it);
        }

        //Loop fadeChange
        for(it = 0; it < iteration; it++){ fadeChange(it) }

    },


    /*
    *Remove or add a chain of the base representation from a NGL stage component
    *
    *@Params
    *@uuid (String represent the key provide by Job object wich match with an Ardock nglComponent object which is in tabNGLComponents)
    *@targetChain (String represent the chain to add or remove)
    *@addOrRemove (Boolean : true if add, false if remove)
    */
    removeAddChain : function(uuid, targetChain, addOrRemove){

            var nglComponent = WidgetsUtils.tabNGLComponents[uuid];

            //Fill a representation is add or remove
            nglComponent.addRemoveReprOngoing++;

            //Set color of the new representation chain
            var indexColor = nglComponent.baseChain.indexOf(targetChain);
            var chainAddRemoveColor = WidgetsUtils.tabColorSchemePrefered[indexColor];

            var chainAddRemoveRepresentation = null;

            var selectionVisible = "";

            //Set Selection visible
            var cCV = nglComponent.currentChainsVisible;
            if( !addOrRemove ) { cCV.splice(cCV.indexOf(targetChain),1) }

            selectionVisible = cCV.map(function(chain,i,tab) { return ":" + chain + ((tab.length <= 1) ? "" : (i === (tab.length - 1)) ? "" : " OR ") } ).join('');

            if( !selectionVisible.length ){ selectionVisible = "NOT:" }

            //Update last selection
            nglComponent.lastSelection = selectionVisible;

            if(!addOrRemove){ nglComponent.baseRepresentation.setSelection(selectionVisible.valueOf()) }

            //Get a new scheme for the new representation chain
            var schemeId = WidgetsUtils.getNGLScheme(null,[[chainAddRemoveColor , ":" + targetChain]]);

            //Create the selection of the layer representation
            var sele = "";
            if(addOrRemove){sele = ":NOT"}else{sele = ":" + targetChain}

            //Get the type of the ongoing representation
            var rType = nglComponent.baseRepresentation.name;

            //Variable for fading
            var iteration = 60;//40
            var timeOut = 10;//16

            //Surface representation need a long time to display itself
            var timeOneSurface = null;
            var timeOutSurface = null;
            var timeOutSurfaceOngoing = null;
            var surface = false;
            if(rType === "surface"){
                surface = true;

                var waitLoader = new Loader({ root: nglComponent.storeDiv });
                waitLoader.display();

                timeOneSurface = 1600;
                timeOutSurface = (addOrRemove) ? timeOneSurface * (nglComponent.currentChainsVisible.length + 1) : timeOneSurface * nglComponent.currentChainsVisible.length;
                timeOutSurfaceOngoing = (timeOutSurface - (iteration * timeOut)) * nglComponent.addRemoveReprOngoing;

                setTimeout(function(){ waitLoader.destroy() }, timeOutSurface );//* nglComponent.addRemoveReprOngoing);
            }

            //Add a new representation
            chainAddRemoveRepresentation = nglComponent.structureComponent.addRepresentation(rType, {'color': schemeId, 'sele': sele, 'opacity': (addOrRemove)? 0 : 1});

            //Update current chains visible
            if( addOrRemove ) { nglComponent.currentChainsVisible.push(targetChain) }

            //Fade representation
            var fadeChain = function(i){

                var opacity = (addOrRemove)? parseFloat((i * (1 / iteration)))  : parseFloat((iteration - i) * (1 / iteration));
                if(i === iteration - 2){
                    opacity = (addOrRemove)? 1 : 0;
                }
                var timeOuty = i * timeOut;
                var lastSelection = nglComponent.lastSelection;

                if(i === iteration - 1){
                    if(addOrRemove){
                        setTimeout(function(){
                            selectionVisible += " OR :" + targetChain;
                            nglComponent.structureComponent.removeRepresentation(chainAddRemoveRepresentation);
                            nglComponent.baseRepresentation.setSelection(selectionVisible);
                            nglComponent.lastSelection = selectionVisible;
                            chainAddRemoveRepresentation.setSelection('NOT:');
                            chainAddRemoveRepresentation = null;
                            if(surface){ setTimeout(function(){nglComponent.addRemoveReprOngoing--}, timeOutSurfaceOngoing) }else{ nglComponent.addRemoveReprOngoing-- }
                            //nglComponent.addRemoveReprOngoing--;
                        },timeOuty);
                    }else{
                        setTimeout(function(){
                            nglComponent.structureComponent.removeRepresentation(chainAddRemoveRepresentation);
                            chainAddRemoveRepresentation.setSelection('NOT:');
                            chainAddRemoveRepresentation = null;
                            if(surface){ setTimeout(function(){nglComponent.addRemoveReprOngoing--}, timeOutSurfaceOngoing) }else{ nglComponent.addRemoveReprOngoing-- }
                            //nglComponent.addRemoveReprOngoing--;
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

            //Go fade
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
    getStoreDiv: function(id, width, height, classes){
        //Handle Safari
        if(id === undefined){ id = null }
        if(width === undefined){ width = null }
        if(height === undefined){ height = null }
        if(classes === undefined){ classes = null }

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

            var job = null;

            var tabAtoms = data.pdbObj.model(1).currentSelection;
            //var tabchains = data.pdbObj.model(1).listChainID();

            var nglComponent = WidgetsUtils.tabNGLComponents[data.uuid];

            nglComponent.stage.signals.clicked.removeAll();
            nglComponent.probeMax = data.hasOwnProperty('probeMax') ? data['probeMax'] : 3 ;
            nglComponent.probeStart = true;
            nglComponent.probe++;

            //Create an array of atoms with atom.serial for keys
            var objectAtoms = {};
            for( i = 0 ; i < tabAtoms.length ; i++){
                objectAtoms[tabAtoms[i].serial] = {chainID : tabAtoms[i].chainID, tempFactor : tabAtoms[i].tempFactor};
            }

            //Fill objectAtoms to nglComponent
            nglComponent.objectAtoms = objectAtoms;
            console.dir(data);
            console.log("probeLeft Count ==> " + data.left);
            console.dir(this);
            //Handle probe left, waiting backend upgrade
            if(data.hasOwnProperty('left')) {
                console.log("We have dataleft  --> " + data.left);
                nglComponent.probeLeft = data.left;
                console.log("setting  nglComponent.probeLeft  to " + nglComponent.probeLeft);
            } else {
                console.log("We have no dataleft using 3 - " + nglComponent.probe);
                nglComponent.probeleft = 3 - nglComponent.probe;
                //nglComponent.probeleft = data.probeMax - nglComponent.probe;
            }

            //Get Job Object by uuid to signal Probe operation is starting
            try {
                console.log("calling probeStep with [" + nglComponent.currentChainsVisible + ',' + nglComponent.probeLeft + ']');
                WidgetsUtils.tabJobs[data.uuid].listWidgets.pS.probeStep(nglComponent.currentChainsVisible, nglComponent.probeLeft);
                //WidgetsUtils.tabJobs[data.uuid].listWidgets.pS.probeStep(nglComponent.currentChainsVisible, data.probeleft);
            } catch(e) {
                console.warn(e);
            }

            //Set the time when display the representation
            var timeOut = nglComponent.probe === 1 ? 0 : 1500 * nglComponent.probe;
            //var timeOut = 1;
            //Display the representation
            setTimeout(function(){
                //Create the SchemeId with coloring bFactor/tempFactor
                var schemeId = WidgetsUtils.getNGLCustomScheme(data.uuid);

                nglComponent.baseRepresentation.setParameters({'colorScheme': schemeId});
                nglComponent.baseRepresentation.update({'color': true});
                nglComponent.lastSchemeId = schemeId;

                //End ? Set the probeSchemeId and the clicked function
                if(nglComponent.probeLeft === 0){
                    WidgetsUtils.setNGLClickedFunction(data.uuid, true);//Second parameter --> afterProbe
                    nglComponent.probeSchemeId = schemeId;
                }

            },timeOut);
        }
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WidgetsUtils.W_counts++;
////////////////////////////////////////////////////////////////////////////////// MODULES EXPORT /////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    header : function(opt){ var obj = new Header(opt);return obj; },
    footer : function(opt){ var obj = new Footer(opt);return obj; },
    loader : function(opt){ var obj = new Loader(opt);return obj; },
    pdbSummary : function(opt){ var obj = new PdbSummary(opt);return obj; },
    displayTabs : function(opt){ var obj = new DisplayTabs(opt);return obj; },
    uploadBox : function(opt){ var obj = new UploadBox(opt);return obj; }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////