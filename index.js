
var events = require('events');

var bodyParser = require('body-parser');

var fs = require('fs');
var jsonfile = require('jsonfile');
var bTest = false;
var bHttp = false;
var bSlurm = false;
var bPdb = false;
var configFile;
var bean, ardockSett;
var fPdb = null;
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
var arP = require ('./ardockPipeline');

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


/*
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
*/


/*
* Run the ardock pipeline with Task implementations, in a non persistent version. Adapted for web services.
* @data must be a JSON containing a key 'ioSocketStream' which references a stream containing the PDB.
* @uuid_pdbCli [string] is a unique ID only used by the @socket (one socket can have multiple PDB submissions).
*/
// socket.emit("arDockChunck", { 'obj' : pdbObj.model(1).dump(), 'left' : cnt, 'uuid' : uuid_pdbCli });

var ioPdbSubmissionCallback_task = function (data, uuid_pdbCli, socket){
    console.log('received ' + uuid_pdbCli);
    let ncpu = 16;
    let cnt = probeMax;
    PDB_Lib.pdbLoad(bTest, {'ioSocketStream' : data, 'chain' : pdbChainList})
    .on('pdbLoad', (pdbObj) => {
        let management = {
            'naccess' : {
                'jobManager' : HPC_Lib.jobManager(), 'jobProfile' : 'arwen-prod_cpu'
            },
            'hex' : {
                'jobManager' : HPC_Lib.jobManager(), 'jobProfile' : 'arwen-prod_hex_' + ncpu + 'cpu',
                'nprobe' : probeMax, 'lprobes' : ardockSett.scriptVar.probeList, 'ncpu' : ncpu
            }
        }

        let naccessTest = false;
        let hexTest = false;
        let myPipeline = new arP(management, naccessTest, hexTest);

        myPipeline.push({'pdbObj' : pdbObj})
        .on('go', (namespace, probeTot) => {
            console.log("SOCKET : namespace is " + namespace);
            taskPatt = new RegExp(namespace);
            socket.emit("arDockStart", { 'restoreKey' : namespace, 'total' : probeTot, 'uuid' : uuid_pdbCli, 'typeComp' : 'cpu' });
        })
        .on('naccessEnd', () => {
            console.log("Naccess ends without any error");
        })
        .on('naccessErr', (msg) => {
            console.log("Top-Level naccess error : " + msg);
            socket.emit("arDockError", { 'type' : 'fatal', 'msg': msg, 'uuid' : uuid_pdbCli });
        })

        .on('oneProbe', (data) => {
            data['uuid'] = uuid_pdbCli;
            socket.emit('arDockChunck', data);
        })
        .on('allProbes', () => {
            console.log('All hex jobs end without any error');
        })
        .on('hexErr', (msg) => {
            console.log("Top-Level hex error : " + msg);
            socket.emit("arDockError", { 'type' : 'fatal', 'msg': msg, 'uuid' : uuid_pdbCli });
        });
    });
}

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
    .on('errJobs', function () {
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
    try {
        var obj = jsonfile.readFileSync(fileName);
        return obj;
    }
    catch (err) { console.log('ERROR while parsing the JSON file ' + fileName); }
};

process.argv.forEach(function (val, index, array){
    if (val === '--local') bLocal = true;
    if (val === '--test') bTest = true;
    if (val === '--pdb') bPdb = true;
    if (val === '--slurm') bSlurm = true;
    if (val === '--kill') bKill = true;
    if (val === '--http'){bHttp = true;bRest = true; bIo = true;}
    if (val === '--io') bIo = true;
    if (val === '--rest') bRest = true;
    if (val === '--gpu') ardockFunc = PDB_Lib.arDock_gpu;
    if (val === '-f'){
        if (! array[index + 1])
            throw("usage : ");
        fPdb = array[index + 1];
    }
    if (val === '-l'){
        if (! array[index + 1])
            throw("usage : ");
        fPdbList = array[index + 1];
         console.log("fPdbList ==> " + fPdbList);
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
    if (val === '--set') {
        if (! array[index + 1])
            throw("usage : ");
        ardockSett = parseConfig(array[index + 1]);
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

/*
// Parsing command-line pdb files
if (fPdbList && fPdb) {
    throw 'Specify a single pdb file locations or a file-listed pdb file locations'
}

if (fPdbList)
    pdbFileList = fs.readFileSync(fPdbList).toString().split("\n").filter(function(e){ return e !== "";});
else if (fPdb)
    pdbFileList.push(fPdb);
//////
*/
if (!bean) {
    throw 'No config file detected\n';
}
if (!ardockSett) {
    throw 'No ardock settings file detected\n';
} else {
    ardockSett.scriptVar.probeList = ardockSett.scriptVar.probeList.map((p) => {
        return ardockSett.scriptVar.DATA_DIR + '/' + p + '.pdb';
    });
}
HPC_Lib.configure({ probeMax : probeMax, bean : bean });
PDB_Lib.configure({ probeMax : probeMax, bean : bean });
PDB_Lib.setEspritDir(ardockSett.httpVar.espritDir);
//console.dir(bean);

// FLOW-LOGIC HTTP > SLURM > PDB_SUB
// if http is asked it is run first
// then we setup the job manager
if (bHttp || bIo || bRest) {
    //HTTP_Lib.setRestCallBack(restCallBack);
    HTTP_Lib.setIoPdbSubmissionCallback(ioPdbSubmissionCallback_task);
    HTTP_Lib.setIoKeySubmissionCallback(ioKeySubmissionCallback);
    HTTP_Lib.setIoESPriptSubmissionCallback(ioESPriptSubmissionCallback);
    HTTP_Lib.httpStart(ardockSett, bIo, bTest, bRest).on('listening', function() {
        if (bSlurm) {
            HPC_Lib.slurmStart(bLocal, forceCache).on('ready', function(){
                //
            });
        }
    });
} else if (bSlurm) { // No http asked test case or HPC only run for a particular pdb file
    console.log("WARNING : You choose --slurm option but it is not implemented yet with the tasks -> not available for now");
    /*
    HPC_Lib.slurmStart(bLocal, forceCache).cn('ready', function(){
        if (bPdb) {
            var queryLeft = pdbFileList.length;
            pdbFileList.forEach(function(currPdbFile) { // Pdb custom source loop
                console.log("opening at " + currPdbFile);
                PDB_Lib.pdbLoad(bTest, {'file' : currPdbFile, 'chain' : pdbChainList}).on('pdbLoad', function (pdbObj) {
                    pdbObj.model(1).bFactor(0);
                    if(!bTest)
                        PDB_Lib.process_naccess(HPC_Lib.jobManager(), {'pdbObj' : pdbObj}).on('finished', function () {
                        //console.log(pdbObj.model(1).dump());
                            ardockFunc(HPC_Lib.jobManager(), {'pdbObj' : pdbObj})
                            .on('jobCompletion', function(res, job, probeLeft) {
                                console.log("Results of a slurm and pdb custom probe left is " + probeLeft);
                                PDB_Lib.bFactorUpdate(pdbObj, res);
                                if (probeLeft === 0) {
                                    PDB_Lib.writeResults(pdbObj, HPC_Lib.jobManager(), currPdbFile).on('pdbWrote',function(){
                                    queryLeft--;
                                    if (bKill && queryLeft === 0){
                                        console.log("One time pipeline invocation complete, exiting");
                                        process.exit(0);
                                    }});
                                }

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
            });// Pdb custom source loop-end
        } else {
            HPC_Lib.slurmTest()
            .on('jobCompletion', function(res) {
                    PDB_Lib.bFactorUpdate(pdbObj, res);
                    //console.log(pdbObj.model(1).dump()); // to write the results (PDB)
                });
            console.log("No pdb provided slurm waiting");
        }
    });
    */
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
