
var hexT = require("hextask");
var nacT = require("naccesstask");

var events = require('events');
var fs = require('fs');
var JSON = require("JSON");
var path = require('path');
var pdbLib = require('pdb-lib');
var stream = require('stream');
var uuid = require('uuid/v4');


class ardockPipeline {

    constructor (management, nacTest, hexTest) {
        this.emitter = new events.EventEmitter();
        this.management = management;

        // Naccess Task
        this.n = new nacT.Naccess(this.management.naccess, false, { 'modules' : ['naccess'] });
        if (nacTest) this.n.testMode(true);

        // Hex Task
        this.hexTest = hexTest;
        this.nprobe = this.management.hex.nprobe;
        this.h_array = this.create_hexTasks(management);
    }


    /*
    * All the process for one @data.pdbObj with all the probes
    */
    run (pdbObj) {
        let self = this;
        let counter = self.nprobe; // count the number of probes = the number of Hex jobs
        let hexError = false; // if one Hex job emit an error
        let namespace = uuid();

        pdbObj.model(1).bFactor(0); // all bFactors to zero first

        // naccess inputs
        let inputs = {
            'targetPdbFile' : pdbObj.model(1).dump().replace(/\n/g, '\n').replace(/\r/g, '\r'),
            'uuid' : namespace
        }
        let rs = stream.Readable();
        rs.push(JSON.stringify(inputs));
        rs.push(null);

        // run naccess
        rs.pipe(self.n)
        .on('processed', function (results_n) {
            if (results_n.uuid == namespace) { // only if naccess results are mine : is it necessary considering the pipeline is not persitent ?
                self.emitter.emit('naccessEnd');
                self.bFactor_minusOne(pdbObj, results_n.accessibilities);
            
                // hex inputs
                let inputs = {
                    'targetPdbFile' : pdbObj.model(1).dump().replace(/\n/g, '\n').replace(/\r/g, '\r'),
                    'uuid' : results_n.uuid
                }

                // run hex
                self.emitter.emit('go', namespace, self.nprobe);
                self.run_hexTasks(inputs)
                .on('processed', function (results_h) {
                    if (results_h.uuid == namespace) { // only if hex results are mine
                        self.bFactor_increment(pdbObj, results_h.rawCounts);

                        counter --;
                        self.emitter.emit('oneProbe', {
                            'obj' : pdbObj.model(1).dump(),
                            'left' : counter,
                            'probeMax' : self.nprobe
                        });
                        if (counter == 0) { // if all the probes have been processed
                            if (! hexError) { // if no error from all Hex jobs
                                self.emitter.emit('allProbes');
                            } else {
                                self.emitter.emit('hexErr');
                            }
                        }
                    }
                })
                .on('err', function (err, jobID) {
                    counter --;
                    hexError = true;
                    self.emitter.emit('hexErr', 'nSlurmError');
                })
                .on('lostJob', (msg, jid) => {
                    counter --;
                    hexError = true;
                    self.emitter.emit('hexErr', 'nSlurmError');
                });
            }
        })
        .on('err', (err, jobID) => {
            self.emitter.emit('naccessErr', 'nSlurmError');
        })
        .on('stderrContent', buf => {
            if (buf.toString().search("STOP SOLVA_ERROR: max") >= 0) {
                self.emitter.emit('naccessErr', 'maxSolvError');
            }
        })
        .on('lostJob', (msg, jid) => {
            self.emitter.emit('naccessErr', 'nSlurmError');
        });
    }

    /*
    * Run the @run method thanks to a pdbObj, found in @data [pdb-lib format].
    * If no pdbObj in @data, convert a string/path into a pdbObj.
    */
    push (data) {
        let self = this;
        if (data.hasOwnProperty('pdbObj')) {
            self.run(data.pdbObj);
        } else if (data.hasOwnProperty('string')) {
            if (typeof data.string == 'string') {
                let rs = new stream.Readable();
                rs.push(data.string);
                rs.push(null);
                pdbLib.parse({ 'rStream' : rs }).on('end', (pdbObj) => {
                    self.run(pdbObj);
                });
            }
        } else if (data.hasOwnProperty('path')) {
            pdbLib.parse({ 'file' : data.path }).on('end', (pdbObj) => {
                self.run(pdbObj);
            });
        } else {
            console.log("ERROR : no valid key specified");
        }
        return this.emitter;
    }

    /*
    * Create a number of hex tasks (= nprobe) and return them into an array (@h_array).
    */
    create_hexTasks (management) {
        let self = this;
        let h_array = [];
        if (! self.management.hex.hasOwnProperty('ncpu')) {
            console.log('WARNING : no ncpu specified -> no hexTask created');
        } else if (! self.management.hex.hasOwnProperty('lprobes')) {
            console.log('WARNING : no lprobes specified -> no hexTask created');
        } else {
            let ncpu = self.management.hex.ncpu;
            let probe_array = self.management.hex.lprobes;
            let pre_options = {
                'modules' : ['naccess', 'hex'],
                'exportVar' : { 'hexFlags' : ' -nocuda -ncpu ' + ncpu + ' ',
                                'hexScript' : '/data/software/mobi/hex/8.1.1-cuda-8.0/exe/hex8.1.1.x64' }
                                //'hexScript' : '/data/software/mobi/hex/8.0.0/exe/hex8.0.0.x64' }
            };
            for (let cnt = 0; cnt < self.nprobe; cnt ++) {
                let probe_i = probe_array[cnt];
                try { fs.existsSync(probe_i); }
                catch (err) { throw 'ERROR : with the probeFile ' + probe_i + ' :\n' + err; }

                let options = pre_options;
                options['staticInputs'] = { 'probePdbFile' : probe_i };
                
                let h = new hexT.Hex(self.management.hex, false, options);
                if (self.hexTest) h.testMode(true);
                h_array.push(h);
            }
        }
        return h_array;
    }

    /*
    * Run all the hexTasks (from @this.h_array) with @inputs and feedback the events.
    */
    run_hexTasks (inputs) {
        let self = this;
        let emitter = new events.EventEmitter();
        inputs = JSON.stringify(inputs);
        for (let i = 0; i < self.h_array.length; i ++) {
            self.h_array[i].write(inputs);
            self.h_array[i].on('processed', (results) => {
                emitter.emit('processed', results);
            })
            .on('err', (err, jobID) => {
                emitter.emit('err', err, jobID);
            })
            .on('lostJob', (msg, jid) => {
                emitter.emit('lostJob', msg, jid);
            });
        }
        return emitter;
    }

    /*
    * Update b-factors to -1 into a @pdbObj [Object from pdb-lib],
    * for every residue with absolute accessibility = 0 (in @data [Array]).
    */
    bFactor_minusOne (pdbObj, data) {
        for (let resiArray of data) {
            let resi = resiArray[0]; // residue name
            let chain = resiArray[1]; // chain
            let num = resiArray[2]; // residue number
            let access = resiArray[3].All_atoms.abs; // accessibility
            //console.log(resi, chain, num, access);
            if (access === 0) {
                pdbObj.chain(chain).resName(resi).resSeq(num).bFactor(-1);
            }
            pdbObj.model(1); // reinitialize
        }
    }

    /*
    * Update by incrementing b-factors into a @pdbObj [Object from pdb-lib],
    * for every residue found into @data [Array] (some residues are found more than one time into @data).
    */
    bFactor_increment (pdbObj, data) {
        for (let resi of data) {
            let chain = resi.chain; // chain
            let num = resi.resSeq; // residue number
            //console.log(chain, num);
            pdbObj.model(1).chain(chain).resSeq(num).bFactor(1, 'increment');
            pdbObj.model(1); // reinitialize
        }
    }
}


module.exports = ardockPipeline;
