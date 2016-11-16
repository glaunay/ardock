var pdbLib = require("pdb-lib");
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

// //sending an arDock task to cluster, return emitter
// var arDock = function (jobManager, opt) {
//     var emitter = new events.EventEmitter();
//     var taskId = 'ardockTask_' + uuid.v4();
//     //console.dir(jobManager);
//     var pdbFilePath = jobManager.cacheDir() + '/' + taskId + '.pdb';

//     var pdbObj = opt.pdbObj; // implement iosocket interface

//     pdbLib.fWrite(pdbObj, pdbFilePath)
//     .on("saved", function(){
//         emitter.emit('go', taskId, probeMax);
//         bean.scriptVariables.probeList.forEach(function(probe, i, array) {
//             if (i >= probeMax) return;

//             var probePdbFile = bean.scriptVariables.DATA_DIR + '/' + probe + '.pdb';
//             var jName = taskId + '_hex_' + (i + 1);
//             var scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_WEB.sh';
//             var exportVar = { // List of variables which will be exported in the sbatch
//                     probePdbFile : probePdbFile,
//                     targetPdbFile : pdbFilePath
//             };
//             if(jobManager.isEmulated()) {
//                 jName = taskId + '_emul_' + (i + 1);
//                 exportVar = { 'residueHitsDir' : bean.scriptVariables.TEST_DIR + '/residue_hits' };
//                 scriptFile = bean.scriptVariables.BIN_DIR + '/run_ar_dock_EMUL.sh';
//             }
//             var j = jobManager.push({ 'id' : jName,
//                 'script' : scriptFile,
//                 'nCpu' : 8, 'tWall' : '0-00:15',
//                 'gid' : 'ws_users', 'uid' : 'ws_ardock',
//                 'exportVar' : exportVar
//             });
//             j.on('completed', function(stdout, stderr, jobObject){
//                 if(stderr) {
//                     stderr.on('data', function(buf){
//                         console.log("stderr content:");
//                         console.log(buf.toString());
//                     });
//                 }
//                 var results = '';
//                 stdout.on('data', function(buf){
//                     results += buf.toString();
//                 });
//                 stdout.on('end', function (){
//                     var jsonRes = JSON.parse(results);
//                     emitter.emit('jobCompletion', jsonRes, jobObject);
//                   //  if(cnt === 0)
//                   //     emitter.emit('allComplete');
//                 });
//             //jobManager.jobsView();
//             })
//             .on('error',function(e, j){
//                 console.log("job " + j.id + " : " + e);
//             });
//         });
//     });
//     return emitter;
// }


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


module.exports = {
    arDock : arDock,
    pdbLoad : pdbLoad,
    bFactorUpdate : bFactorUpdate,
    configure : function(data){ probeMax = data.probeMax; bean = data.bean;}
};

