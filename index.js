
var events = require('events');

var bodyParser = require('body-parser');

var fs = require('fs');
var jsonfile = require('jsonfile');
var bTest = false;
var bHttp = false;
var bSlurm = false;
var bPdb = false;
var configFile;
var bean, fPdb;
var pdbChainList = [];
var key;
var probeMax = 20;
var bLocal = false;
var bIo = false;
var bRest = false;
var bGpu = false; // to run on GPU
var forceCache = null;
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
            .on('go', function(taskID) {
                console.log('##TaskID Start ' + taskID);

                taskPatt = new RegExp(taskID);

                }) // test is actually useless arDock emitter is created at every call
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

var ioPdbSubmissionCallback = function (data, uuid, socket){
    console.log('received ' + uuid);
    var cnt = probeMax; // for CPU
    PDB_Lib.pdbLoad(bTest, {'ioSocketStream' : data, 'chain' : pdbChainList})
    .on('pdbLoad', function (pdbObj) {
        var taskPatt = null;
        pdbObj.model(1).bFactor(0);
        console.log("Routing to ardock a " + pdbObj.selecSize() + " atoms structure");
        PDB_Lib.process_naccess(HPC_Lib.jobManager(), {'pdbObj' : pdbObj})
            .on('error', function(msg){
                console.log("Top-Level nacces error : " + msg);
                socket.emit("arDockError", { 'type' : 'fatal', 'msg': msg, 'uuid' : uuid });
            })
            .on('lostJob', function(msg){
                console.log("Top-Level nacces error : " + msg);
                socket.emit("arDockError", { 'type' : 'fatal', 'msg': msg, 'uuid' : uuid });
            })
            .on('finished', function () {
            // For error managment development
            /*    console.log("GETTING OUT EARLY");
                socket.emit("arDockError", { 'type' : 'fatal', 'msg': "maxSolvError", 'uuid' : uuid });
                return;
*/

                HPC_Lib.slurmGpuCpuRatio()
                .on('error',function () {
                    socket.emit("arDockError", { 'type' : 'fatal', 'msg': 'squeueError', 'uuid' : uuid });
                })
                .on('data', function (cpuCount, gpuCount) {
                    var GpuMode=true;

                    console.log("CPU GPU ratio : " + cpuCount +  '/' +  gpuCount);
                    if (gpuCount > 4) GpuMode = false;
                    //if (cpuCount / 25)
                    var ardockProcess = GpuMode ? PDB_Lib.arDock_gpu : PDB_Lib.arDock;

                    var errorState = false;

                    ardockProcess(HPC_Lib.jobManager(), {'pdbObj' : pdbObj})
                    .on('go', function(taskID, total) {
                        console.log("SOCKET : taskID is " + taskID);
                        taskPatt = new RegExp(taskID);
                        var typeComp = GpuMode ? 'gpu' : 'cpu';
                        socket.emit("arDockStart", { restoreKey : taskID, total : total, uuid : uuid, typeComp : typeComp });
                    }) // test is actually useless arDock emitter is created at every call
                    .on('jobCompletion', function(res, job) {
                        if (errorState) return;
                    /*console.log('Job Completion pattern checking:');
                    console.log(taskPatt);*/
                    //console.log("JobDecount TESTING " + taskPatt + " VS " + job.id);

                        if (taskPatt.test(job.id)) cnt--; // for CPU

                        if (GpuMode) cnt = 0;

                        PDB_Lib.bFactorUpdate(pdbObj, res);
                        socket.emit("arDockChunck", { 'obj' : pdbObj.model(1).dump(), 'left' : cnt, 'probeMax' : probeMax, 'uuid' : uuid });
                    })
                    .on('error', function(msg){
                        console.log("Top-Level ardock error : " + msg);
                        errorState = true;
                        socket.emit("arDockError", { 'type' : 'fatal', 'msg': msg, 'uuid' : uuid });
                    //socket.disconnect(0);
                    });
                });
            })
        });
};

// route to handle "ESPript communication"
var ioESPriptSubmissionCallback = function (key, pdbStream, socket) {

    PDB_Lib.pdbWrite(key, pdbStream)
    .on('pdbWrote', function(fpath, fname){
        socket.emit('ESPriptCached', key, HTTP_Lib.ESPriptDirEndPoint() + '/' + fname);
    })
    .on('pdbWriteError', function(pdbString, fpath, fname){
        socket.emit('ESPriptCacheError', key);
    })

}

// route to handle socket io "keySubmission" packet
var ioKeySubmissionCallback = function (key, socket) {
    PDB_Lib.keyRequest(key)
    .on('completed', function (pdb, nProbes) {
        //console.log(pdb.model(1).dump());
        console.log('All jobs are completed');
        socket.emit("arDockRestore", { 'obj' : pdb.model(1).dump(), 'left' : 0, 'uuid' : key, 'probeMax' : nProbes });
    })
    .on('errJob', function () {
        console.log('Error during calculations');
        socket.emit('arDockRestoreError', { 'uuid' : key });
    })
    .on('notFinished', function (jobStatus) {
        //console.log(jobStatus);
        console.log('Some jobs are not finished');
        socket.emit('arDockRestoreBusy', { 'uuid' : key, 'status' : jobStatus});
    })
    .on('errKey', function () {
        console.log('This key does not exist');
        socket.emit('arDockRestoreUnknown', {'uuid' : key});
    });
}


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
    if (val === '-d'){
        if (! array[index + 1])
            throw("usage : ");
        forceCache = array[index + 1];
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
    if (val === '-k') {
        if (! array[index + 1]) throw 'usage : ';
        key = array[index + 1];
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
    HTTP_Lib.setIoKeySubmissionCallback(ioKeySubmissionCallback);
    HTTP_Lib.setIoESPriptSubmissionCallback(ioESPriptSubmissionCallback);
    HTTP_Lib.httpStart(bean, bIo, bTest, bRest).on('listening', function() {
        if (bSlurm) {
            HPC_Lib.slurmStart(bLocal, forceCache).on('ready', function(){

            });
        }
    });
} else if (bSlurm) { // No http asked test case or HPC only run for a particular pdb file
    HPC_Lib.slurmStart(bLocal).on('ready', function(){
        if (bPdb) {
            PDB_Lib.pdbLoad(bTest, {'file' : fPdb, 'chain' : pdbChainList}).on('pdbLoad', function (pdbObj) {
                pdbObj.model(1).bFactor(0);
                if(!bTest)
                    PDB_Lib.process_naccess(HPC_Lib.jobManager(), {'pdbObj' : pdbObj}).on('finished', function () {
                        //console.log(pdbObj.model(1).dump());
                        PDB_Lib.arDock_gpu(HPC_Lib.jobManager(), {'pdbObj' : pdbObj}).on('jobCompletion', function(res) {
                            console.log("Results of a slurm and pdb custom");
                            PDB_Lib.bFactorUpdate(pdbObj, res);
                            console.log(pdbObj.model(1).dump()); // to write the results (PDB)
                        });
                    });
                else
                    HPC_Lib.slurmTest()
                        .on('jobCompletion', function(res) {
                            console.log("Results of a slurm and pdb test");
                            //console.log(res);
                            PDB_Lib.bFactorUpdate(pdbObj, res);
                            //console.log(pdbObj.model(1).dump()); // to write the results (PDB)
                    });
            });
        } else {
            HPC_Lib.slurmTest()
            .on('jobCompletion', function(res) {
                    PDB_Lib.bFactorUpdate(pdbObj, res);
                    //console.log(pdbObj.model(1).dump()); // to write the results (PDB)
                });
            console.log("No pdb provided slurm waiting");
        }
    });
} else if (bPdb) {
    var claimSuccess = function(pdbObj) {
        console.log(pdbObj.dump() + "Successfully parsed " + pdbObj.selecSize() + ' atom record(s)');
    };
    if (!fPdb && !bTest)
        throw 'If you set up pdb service alone, you must provide a file or call for a test';
    if (fPdb)
        PDB_Lib.pdbLoad(bTest, {'file' : fPdb, 'chain' : pdbChainList}).on('pdbLoad', claimSuccess);
    else
        PDB_Lib.pdbLoad(bTest).on('pdbLoad', claimSuccess);
}








// for tests of the request by key
if (key) {
    PDB_Lib.keyRequest(key)
    .on('completed', function (pdb, nProbes) {
        console.log(pdb.model(1).dump());
        console.log('All jobs are completed');
    })
    .on('errJob', function () {
        console.log('Error during calculations');
    })
    .on('notFinished', function (jobStatus) {
        //console.log(jobStatus);
        console.log('Some jobs are not finished');
    })
    .on('errKey', function () {
        console.log('This key does not exist');
    });
}





// if stopping the process using Ctrl + C
process.on('SIGINT', function () {
    console.log(' Try to close the sbatch processes...');
    HPC_Lib.slurmStop()
    .on('cleanExit', function () {
        process.exit(0);
    })
    .on('exit', function () {
        process.exit(0);
    })
    .on('errScancel', function () {
        process.exit(1);
    })
    .on('errSqueue', function () {
        process.exit(1);
    });
});


return;