
var events = require('events');

var bodyParser = require('body-parser');

var fs = require('fs');
var jsonfile = require('jsonfile')
var bTest = false;
var bHttp = false;
var bSlurm = false;
var bPdb = false;
var configFile;
var bean, fPdb;
var pdbChainList = [];
var probeMax = 20;
var bLocal = false;
var bIo = false;
var bRest = false;
var bGpu = false; // to run on GPU

var HTTP_Lib = require('./HTTP_Lib');
var HPC_Lib = require('./HPC_Lib');
var PDB_Lib = require('./middleware_Lib');

/* Last update : GL 2016-02-18


node index.js --conf /data/dev/ardock/scriptPackage/package.json --pdb --slurm -p 3 --local --test
node index.js --conf /data/dev/ardock/scriptPackage/package.json --pdb -f /data/dev/ardock/scriptPackage/test/1BRS.pdb -c A,B --slurm -p 10



============ Web application ARDOCK process ============

/home/glaunay/ardock-dev/lib:

// Running submission to cluster test.
// Running apache server listening + submission to cluster

// BackEnd test phases
// Phase 1
// connecting and monintoring slurm engine w/ dummy job
node index.js --conf /data/dev/ardock/scriptPackage/package.json --test --slurm
// Phase 2
// PDB parsing, catching async slurm output to enrich the pdb data structure
// Parsing a test PDB file and processing bunch of dummy jobs w/ precomputed output
// that are coherent w/ the test PDB file.
node index.js --conf /data/dev/ardock/scriptPackage/package.json --test
==> Phase 2 is sufficient to front-end development
-pdb PDB_LOC -c PDB_CHAIN
// Phase 3 -- HPC --
// Same as Phase 2 but with a original pdb file and actual docking computations




//FrontEnd test
Build the client code
[glaunay@ibcp3151 /home/glaunay/ardock-dev/lib]$browserify -t browserify-css main.js -o js/bundleTest.js
Start http server on test mode
[glaunay@ibcp3151 /home/glaunay/ardock-dev/lib]$node index.js --conf /data/dev/ardock/scriptPackage/package.json --test --http
See result at http://ardock.ibcp.fr/test
*/

/*
    Return the minimal html markup, bundleTest.js is intended to have been browserified
*/


var restCallBack = function (ans, data) {
    // Process data -> pdbLoad-> slurm -> return content through ans

    var cnt = probeMax;
    PDB_Lib.pdbLoad(bTest, {'restFull' : data, 'chain' : pdbChainList})
        .on('pdbLoad', function (pdbObj) {
            var TaskPatt = null;
            pdbObj.model(1).bFactor(0);
            //ans.send("<h1>HOurrah</h1>\n" + pdbObj.dump());

            PDB_Lib.arDock(HPC_Lib.jobManager(), {'pdbObj' : pdbObj})
            .on('go', function(taskID) {taskPatt = new RegExp(taskID);}) // test is actually useless arDock emitter is created at every call
            .on('jobCompletion', function(res, job) {
                        if (taskPatt.test(job.id)) cnt--;
                        PDB_Lib.bFactorUpdate(pdbObj, res);

                        PDB_Lib.bFactorUpdate(pdbObj, res);
                        console.log(pdbObj.model(1).dump());
                        console.log(cnt);
                        if(cnt === 0) {
                            console.log("sending stuff");
                            ans.send("<h1>Results of a slurm and pdb restFull</h1>\n" + pdbObj.dump());
                        }
                    });

        })
        .on('chainError', function(pdbObj, chain, total){
           ans.send("No such chain ID " + chain + " in  " + total);
            //console.log(data);
        });
};


//* arDockPdbSubmit has to receive { data : pdbString, uuid:uuid}
// socket.emit("arDockChunck", { 'obj' : pdbObj.model(1).dump(), 'left' : cnt, 'uuid' : uuid });

var ioPdbSubmissionCallback = function (data, socket){


    PDB_Lib.pdbLoad(bTest, {'ioSocketStream' : data, 'chain' : pdbChainList})
        .on('pdbLoad', function (pdbObj) {
            pdbObj.model(1).bFactor(0);
            console.log("Routing to ardock a " + pdbObj.selecSize() + " atoms structure");
            PDB_Lib.arDock(HPC_Lib.jobManager(), {'pdbObj' : pdbObj})
            .on('go', function(taskID, total) {
                console.log("SOCKET : " + socket);
                socket.emit("arDockStart", { id : taskID, total : total });
            }) // test is actually useless arDock emitter is created at every call
            .on('jobCompletion', function(res, job, cnt) {
                PDB_Lib.bFactorUpdate(pdbObj, res);
                //socket.emit("arDockChunck", { obj : pdbObj.model(1).dump(), left : cnt });
                socket.emit("arDockChunck", { 'obj' : pdbObj.model(1).dump(), 'left' : cnt, 'uuid' : uuid });
            });
    });
};



var parseConfig = function (fileName){
    var obj = jsonfile.readFileSync(fileName);
    return obj;
};

process.argv.forEach(function (val, index, array){
    if (val === '--local') bLocal = true;
    if (val === '--test') bTest = true;
    if (val === '--pdb') bPdb = true;
    if (val === '--slurm') bSlurm = true;
    if (val === '--http'){bHttp = true;bRest = true; bIo = true;}
    if (val === '--io') bIo = true;
    if (val === '--rest') bRest = true;
    if (val === '--gpu') bGpu = true;
    if (val === '-f'){
        if (! array[index + 1])
            throw("usage : ");
        fPdb = array[index + 1];
    }
    if (val === '-c'){
        if (! array[index + 1])
            throw("usage : ");
        pdbChainList = array[index + 1].split(',');
    }
    if (val === '--conf') {
        if (! array[index + 1])
            throw("usage : ");
        bean = parseConfig(array[index + 1]);
    }
    if (val === '-p') {
        if (! array[index + 1])
            throw("usage : ");
        probeMax = parseInt(array[index + 1]);
    }
});

if (!bean) {
    throw 'No config file detected\n';
}
HPC_Lib.configure({ probeMax : probeMax, bean : bean });
PDB_Lib.configure({ probeMax : probeMax, bean : bean });

//console.dir(bean);

// FLOW-LOGIC HTTP > SLURM > PDB_SUB
// if http is asked it is run first
// then we setup the job manager
if (bHttp || bIo || bRest) {
    HTTP_Lib.setRestCallBack(restCallBack);
    HTTP_Lib.setIoPdbSubmissionCallback(ioPdbSubmissionCallback);
    HTTP_Lib.httpStart(bean, bIo, bTest, bRest).on('listening', function() {
        if (bSlurm) {
            HPC_Lib.slurmStart(bLocal).on('ready', function(){

            });
        }
    });
} else if (bSlurm) { // No http asked test case or HPC only run for a particular pdb file
    HPC_Lib.slurmStart(bLocal).on('ready', function(){
        if (bPdb) {
            PDB_Lib.pdbLoad(bTest, {'file' : fPdb, 'chain' : pdbChainList}).on('pdbLoad', function (pdbObj) {
                pdbObj.model(1).bFactor(0);
                if(!bTest)
                    // CAUTION : arDock calling with bGpu variable
                    PDB_Lib.arDock(HPC_Lib.jobManager(), {'pdbObj' : pdbObj}, bGpu).on('jobCompletion', function(res) {
                        console.log("Results of a slurm and pdb custom");
                        PDB_Lib.bFactorUpdate(pdbObj, res);
                        console.log(pdbObj.model(1).dump());
                    });
                else
                    HPC_Lib.slurmTest()
                        .on('jobCompletion', function(res) {
                            console.log("Results of a slurm and pdb test");
                            //console.log(res);
                            PDB_Lib.bFactorUpdate(pdbObj, res);
                            console.log(pdbObj.model(1).dump());
                    });
            });
        } else {
            HPC_Lib.slurmTest()
            .on('jobCompletion', function(res) {
                    PDB_Lib.bFactorUpdate(pdbObj, res);
                    console.log(pdbObj.model(1).dump());
                });
            console.log("No pdb provided slurm waiting");
        }
    });
} else if (bPdb) {
    var claimSuccess = function(pdbObj) {
        console.log(pdbObj.dump() + "Succesfully parsed " + pdbObj.selecSize() + ' atom record(s)');
    };
    if (!fPdb && !bTest)
        throw 'If you set up pdb service alone, you must provide a file or call for a test';
    if (fPdb)
        PDB_Lib.pdbLoad(bTest, {'file' : fPdb, 'chain' : pdbChainList}).on('pdbLoad', claimSuccess);
    else
        PDB_Lib.pdbLoad(bTest).on('pdbLoad', claimSuccess);
}

return;