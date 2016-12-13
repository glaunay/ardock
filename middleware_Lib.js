var pdbLib = require("pdb-lib");
var fs = require('fs');
var jsonfile = require('jsonfile');
var events = require('events');
var bean;
var uuid = require('node-uuid');



var pdbLoad = function(bTest, opt) {
    var emitter = new events.EventEmitter();
    if(bTest) {
        console.log('Running pdb parsing test...');
        var pdbFile = bean.scriptVariables.TEST_DIR + '/4MOW.pdb';
        var pdbParse = pdbLib.parse({ 'file' : pdbFile })
        .on('end', function(pdbObjInp) {
            var pdbObj = pdbObjInp.model(1).chain('D').naturalAminoAcidOnly().pull();
            emitter.emit('pdbLoad', pdbObj);
        });
    } else { // customFile or socketStream
        var rStream;
        if ('file' in opt) { // Custom File we check for specified chainID otherwise we take all
            pdbLib.parse({ 'file' : opt.file })
                .on('end',
                    function (pdbObjInp) {
                        var pdbObj = pdbObjInp.model(1).naturalAminoAcidOnly().pull();
                        if ('chain' in opt)
                            if(opt.chain.length > 0){
                                pdbObj = pdbObjInp.model(1).chain(opt.chain).naturalAminoAcidOnly().pull();
                            }
                        emitter.emit('pdbLoad', pdbObj);
                });
        } else if ('restFull' in opt) {
            console.log(Object.prototype.toString.call(opt.restFull));
            // If there are several chainIds we need to inform client and wait for resubmission with a chainId list
            pdbLib.parse({ 'rStream' : opt.restFull })
                .on('end', function (pdbObjInp) {
                    var pdbObj = pdbObjInp.model(1).naturalAminoAcidOnly().pull();
                    if ('chain' in opt)
                        if(opt.chain.length > 0){
                            var cChain = pdbObj.listChainID();
                            for (var i = 0 ; i < opt.chain.length ; i++) {
                                if (cChain.indexOf(opt.chain[i]) < 0) {
                                    emitter.emit('chainError', pdbObj, opt.chain[i], cChain);
                                    return emitter;
                                }
                            }
                        }
                    emitter.emit('pdbLoad', pdbObj);
                });
        } else if ('ioSocketStream') {
            // If there are several chainIds we dont care client did all the pre process job
            pdbLib.parse({ 'rStream' : opt.ioSocketStream })
                .on('end', function (pdbObjInp) {
                    var pdbObj = pdbObjInp.model(1).naturalAminoAcidOnly().pull();
                    emitter.emit('pdbLoad', pdbObj);
                });
        } else {
            throw 'PdbLoad unexpected opt in';
        }
    }

    return emitter;
}




// configure the dictionary to pass to the push function
var configJob = function (bGpu) {
    /**
    * According to bGpu, make a configuration or another.
    */ 
    jobOpt = {
        'tWall' : '0-00:15',
        'gid' : 'ws_users',
        'uid' : 'ws_ardock'
    };
    if (bGpu) {
        // on GPU
        jobOpt['partition'] = 'gpu',
        jobOpt['qos'] = 'gpu';
        jobOpt['nCores'] = 1;
        jobOpt['modules'] = ['hex_gpu', 'naccess'];
        jobOpt['hexFlags'] = "";
        jobOpt['gres'] = "gpu:1";
    } else {
        // on CPU
        jobOpt['partition'] = 'ws-dev';
        jobOpt['qos'] = 'ws-dev';
        jobOpt['nCores'] = 16;
        jobOpt['modules'] = ['hex', 'naccess'];
        jobOpt['hexFlags'] = "\" -nocuda -ncpu " + jobOpt.nCores + " \"";
        // no gres option on CPU
    }
    return jobOpt;
}



// new function to test (GPU or CPU)
var arDock = function (jobManager, opt, bGpu) {
    var emitter = new events.EventEmitter();
    var taskId = 'ardockTask_' + uuid.v4();
    //console.dir(jobManager);
    var pdbFilePath = jobManager.cacheDir() + '/' + taskId + '.pdb';

    var pdbObj = opt.pdbObj; // implement iosocket interface

    pdbLib.fWrite(pdbObj, pdbFilePath)
    .on("saved", function(){
        emitter.emit('go', taskId, probeMax);

        // run a "paquet"
        bean.scriptVariables.probeList.forEach(function(probe, i, array) {
            if (i >= probeMax) return;

            var probePdbFile = bean.scriptVariables.DATA_DIR + '/' + probe + '.pdb';
            var jName = taskId + '_hex_' + (i + 1);
            var scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_WEB.sh';

            // dictionary for the push function
            jobOpt = configJob(bGpu);
            jobOpt['id'] = jName;
            jobOpt['script'] = scriptFile;

            // List of variables which will be exported in the sbatch
            var exportVar = {
                    probePdbFile : probePdbFile,
                    targetPdbFile : pdbFilePath,
                    hexFlags : jobOpt.hexFlags // defined in the jconfigJob() function
            };
            jobOpt['exportVar'] = exportVar; // add in jobOpt
            delete jobOpt['hexFlags']; // and then remove because it's already defined in exportVar

            if(jobManager.isEmulated()) {
                jName = taskId + '_emul_' + (i + 1);
                exportVars = { 'residueHitsDir' : bean.scriptVariables.TEST_DIR + '/residue_hits' };
                scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_EMUL.sh';
            }
            //console.log(jobOpt);

            var j = jobManager.push(jobOpt); // creation of a job and setUp (creation of its sbatch file & submition)
            j.on('completed', function(stdout, stderr, jobObject){
                if(stderr) {
                    stderr.on('data', function(buf){
                        console.log("stderr content:");
                        console.log(buf.toString());
                    });
                }
                var results = '';
                stdout.on('data', function(buf){
                    results += buf.toString();
                });
                stdout.on('end', function (){
                    var jsonRes = JSON.parse(results);
                    emitter.emit('jobCompletion', jsonRes, jobObject);
                  //  if(cnt === 0)
                  //     emitter.emit('allComplete');
                });
            //jobManager.jobsView();
            })
            .on('error',function(e, j){
                console.log("job " + j.id + " : " + e);
            });
        });
    });
    return emitter;
}



// emiting pdb structure update, return emitter
var bFactorUpdate = function(pdbObj, dataObj) {
    if (!'rawCounts' in dataObj) return;
    // Assign bfactor as count increment, renormalize by listing current bfactor first ?
    dataObj.rawCounts.forEach(function(e){
        pdbObj.model(1).chain(e.chain).resSeq(e.resSeq).bFactor(1, 'increment');
    });
};




/*
* Check the status of an ardock job, by :
*   - first, checking if val is a directory
*   - then check if .out file exists in the directory
*   - then check if .out file is empty or not
*   - finally check the JSON format of the .out file
*/
var statusJob_ardock = function (jobStatus, workDir, val) {
    if (! jobStatus) throw 'No jobStatus specified';
    if (! workDir) throw 'No workDir specified';
    if (! val) throw 'No value specified';

    // check if val is an ardock directory
    var regDir = /^ardockTask_[-0-9a-zA-Z]{1,}_hex_[0-9]{1,}$/;
    if (val.match(regDir) === null) return jobStatus;

    var outFile = workDir + '/' + val + '/' + val + '.out';
    // check the existence of the .out file
    try { var stat = fs.statSync(outFile); }
    catch (err) {
        // no .out file > pending status
        jobStatus.pending = jobStatus.pending.concat(val);
        return jobStatus;
    }
    // check the size of the .out file
    if (stat.size === 0) {
        // .out file is empty > running status
        jobStatus.running = jobStatus.running.concat(val);
        return jobStatus;
    }
    // check the good format of the .out file
    try { var dict = jsonfile.readFileSync(outFile); }
    catch (e) {
        // .out file is not a JSON format (writing not finished for ex.) > running status
        jobStatus.running = jobStatus.running.concat(val);
        return jobStatus;
    }
    // else > completed status
    jobStatus.completed = jobStatus.completed.concat(val);
    return jobStatus;
}


/*
* Make a squeue command to know the jobs still running, pending or else
*/
var squeue = function () {
    var emitter = new events.EventEmitter();
    var exec_cmd = require('child_process').exec;
    var squeuePath = bean.managerSettings['slurmBinaries'] + '/squeue';

    exec_cmd(squeuePath + ' -o \"\%j \%t\"', function (err, stdout, stderr) {
        if (err) {
            console.log('Error : ' + err);
            return;
        }
        squeueRes = ('' + stdout).replace(/\"/g, '');
        emitter.emit('end', squeueRes);
    });
    return emitter;
}


/*
* For each job of jobList, check in the queue if we found them.
* In the case one (at least) is missing, return false. 
* Otherwise, return true.
*/
var checkQueue = function (jobList, squeueRes) {
    if (! jobList) throw 'No jobStatus specified';
    if (! squeueRes) throw 'No squeueRes specified';
    var bError = false;

    // for running jobs
    jobList.forEach(function (job) {
        console.log(job)
        var reg = new RegExp(job + ' ([A-Z]{1,2})\n');
        if (! reg.test(squeueRes)) { // the job is not in the queue
            console.log('Error : the job ' + job + ' is not finished AND is not in the queue...');
            bError = true;
        }
        // if we found the job in the queue, possibility to access the status
        //status = reg.exec(squeueRes);
        //console.log('status >' + status[1] + '<');
    });

    if (bError) return false;
    else return true;
}


/*
* Collect the rawCounts data in all the .out files, in a unique variable
*/
var collectOutFiles = function (workDir, jobsArray) {
    if (! workDir) throw 'No workDir specified';
    if (! jobsArray) throw 'No jobsArray specified';

    var allProbes = { 'rawCounts' : [] };
    jobsArray.forEach(function (job) {
        var outFile = workDir + '/' + job + '/' + job + '.out';
        var oneProbe = jsonfile.readFileSync(outFile);
        if (! oneProbe.rawCounts) throw 'No rawCounts key in the file ' + outFile;
        allProbes.rawCounts = allProbes.rawCounts.concat(oneProbe.rawCounts);
    });
    return allProbes;
}


// /*
// * Catch the pdb file by the pdb-lib parser
// */
// var catchPdbFile = function (workDir, workDirContent) {
//     if (! workDir) throw 'No workDir specified';
//     if (! workDirContent) throw 'No workDirContent specified';
//     var emitter = new events.EventEmitter();
//     var regPDBfile = /^ardockTask_[-0-9a-zA-Z]{1,}.pdb$/;
//     var pdb;
//     var pdbName = false; // to know if we found the PDB file

//     workDirContent.forEach(function (val) {
//         if (val.match(regPDBfile) === null) return;
//         else pdbName = val;
//     });

//     if (! pdbName) throw 'No PDB file in the working directory';
//     pdbLib.parse({file : workDir + '/' + pdbName}).on('end', function (obj) {
//         obj.model(1).bFactor(0);
//         emitter.emit('end', obj);
//     });
//     return emitter;
// }


/*
* On a key request
*/
var keyRequest = function (key) {
    if (! key) throw 'No key specified';

    var emitter = new events.EventEmitter();
    var workDir = bean.managerSettings.cacheDir + '/' + key;
    var jobStatus = { 'completed' : [], 'running' : [], 'pending' : [] };
    var regPDBfile = /^ardockTask_[-0-9a-zA-Z]{1,}.pdb$/; // for the PDB file
    var pdbName = false; // to know if we found the PDB file

    // squeue command before anyting else
    squeue().on('end', function (squeueRes) {
        // next line only for tests
        //squeueRes += " ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_7 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_10 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_11 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_12 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_13 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_14 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_15 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_16 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_17 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_18 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_19 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_20 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_21 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_22 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_23 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_24 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_25 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_3 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_4 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_5 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_6 AZ\n ardockTask_47d9573b-758a-4b24-a56f-f45654004921_hex_8 AZ\n"

        // lists all the files and directories in the workDir directory
        fs.readdir(workDir, function (err, workDirContent) {
            if (err) {
                try { var stat = fs.statSync(bean.managerSettings.cacheDir); }
                catch (e) { throw 'Error with the cacheDir path in package.json : ' + e; }
                emitter.emit('errKey');
                return;
            }

            workDirContent.forEach(function (val) {
                jobStatus = statusJob_ardock(jobStatus, workDir, val); // update the job status
                if (val.match(regPDBfile) !== null) pdbName = val; // if we find the PDB file
            });

            // if jobs are all completed
            if (jobStatus.running.length === 0 && jobStatus.pending.length === 0) {
                var dict = collectOutFiles(workDir, jobStatus.completed); // all results in a unique dictionnary
                if (! pdbName) throw 'No PDB file in the working directory'; // check the existence of a PDB file
                pdbLib.parse({file : workDir + '/' + pdbName}).on('end', function(pdb) { // parse the PDB file
                    pdb.model(1).bFactor(0);
                    bFactorUpdate(pdb, dict);
                    emitter.emit('completed', pdb);
                });
            // if jobs are in the queue
            } else if (checkQueue(jobStatus.running, squeueRes) && checkQueue(jobStatus.pending, squeueRes)) {
                emitter.emit('notFinished', jobStatus);
            } else {
                emitter.emit('errJobs');
            }
        });
    });
    return emitter;
}





module.exports = {
    arDock : arDock,
    pdbLoad : pdbLoad,
    keyRequest : keyRequest,
    bFactorUpdate : bFactorUpdate,
    configure : function(data){ probeMax = data.probeMax; bean = data.bean;}
};

