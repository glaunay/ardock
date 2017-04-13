var jobManager = require('nslurmardocklegacy');
var events = require('events');
var Random = require("random-js")
var bean, probeMax;







var slurmTest = function () {
    var emitter = new events.EventEmitter();
    var r = new Random(Random.engines.mt19937().seedWithArray([0x12345678, 0x90abcdef]));
    var n = bean.scriptVariables.probeList.length;
    bean.scriptVariables.probeList.forEach(function(probe, i, array) {
        if (i >= probeMax) return;
        var jName = "test_probe_" + (i + 1);
        console.log(n + ' , ' + i + ' ' + jName);
        var sleepTime = r.integer(2, n);
        var j = jobManager.push({'script' : bean.scriptVariables.BIN_DIR + '/run_ar_dock_DVL.sh', 'id' : jName,
                'gid' : 'ws_users', 'uid' : 'ws_ardock',
                'exportVar' : { // List of variables which will be exported in the sbatch
                    'sleepTime' : sleepTime,
                    'target' : "dummyPdb",
                    'probeNumber' : (i + 1),
                    'residueHitsDir' : bean.scriptVariables.TEST_DIR + '/residue_hits'
                    }
                });
        j.on('completed', function(stdout, stderr, jobObject){

            /* We may have to apply buf.toString in end/close event ot eht stdout stream*/
            if(stderr) {
                console.log("ERROR log:");
                stderr.on('data', function(buf){ console.log(buf.toString()); });
            }
            var results = '';
            stdout.on('data', function(buf){
                results += buf.toString();
            });
            stdout.on('end', function (){
                    var jsonRes = JSON.parse(results);
                    emitter.emit('jobCompletion', jsonRes);
                });

            jobManager.jobsView();
        })
        .on('error',function(e, j){
            console.log("job " + j.id + " : " + e);
        });
    });
    return emitter;
}


var slurmStop = function() {
    var emitter = new events.EventEmitter();
    jobManager.stop(bean)
    .on('cleanExit', function (){
        emitter.emit('cleanExit');
    })
    .on('exit', function (){
        emitter.emit('exit');
    })
    .on('errScancel', function () {
        emitter.emit('errScancel');
    })
    .on('errSqueue', function () {
        emitter.emit('errSqueue');
    });

    //console.log(emitter);
    return emitter;
}


var slurmStart = function(bLocal, forceCache) {
    var emitter = new events.EventEmitter();
    if (forceCache) {
        console.log ("You provided a predefined cache path for scheduler as " + forceCache);
        bean.managerSettings["forceCache"] = forceCache;
    }
    jobManager.start(bean.managerSettings);
    if(bLocal)
        jobManager.emulate();
    jobManager.on('exhausted', function(){
        emitter.emit("done");
        console.log("All jobs processed");
    });
    jobManager.on("ready", function() {
        emitter.emit('ready');
    });
    return emitter;
}

var slurmGpuCpuRatio = function() {
    var emitter = new events.EventEmitter();
    jobManager.squeueReport()
    .on('end', function(squeueInterface) {
       // console.log(squeueInterface);
        gpuCount = squeueInterface.matchPartition("gpu")['id'].length;
        cpuCount = squeueInterface.matchPartition("ws-")['id'].length;
        emitter.emit('data', cpuCount, gpuCount);
    })
    .on('errSqueue', function(){
        emitter.emit('error');
    });

    return emitter;
}

module.exports = {
    slurmTest : slurmTest,
    slurmStart : slurmStart,
    slurmStop : slurmStop,
    slurmGpuCpuRatio : slurmGpuCpuRatio,
    jobManager : function() {return jobManager;},
    configure : function (data) { probeMax = data.probeMax; bean = data.bean;}
};
