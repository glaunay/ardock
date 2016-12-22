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
        } else if ('ioSocketStream' in opt) {
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

var pdbWrite = function (key, pdbStream) {
    var emitter = new events.EventEmitter();
    console.log("attempting to stash pdb content w/ key " + key);
    /*console.log('pdbWrite input');
    console.log(pdbStream);
    */
    var basePath = bean.httpVariables.espritDir;
    var fname = key + '.pdb';
    pdbLib.parse({ 'rStream' : pdbStream })
                .on('end', function (pdbObjInp) {
                    var pdbString = "DBREF  ardock_structure  \n"
                                +   "REMARK    FREE_ESPRIPT MIN= 0 MAX= 9 LIM= 8\n";
                    pdbString += pdbObjInp.model(1).dump();
                    fs.writeFile(basePath + "/" + fname, pdbString, function(err) {
                        if(err) {
                            emitter.emit('pdbWriteError', pdbString, basePath, fname);
                            return console.log(err);
                        }
                        emitter.emit('pdbWrote', basePath, fname);
                    });
                });

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
    console.dir(jobManager);
    console.dir(jobManager.cacheDir());
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
*   - first, checking if content is a directory
*   - then check if .out file exists in the directory
*   - then check if .out file is empty or not
*   - finally check the JSON format of the .out file
*/
var statusJob_ardock = function (jobStatus, workDir, content) {
    if (! jobStatus) throw 'No jobStatus specified';
    if (! workDir) throw 'No workDir specified';
    if (! content) throw 'No value specified';
    // check if dir is not a directory
    var dir = workDir + '/' + content;
    if (!fs.statSync(dir).isDirectory()) return jobStatus;

    var regKey = /^ardockTask_[-0-9a-zA-Z]{1,}_hex_[0-9]{1,}$/;
    var outFile = dir + '/' + content + '.out';
    // check the existence of the .out file
    try { var stat = fs.statSync(outFile); }
    catch (err) {
        if ((err + '').match('no such file or directory')) {
            // no .out file > pending status
            jobStatus.pending = jobStatus.pending.concat(content);
            return jobStatus;
        } else console.log('' + err); // other errors

    }
    // check the size of the .out file
    if (stat.size === 0) {
        console.log('CASE3');
        // .out file is empty > running status
        jobStatus.running = jobStatus.running.concat(content);
        return jobStatus;
    }
    // check the good format of the .out file
    try { var dict = jsonfile.readFileSync(outFile); }
    catch (e) {
        console.log('CASE4');
        // .out file is not a JSON format (writing not finished for ex.) > running status
        jobStatus.running = jobStatus.running.concat(content);
        return jobStatus;
    }
    console.log('CASE COMPLETE');
    // else > completed status
    jobStatus.completed = jobStatus.completed.concat(content);
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



/*
* Find the node session path of the work associed to key
*/
var findPath = function (key) {
    if (! key) throw 'No key specified';
    var workDir;
    var tmpDir = bean.managerSettings.cacheDir;
    try { var tmpContent = fs.readdirSync(tmpDir); }
    catch (err) { throw 'Error during the reading of the tmpDir content :\n' + err; }

    // for each session of node
    tmpContent.forEach(function (nodeKey) {
        var nodeDir = tmpDir + '/' + nodeKey;
        try { var nodeDirContent = fs.readdirSync(nodeDir); }
        catch (err) { throw 'Error during the reading of the nodeDir content :\n' + err; }
        // for each files/directories of this node session
        nodeDirContent.forEach(function (val) {
            if (val.match(key)) workDir = nodeDir;
        });
    });
    return workDir;
}



/*
* On a key request
*/
var keyRequest = function (key) {
    if (! key) throw 'No key specified';

    var emitter = new events.EventEmitter();
    var jobStatus = { 'completed' : [], 'running' : [], 'pending' : [] };
    var regPDBfile = /^ardockTask_[-0-9a-zA-Z]{1,}.pdb$/; // for the PDB file
    var inputName = false; // to know if we found the PDB file
    var workDir = findPath(key);

    // squeue command before anyting else
    squeue().on('end', function (squeueRes) {

        // next line only for tests
        //sq.results += ' ardockTask_8b29c2ef-d467-40d5-afff-cd42638b96d2_hex_1 2045 F\n';

        if (! workDir) {
            emitter.emit('errKey');
            return;
        }
        // lists all the files and directories in the workDir directory
        try { var workDirContent = fs.readdirSync(workDir); }
        catch (err) { throw 'Error during the reading of the workDir content :\n' + err; }
        workDirContent.forEach(function (content) {
            if (content.match(key)) {
                jobStatus = statusJob_ardock(jobStatus, workDir, content); // update the job status
                if (content.match(regPDBfile) !== null) inputName = content; // if we find the PDB file
            }
        });

        // next 2 lines only for tests
        //jobStatus.running = jobStatus.completed;
        //jobStatus.completed = [];

        // if jobs are all completed
        if (jobStatus.running.length === 0 && jobStatus.pending.length === 0) {
            var dict = collectOutFiles(workDir, jobStatus.completed); // all results in a unique dictionnary
            if (! inputName) throw 'No PDB file in the working directory'; // check the existence of a PDB file
            console.log(workDir + '/' + inputName);
            pdbLib.parse({file : workDir + '/' + inputName}).on('end', function(pdb) { // parse the PDB file
                pdb.model(1).bFactor(0);
                bFactorUpdate(pdb, dict);
                emitter.emit('completed', pdb, jobStatus.completed.length);
            });
        // if jobs are in the queue
        } else if (checkQueue(jobStatus.running, squeueRes) && checkQueue(jobStatus.pending, squeueRes)) {
            emitter.emit('notFinished', jobStatus);
        } else {
            emitter.emit('errJobs');
        }
    });
    return emitter;
}





module.exports = {
    arDock : arDock,
    pdbLoad : pdbLoad,
    pdbWrite : pdbWrite,
    keyRequest : keyRequest,
    bFactorUpdate : bFactorUpdate,
    configure : function(data){ probeMax = data.probeMax; bean = data.bean;}
};

