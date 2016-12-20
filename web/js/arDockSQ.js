window.$ = window.jQuery = require('jquery');
var FastaDuo = require('./Alignment').FastaDuo;

/*
    Component to visualize SEQUENCE
    NodeContent is produce by Alignment
    Specific attributes carries fastaseq, pdbnum
    Declare specific cell click callback
*/

/*
    constructor expects :
    FastaSeq
    PdbNum
    NGL interface
*/
var arDockSQ = function(opt){
    var nArgs = opt ? opt : {};
    if (!opt.hasOwnProperty('pdbObj'))
        throw "pdbObj required";
     if (!opt.hasOwnProperty('chain'))
        throw "chain identifier required";

    this.pdbRef = opt['pdbObj']
    this.chainID = opt['chain'];
    this.sequence = this.pdbRef.sequence();
    this.pdbnum = this.pdbRef.pdbnum();

    var name, fastaSeq;

    var param = [{
        'aa' : this.sequence,
        'numbers' : this.pdbnum,
        'name' : 'chain ' + this.chainID,
        'ss2' : this.sequence // faked
    }];
    /*
    console.log('arDockSQ constructor');
    console.dir(param);
    */
    var node = opt.hasOwnProperty('node') ? opt['node'] : 'body';
    FastaDuo.call(this, param, node);
    console.log("PPP");
    //console.dir(this.div);
    console.dir(this.chainID);
    $(this.node).addClass("arDockSQ");
    $(this.node).attr('id', "arDockSQ_" + this.chainID);
    console.log($(this.node).length);
    //$(this.node).addClass("ARDockSQ_" + this.chainID);
    var self = this;
    this.on('cellClick',function (domElem, data, index) {
        console.log("UBERCALLBACK ");
       /* console.dir(domElem);
        console.dir(data);
        console.dir(index);*/
        console.log("Lets ask NGL for " + self.sequence[index] + ' ' + self.pdbnum[index]);
        this.fire('aminoAcidClick', index, self.sequence[index], self._convert(self.sequence[index]), self.pdbnum[index], self.chainID);
    })

}
arDockSQ.prototype = Object.create(FastaDuo.prototype);
arDockSQ.prototype.constructor = arDockSQ;


arDockSQ.prototype._draw = function(opt){
    FastaDuo.prototype._draw.call(this, opt);
    this.createLabels();
   // this.div.addClass("ARDockSQ");
}

var test = function () {
    ///console.()
}

module.exports = {
    //test: test,
    new: function(opt) {
        var o = new arDockSQ(opt);
        return o;
    }
};