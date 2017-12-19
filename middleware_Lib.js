var pdbLib = require("pdb-lib");
var fs = require('fs');
var jsonfile = require('jsonfile');
var events = require('events');
var bean;
<<<<<<< HEAD
var uuid = require('node-uuid');


var writeResults = function(pdbObj, jobManager, currPdbFile) {
    var emitter = new events.EventEmitter();

    var resDir = jobManager.cacheDir() + '/ardockResults';
    console.log("Attempting to create results directory for process at " + resDir);
    try {
        fs.mkdirSync(resDir);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
        //console.log("Cache found already found at " + cacheDir);
    }
    var resultFileName = resDir + '/' + currPdbFile.split(/[\\/]/).pop();
    console.log("writing to " + resultFileName);
    console.log(pdbObj.model(1).dump());
    console.log("####\n");
    pdbLib.fWrite(pdbObj, resultFileName).on('saved', function(){ emitter.emit('pdbWrote');});

    return emitter;
}

=======
>>>>>>> front-end

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

<<<<<<< HEAD


/*
* Configure the dictionary to pass to the push function,
* according to "mode", make a configuration or another
* "mode" must be "cpu" or "gpu"
*/
var configJob = function (mode) {
    jobOpt = {
        'tWall' : '0-00:15'/*,
        'gid' : null, //ws_users on arwen-dev
        'uid' : null // ws_ardock*/
    };
    if ('uid' in bean.managerSettings) jobOpt['uid'] = bean.managerSettings.uid;
    if ('gid' in bean.managerSettings) jobOpt['gid'] = bean.managerSettings.gid;
    if (mode === "gpu") {
        jobOpt['partition'] = 'gpu_dp',
        jobOpt['qos'] = 'gpu';
        jobOpt['nCores'] = 1;
        jobOpt['modules'] = ['hex_gpu', 'naccess', 'cuda/5.0'];
        jobOpt['hexFlags'] = "";
        jobOpt['gres'] = "gpu:1";
    } else if (mode === "cpu") {
        if ('partition' in bean.managerSettings) jobOpt['partition'] = bean.managerSettings.partition;
        else jobOpt['partition'] = 'ws-dev';
        if ('qos' in bean.managerSettings) jobOpt['qos'] = bean.managerSettings.qos;
        else jobOpt['qos'] = 'ws-dev';
        jobOpt['nCores'] = 16;
        jobOpt['modules'] = ['hex', 'naccess'];
        jobOpt['hexFlags'] = "\" -nocuda -ncpu " + jobOpt.nCores + " \"";
        // no gres option on CPU
    } else {
        console.log("ERROR in configJob : mode not recognized. It must be \"cpu\" or \"gpu\" !");
    }
    return jobOpt;
}


/*
* config and run ardock on CPU
*/
var arDock = function (jobManager, opt) {
    var emitter = new events.EventEmitter();
    var taskId = 'ardockTask_' + uuid.v4();
    //console.dir(jobManager);
    var pdbFilePath = jobManager.cacheDir() + '/' + taskId + '.pdb';

    var pdbObj = opt.pdbObj; // implement iosocket interface

    pdbLib.fWrite(pdbObj, pdbFilePath)
    .on("saved", function(){
        emitter.emit('go', taskId, probeMax);
        var probeLeft = probeMax;
        // run a "paquet"
        bean.scriptVariables.probeList.forEach(function(probe, i, array) {
            if (i >= probeMax) return;

            var probePdbFile = bean.scriptVariables.DATA_DIR + '/' + probe + '.pdb';
            var jName = taskId + '_hex_' + (i + 1);
            var scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_WEB.sh';

            // dictionary for the push function
            jobOpt = configJob("cpu");
            jobOpt['id'] = jName;
            jobOpt['script'] = scriptFile;

            // List of variables which will be exported in the sbatch
            var exportVar = {
                    probePdbFile : probePdbFile,
                    targetPdbFile : pdbFilePath,
                    hexFlags : jobOpt.hexFlags, // defined in the jconfigJob() function
		    hexScript : bean.scriptVariables.HEX_CPU
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
                    probeLeft--;
                    var jsonRes = JSON.parse(results);
                    emitter.emit('jobCompletion', jsonRes, jobObject, probeLeft);
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


/*
* config and run a naccess job
* can be used in any context
*/
var naccess = function (jobManager, opt) {
    var emitter = new events.EventEmitter();
    var taskId = 'naccessTask_' + uuid.v4();
    var pdbFilePath = jobManager.cacheDir() + '/' + taskId + '.pdb';
    var pdbObj = opt.pdbObj;
    pdbLib.fWrite(pdbObj, pdbFilePath)
    .on("saved", function(){
        var jName = taskId + '_nac';
        var scriptFile = bean.scriptVariables.BIN_DIR + '/run_naccess_CPU.sh';
        var jobOpt = configJob("cpu"); // on CPU

        var exportVar = {
            targetPdbFile : pdbFilePath,
        };
        // add to dictionary
        jobOpt['id'] = jName;
        jobOpt['script'] = scriptFile;
        jobOpt['exportVar'] = exportVar;
        jobOpt['nCores'] = 1; // GL add
        var nac = jobManager.push(jobOpt);
        nac.on('completed', function (stdout, stderr, jobObject) {
            if(stderr) {
                stderr.on('data', function(buf){
                    console.log("stderr content:");
                    console.log(buf.toString());
=======
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
>>>>>>> front-end
                });

    return emitter;
}


<<<<<<< HEAD
/*
* config and run ardock on GPU (GPU_dp or GPU_sp)
*/
var arDock_gpu = function (jobManager, opt) {
    var emitter = new events.EventEmitter();
    var taskId = 'ardockTask_' + uuid.v4(); // unique ID
    //console.dir(jobManager);
    var pdbFilePath = jobManager.cacheDir() + '/' + taskId + '.pdb';

    var pdbObj = opt.pdbObj; // implement iosocket interface

    pdbLib.fWrite(pdbObj, pdbFilePath) // save the pdb file in the cache directory
    .on("saved", function(){
        emitter.emit('go', taskId, probeMax);

        // run only once the coreScript containing the nProbes computations
        var jName = taskId + '_hex';
        var probeDir = bean.scriptVariables.DATA_DIR;
        var scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_GPU_sp_dp.sh';

        // dictionary for the push function
        var jobOpt = configJob("gpu"); // on GPU
        // list of variables which will be exported in the sbatch
        var exportVar = {
            targetPdbFile : pdbFilePath,
            probeDir : probeDir,
            nProbe : probeMax, // the coreScript need the number of probes
            hexFlags : jobOpt.hexFlags, // defined in the jconfigJob() function
	    hexScript : bean.scriptVariables.HEX_GPU
        };

        // to simulate computations
        if(jobManager.isEmulated()) {
            jName = taskId + '_emul';
            exportVars = { 'residueHitsDir' : bean.scriptVariables.TEST_DIR + '/residue_hits' };
            scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_EMUL.sh';
        }

        // add to dictionary
        jobOpt['id'] = jName;
        jobOpt['script'] = scriptFile;
        jobOpt['exportVar'] = exportVar;
        delete jobOpt['hexFlags']; // and then remove because it's already defined in exportVar

        var j = jobManager.push(jobOpt); // creation of a job and setUp (creation of its sbatch file & submition)
        j.on('completed', function(stdout, stderr, jobObject){ // event in nslurm._pull()
            if(stderr) {
                stderr.on('data', function(buf){
                    console.log("stderr content:");
                    console.log(buf.toString());
                });
            }
            var results = '';
            stdout.on('data', function(buf){
                results += buf.toString();
            })
            .on('end', function (){
                var jsonRes = JSON.parse(results);
                emitter.emit('jobCompletion', jsonRes, jobObject, 0);// emitter.emit('jobCompletion', jsonRes, jobObject, probeLeft);
                //if(cnt === 0) emitter.emit('allComplete');
            });
        })
        .on('error', function (e,j) {
            console.log("job " + j.id + " : " + e);
        });
    });
    return emitter;
}

=======
>>>>>>> front-end

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
*   (1) first, check if @content is a directory
*   (2) check if the job is a hex task : looking the jobID.json file and its tagTask
*   (3) then check if .out file exists in the directory
*   (4) then check if .out file is empty or not
*   (5) finally check the JSON format of the .out file
* This function returns a string defining the status of the job
*/
var statusJob = function (nsDir, content) {
    if (! nsDir) throw 'No nsDir specified';
    if (! content) throw 'No value specified';

    let dir = nsDir + '/' + content;
    if (! fs.statSync(dir).isDirectory()) return null; // check if dir is not a directory (1)

    // (2)
    let jobIDfile = dir + '/jobID.json';
    try { var jif_content = jsonfile.readFileSync(jobIDfile); }
    catch (err) {
        var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log("[" + d + "] ardockJobStatus: jobIDfile error : " + jobIDfile + ' : ' + err);
        // .out file is not a JSON format (writing not finished for example) -> running status
        return null;
    }
    if (jif_content.tagTask !== 'hex') return null;

    let outFile = dir + '/' + content + '.out'; // @content is a uuid used for .out, .err files
    if (! fs.existsSync(outFile)) { // (3)
        var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        //console.log("[" + d + "] _ardockJobStatus:outputfile not found : " + outFile);
        return 'pending';
    }

    // check the existence of the .out file
    /*
    try { var stat = fs.statSync(outFile); }
    catch (err) {
        if ((err + '').match('no such file or directory')) {
            var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            console.log("[" + d + "] ardockJobStatus:outputfile not found : " + outFile);
            // no .out file > pending status
            jobStatus.pending = jobStatus.pending.concat(content);
            return jobStatus;
        } else console.log('' + err); // other errors
<<<<<<< HEAD
    }
    // check the size of the .out file
    if (stat.size === 0) {
        // .out file is empty > running status
        jobStatus.running = jobStatus.running.concat(content);
        return jobStatus;
=======

    }*/

    var stat = fs.statSync(outFile);
    if (stat.size === 0) { // check the size of the .out file (4)
        var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log("[" + d + "] ardockJobStatus:empty File : " + outFile);
        return 'running'; // .out file is empty -> running status
>>>>>>> front-end
    }
    
    try { // check the good format of the .out file (5)
        console.log('Trying to sync read ' + outFile);
        var dict = jsonfile.readFileSync(outFile); }
    catch (e) {
        var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log("[" + d + "] ardockJobStatus:wrong format : " + outFile);
        // .out file is not a JSON format (writing not finished for example) -> running status
        return 'running';
    }

    var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    console.log("[" + d + "] ardockJobStatus:Complete at " + outFile);
    return 'completed'; // else -> completed status
}


/*
* Make a squeue command to know the jobs still running, pending or else
*/
var squeue = function () {
    var emitter = new events.EventEmitter();
    var exec_cmd = require('child_process').exec;
    var squeuePath = bean.binaries.queueBin;
    console.log("squeuePath : " + squeuePath)

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
        //console.log(job)
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
var collectResults = function (outFiles) {
    if (! outFiles) throw 'No outFiles specified';

    var allProbes = { 'rawCounts' : [] };
    outFiles.forEach(function (outF) {
        var oneProbe = jsonfile.readFileSync(outF);
        if (! oneProbe.rawCounts) throw 'No rawCounts key in the file ' + outF;
        allProbes.rawCounts = allProbes.rawCounts.concat(oneProbe.rawCounts);
    });
    return allProbes;
}



/*
* Find the node session path of the work associed to myNamespace
*/
var findPath = function (myNamespace) {
    if (! myNamespace) throw 'No namespace specified';
    let nsDir; // namespace directory
    let cacheDir = bean.cacheDir;
    let regKey = new RegExp('^' + myNamespace + '$');

    try { var cacheDirContent = fs.readdirSync(cacheDir); }
    catch (err) { throw 'Error during the reading of the cacheDir content :\n' + err; }

    // for each session of node
    cacheDirContent.forEach(function (nodeUuid) {
        let nodeDir = cacheDir + '/' + nodeUuid;
        try { var nodeDirContent = fs.readdirSync(nodeDir); }
        catch (err) {
            if (err.code != 'ENOTDIR') throw err;
            else return; // if nodeDir is a file
        }

        // for each namespace directories of this node session
        nodeDirContent.forEach(function (namespaceUuid) {
            //console.log('>' + namespaceUuid + '<');
            //console.log(myNamespace);
            if (namespaceUuid.match(regKey)) nsDir = nodeDir + '/' + myNamespace;
        });
    });
    return nsDir;
}


/*
* On a key request :
* (1) find the path to the namespace directory nsDir (thanks to @key = "namespace")
* (2) make a squeue request to know what are the jobs still running / pending
* (3) for each element of the nsDir, check its status
* (4) find the .out file in case the job is completed
* (5) 
*/
var keyRequest = function (key) {
    if (! key) throw 'No key specified';

    let emitter = new events.EventEmitter();
    let jobStatus = { 'completed' : [], 'running' : [], 'pending' : [] };
    let outFiles = []; // to know if we found the .out file
    let inputFile = false; // to know if we found the PDB file
    let nsDir = findPath(key); // (1)

    squeue().on('end', function (squeueRes) { // (2)
        if (! nsDir) {
            emitter.emit('errKey');
            return;
        }
        
        // console.log("squeueRes")
        // console.log(squeueRes)
        // console.log("nsDir")
        // console.log(nsDir)

        // lists all the files and directories in the nsDir
        try { var nsDirContent = fs.readdirSync(nsDir); }
        catch (err) { throw 'Error during the reading of the nsDir content :\n' + err; }

        // console.log("nsDirContent")
        // console.log(nsDirContent)

        for (let content of nsDirContent) { // (3)
            console.log("toto")
            console.log(content)
            console.log(jobStatus)
            content_status = statusJob(nsDir, content); // find the status of @content
            if (content_status !== null) {
                jobStatus[content_status].push(content); // add @content to its status into jobStatus
                if (content_status ==  "completed") { // if the status is completed (4)
                    outFiles.push(nsDir + '/' + content + '/' + content + '.out');
                    if (! inputFile) inputFile = nsDir + '/' + content + '/input/targetPdbFile.inp'; // we need only one
                }
            }
            console.log(jobStatus)
        }

        // next 2 lines only for tests
        //jobStatus.running = jobStatus.completed;
        //jobStatus.completed = [];

        // if jobs are all completed
        if (jobStatus.running.length === 0 && jobStatus.pending.length === 0) {
            var dict = collectResults(outFiles); // all results in a unique dictionnary
            if (! inputFile) throw 'No input PDB file fount at all'; // check the existence of at least one PDB file
            console.log(nsDir + '/' + inputFile);
            pdbLib.parse({file : inputFile}).on('end', function(pdb) { // parse the PDB file
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
    pdbLoad : pdbLoad,
    pdbWrite : pdbWrite,
    keyRequest : keyRequest,
    bFactorUpdate : bFactorUpdate,
<<<<<<< HEAD
    writeResults : writeResults,
    configure : function(data){ probeMax = data.probeMax; bean = data.bean;}
=======
    configure : function(data){ probeMax = data.probeMax; bean = data.bean }
>>>>>>> front-end
};

