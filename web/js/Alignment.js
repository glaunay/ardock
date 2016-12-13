var d3 = require('d3');
var _ = require('underscore');


/*var TweenLite = require('./greenSock/src/uncompressed/TweenLite.js');
var TimelineLite = require('./greenSock/src/uncompressed/TimelineLite.js');
var CSSPlugin = require('./greenSock/src/uncompressed/CSSPlugin.js');
var Draggable = require('./greenSock/src/minified/utils/Draggable.min.js"')
*/
window.$ = window.jQuery = require('jquery');


//<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenLite.min.js"></script>
//<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/utils/Draggable.min.js"></script>
//<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/CSSPlugin.min.js"></script>

//var TweenLite = require('../bower_components/gsap/src/uncompressed/TweenLite.js');
//var TimelineLite = require('../bower_components/gsap/src/uncompressed/TimelineLite.js');
//var CSSPlugin = require('../bower_components/gsap/src/uncompressed/plugins/CSSPlugin.js');

var rectangle = function (x, y, w, h, r1, r2, r3, r4) {
    var p = function(x, y) {
        return x + " " + y + " ";
    }

    var strPath = "M" + p(x + r1, y);
    strPath += "L" + p(x + w - r2, y) + "Q" + p(x + w, y) + p(x + w, y + r2);
    strPath += "L" + p(x + w, y + h - r3) + "Q" + p(x + w, y + h) + p(x + w - r3, y + h);
    strPath += "L" + p(x + r4, y + h) + "Q" + p(x, y + h) + p(x, y + h - r4);
    strPath += "L" + p(x, y + r1) + "Q" + p(x, y) + p(x + r1, y);
    strPath += "Z";
    return strPath;
};

/* d3.selectAll("body").append('svg').append("path")
     .attr("d", function(d) {
     return rectangle(0, 0, 300, 50, 15, 15, 0, 0);
 });
 */


/*Generic window like component, draggable / minifiable/ closable*/
var WindowComponent = function(elem, anchor) { // anchor elem for minification OR override minify fn
    this.h = 200;
    this.w = 402;
    this.container = elem ? elem : 'body';

    if (d3.select(this.container).size() === 0) throw 'WindowComponent container "'
        + this.container + '" does not exist';

    this.div = d3.select(this.container).append('div').style({
        "max-width": this.w + "px"
    });
    var self = this;
    this.div.each(function(){
        self.node = this;
    });
    this.header = this.div.append('div').attr('class', 'wc-header').style("margin-bottom", '-5px');
    this.body = this.div.append('div').attr('class', 'wc-body').style({
        "background": 'white',
        'padding-left': '0px'
    });


    this.h_height = 20;
    this.svgHead = this.header.append('svg').attr('height', this.h_height).attr('width', this.w);

    var firelights = [{}, {}, {}]; /// 3 colors gradient specs

    this.svgHead.append('defs').append('radialGradient').attr('id', 'rGrad')
        .attr('cx', "50%").attr('cy', "50%").attr('r', "50%").attr('fx', "50%").attr('fy', "50%")
        .append('stop').attr('offset', '0%').style('stop-color', 'rgb(255,140,0)').style('stop-opacity', '0.1');
    this.svgHead.selectAll("radialGradient").append('stop')
        .attr('offset', '100%').style('stop-color', 'rgb(rgb(255,165,0))').style('stop-opacity', '1');
    /*  <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:rgb(255,140,0);stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:rgb(255,165,0);stop-opacity:1" />
    </radialGradient>*/
    this.svgHead.append("g").append('path').attr('d', function() {
            return rectangle(0, 0, self.w, self.h_height, 5, 5, 0, 0);
        })
        .style('fill', 'rgb(245, 245, 245)').attr('class', 'background');
    this.svgHead.selectAll("g").append('circle').attr('class', 'close').attr('r', 7.5).attr('cx', 12.5).attr('cy', 10).style('fill', 'red')
        .on('click', function() {
            self.fire('close', null);
        })
        .on('mouseover', function() {
            d3.event.stopPropagation();
        });
    this.svgHead.selectAll("g").append('circle').attr('class', 'reduce').attr('r', 7.5).attr('cx', 32.5).attr('cy', 10).style('fill', 'orange')
        .on('click', function() {
            self.fire('minimize', null);
        });
    this.svgHead.selectAll("g").append('circle').attr('class', 'enlarge').attr('r', 7.5).attr('cx', 52.5).attr('cy', 10).style('fill', 'green')
        .on('click', function() {
            self.fire('magnify', null);
            d3.event.stopPropagation();
        });

    this.events = {
        close: function() {
            console.log('window closing');
        },
        minimize: function() {
            console.log('window minimizing');
        },
        magnify: function() {
            console.log('window magnifying');
        },
        handlerIn: function() {
            console.log('handlerIn');
        },
        handlerOut: function() {
            console.log('handlerOut');
        },
        cellClick : function() {
            console.log('cellClick');
        },
        onDragClick : function() {

        },
        onDragEnd : function() {

        }
    };

    //console.dir(this.div[0][0]);

    /* var drag = d3.behavior.drag();
        drag.on('drag', function(){
            var coor = d3.mouse(self.svg[0][0]);
            console.log(coor);
            d3.event.sourceEvent.stopPropagation();
            console.log('dragging');
            d3.select(this.div).style("z-index" : 1000).style("position", "relative")
                .style('top' : , 'left' : )
                .attr('transform', 'translate(' + x + ', ' +  0 + ')');
                self.scroll(x);
        });
*/

// Previous implementation
/*    $(this.div[0][0]).drags({
        cursor: 'default',
        handle: this.header[0][0]
    }); //this.svgHead[0][0]
*/
// Now we use GreenSock
    var self = this;
    Draggable.create($(this.div[0][0]), {
   // type:"y",
        bounds: this.container,
        trigger : this.header[0][0],
        //throwProps:true,
        onClick:function() {
            console.log("clicked");
            self.fire('onDragClick');
        },
        onDragEnd:function() {
            console.log("drag ended");
            self.fire('onDragEnd');
        }
    });
//gasp.Draggable()




    this.svgHead.on('mouseenter', function() {
        d3.select(this).selectAll('.background').style('fill', 'rgb(191, 186, 186)');
        self.fire("handlerIn");
    });
    this.svgHead.on('mouseleave', function() {
        d3.select(this).selectAll('.background').style('fill', 'rgb(245, 245, 245)');
        self.fire("handlerOut");
    });
    //self.fire('close', null)

};
WindowComponent.prototype.on = function(eventName, fn) {
    this.events[eventName] = fn;
    return this;
};

WindowComponent.prototype.fire = function(eventName) {
    // console.dir(arguments);
    var values = _.map(arguments, function(e, i) {
        return e;
    });
    //var eventName = values.shift();
    values.shift();
    //console.log("firing " + eventName);
    this.events[eventName].apply(this, values);
};

WindowComponent.prototype.shape = function(h, w) {
    if (h) {
        this.h = h;
        if (w) {
            this.w = w;
        }
        return
    }
    return [this.h, this.w];
};

WindowComponent.prototype.hDisplay = function(msg) {
        this.svgHead.selectAll("text").remove;
        var txt = this.svgHead.append('text').attr('x', Math.round(this.w * 1 / 5)).attr('y', Math.round(this.h_height * 2 / 3));
        txt.text(msg).style({
            'font-family': 'Monaco',
            'font-size': '8px'
        });
    }
    /*
     WindowComponent.prototype.hide = function(){

     };
     WindowComponent.prototype.show = function(){

     };
     */



/*EmiterComponent.prototype.hasFocus = function() {
    var x = event.clientX, y = event.clientY;
    var elementMouseIsOver = document.elementFromPoint(x, y);
    if ($(elementMouseIsOver).parents('.EmiterComponent').length) {
        return true;
    }
    return false;

}*/



WindowComponent.prototype.erase = function() {
    this.div.selectAll("*").remove();
    this.div.remove();
};



/* A display of fasta pairwise alignment*/



/* A display of fasta pairwise alignment*/

/*
    Expected data structure on input is an array of size 2,
    [ { aa : "EFHQTIGELVEWLQRTEQNIKASEPVDLTEERSVLETKFKKFKDLRAELER-CEPRVVSLQDAADQLLRSVEGSEQQSQHTYERTLSRLTDLRLRLQSLRRL"
        name : "FBpp0292449 PF00435_seed (13307, 13408)"
        ss2 : "CHHHHHHHHHHHHHHHHHHHHHCCCCCCCCCHHHHHHHHHHHHHHHHHHHHxHCHHHHHHHHHHHHHHHHCCCHHHHHHHHHHHHHHHHHHHHHHHHHHHCC"
        startsAt : "13307",
        */
        /*optionally explicit numbers can be specified */
        /*numbers :
        },
        {
        aa : "EFHQTIGELVEWLQRTEQNIKASEPVDLTEERSVLETKFKKFKDLRAELER-CEPRVVSLQDAADQLLRSVEGSEQQSQHTYERTLSRLTDLRLRLQSLRRL"
        name : "Babebibobu"
        ss2 : "CHHHHHHHHHHHHHHHHHHHHHCCCCCCCCCHHHHHHHHHHHHHHHHHHHHxHCHHHHHHHHHHHHHHHHCCCHHHHHHHHHHHHHHHHHHHHHHHHHHHCC"
        startsAt : "120"
        }
    ]


        */


var FastaDuo = function(data, node, anchor) {
    WindowComponent.call(this, node, anchor);
    this.data = data;
    this.cellW = 20;
    this.cellH = 20;
    this.nElem = this.data.length;
    console.log("FataDuo constructor");
    console.dir(this.data);
    console.dir(node);
};
FastaDuo.prototype = Object.create(WindowComponent.prototype);
FastaDuo.prototype.constructor = FastaDuo;

FastaDuo.prototype.cellDim = function() {
    return [this.cellW, this.cellH];
};
FastaDuo.prototype._draw = function(opt) {
    console.log("drawing");
    var self = this;
    if (opt) {
        if (opt.hasOwnProperty('shape')) {
            this.shape.apply(this, opt['shape']);
        }
    }
    this._generateIndex();
    //     this.svgHead.append('circle').attr('class', 'close').attr('r', 10).attr('rx, 5').attr('ry', 25).style('fill', 'red');
    //     this.svgHead.append('circle').attr('class', 'reduce').attr('r', 10).attr('rx, 35').attr('ry, 25').style('fill', 'orange');

    console.log('-->' + this.shape()[0]);
    this.svg = this.body.append('svg').attr('height', this.shape()[0]).attr('width', this.shape()[1]);
    this.z = this.svg.append('g').attr('class', 'frame').append('g').attr('class', 'zLayer');
    this.sH = 10;
    this.sMin = this.sH / 2;
    this.sMax = self.shape()[1] - this.sH / 2;
    var sH = this.sH;
    var mouseToRail = function(x) {
        if (x > self.sMax) {
            return self.sMax;
        } else if (x < self.sMin) {
            return self.sMin;
        }
        return x;
    };

    var nRibbon = this.nElem * 2; // 2 or 4
    this.sequences = new Array(nRibbon);
    for (var i = 0; i < nRibbon; i++) {
        var data;
        if (i == 0) {
            data = this.index[0];
        } else if (i == 3) {
            data = this.index[1];
        } else {
            console.log(i);
            data = self.data[i - 1]['aa'].split('');
        }
        this.sequences[i] = this.z.append('g').attr('class', 'word');
        this.sequences[i].selectAll('g.letter').data(data).enter().append('g')
            .attr('class', 'letter').attr('transform', function(d, i) {
                return 'translate(' + (i * self.cellDim()[1]) + ', ' + self.cellDim()[0] + ')'
            });
        this.sequences[i].selectAll('g.letter') //.append('rect').attr('width', this.cellDim()[1]).attr('height', this.cellDim()[0])
            .append('path').attr('d', function() {
                return rectangle(0, 0, self.cellDim()[1], self.cellDim()[0], 0, 0, 0, 0);
            })
            .style('fill', function(d) {
                if (i == 0 || i == 3) {
                    return 'rgb(245,245,245)'
                }
                return self._color(d);
            });
        this.sequences[i].selectAll('g.letter').append('text').style('text-anchor', 'middle').attr("x", (this.cellDim()[1] / 2)).attr("y", (this.cellDim()[0] * 0.66))
            .text(function(d) {
                return d;
            }).style({
                "dominant-baseline": "top",
                "z-index": "999999999",
                "font-family": "Monaco",
                "fill": 'black'
            })
            .style("font-size", function(d) {
                //                    console.dir(d);
                //                    console.dir(typeof(d));
                if (typeof(d) === 'number') {
                    if (d > 9999) return '5px';
                    if (d > 999) return '7px';
                    if (d > 99) return '8px';
                }
                return "10px";
            }).on('click', function (d,i){
                self.fire('cellClick', this, d, i);
                console.dir(this);
            });
        this.sequences[i].attr('transform', 'translate(' + 0 + ', ' + (i * self.cellDim()[0]) + ')');
    };


    var sOff = 0
    this.svg.selectAll('g.frame').append('g').attr('class', 'slider-frame').attr('transform', 'translate(' + sOff + ',' + (this.shape()[0] - sH) + ')');
    this.svg.selectAll("g.slider-frame").append('g').attr('class', 'slider-background')
        //.append('rect').attr('height', sH ).attr('width', this.shape()[1])
        .append('path').attr('d', function() {
            return rectangle(0, 0, self.shape()[1], sH, 5, 5, 5, 5);
        })
        .style('fill', 'teal');
    this.svg.selectAll('g.slider-frame').append('g').attr('class', 'slider-handler').append('circle').attr('cx', 0)
        .attr('cy', sH / 2).attr('r', (sH / 2)).style('fill', 'whitesmoke');
    this.svg.selectAll('g.slider-handler').attr('transform', 'translate(' + mouseToRail(0) + ', 0' + ')');
    var drag = d3.behavior.drag();
    drag.on('drag', function() {
        var coor = d3.mouse(self.svg[0][0]);
        console.log(coor);
        d3.event.sourceEvent.stopPropagation();
        console.log('dragging');

        var x = mouseToRail(coor[0]);
        d3.select(this)
            .attr('transform', 'translate(' + x + ', ' + 0 + ')');
        self.scroll(x);
    });
    this.svg.selectAll('g.slider-handler').call(drag);
    this.svg.selectAll('g.slider-handler').on("click", function() {
        if (d3.event.defaultPrevented) return; // click suppressed
        console.log("clicked!");

    });
    this.svg.selectAll('g.slider-background').on('click', function() {
        var coor = d3.mouse(self.svg[0][0]);
        var x = mouseToRail(coor[0]);
        self.svg.selectAll('g.slider-handler').attr('transform', 'translate(' + x + ', ' + 0 + ')');
        self.scroll(x);
    });


    this.on("close", function() {
        this.erase();
    })
};

var customNumberIndexing = function(list){
    console.log("custom indexing");
    var index = _.map(list, function(d, i) {
        if (i > 0 && i % 5 == 0) {
            return d;
        }
            return '.';
    });
    return index;
}

FastaDuo.prototype._generateIndex = function() {
    this.index = Array(this.nElem);
    for (var x = 0; x < this.nElem; x++) {
        if (this.data[x].hasOwnProperty('numbers')) {
            this.index[x] = customNumberIndexing(this.data[x]['numbers']);
            continue;
        }
        var i = 0;
        if (this.data[x].hasOwnProperty('startsAt')) {
            i = this.data[x].startsAt - 1;
        }
        this.index[x] = _.map(this.data[x].aa, function(d) {
            if (d === '-') {
                return '.';
            }
            i++;
            if (i % 5 == 0) {
                return i;
            }
            return '.';
        });
    }
};
FastaDuo.prototype.scroll = function(pos) {
    var self = this;

    console.log('pouet');
    console.log(self.sMin);
    console.log(self.sMax);
    console.log('pouet');

    var offset = self.shape()[1] / self.cellW

    if (!this.sliderScale) {
        this.sliderScale = d3.scale.linear()
            .domain([self.sMin, self.sMax])
            .rangeRound([0, (-1) * self.cellW * (self.data[0].aa.length - offset)]);
        /*  .domain([self.sMin, self.sMax])
          .rangeRound([0, (-1) * self.shape()[1] ]);*/
    }

    console.log(this.sliderScale(pos));
    this.z.attr("transform", "translate( " + this.sliderScale(pos) + ", 0)");
    console.log('scroll');
    //'get current posiiotn of slider';
    //trCoor();

}
FastaDuo.prototype._color = function(l) {

    var classic = {
        'L': 'yellow',
        'V': 'yellow',
        'I': 'yellow',
        'M': 'yellow',
        'C': 'yellow',
        'F': 'yellow',
        'Y': 'yellow',
        'W': 'yellow',
        'D': 'red',
        'E': 'red',
        'K': 'steelblue',
        'R': 'steelblue',
        'H': 'steelblue',
        'N': 'magenta',
        'Q': 'magenta',
        'S': 'magenta',
        'T': 'magenta',
        'G': 'whitesmoke',
        'P': 'orange',
        '-': 'grey'
    };
    if (l in classic) return classic[l];
    return 'grey'

};
FastaDuo.prototype.createLabels = function() {
    var self = this;
    self.data.forEach(function() {
    self.svg.selectAll('g.frame').append('g').classed('label', true);
    });
    //this.svg.selectAll('g.frame').append('g').classed('label', true);
    this.svg.selectAll('g.label').append('text').text(function(d, i) {
        return self.data[i].name;
    }).style({
        "font-family": 'Monaco',
        "font-size": '10px',
        'fill': 'rgb(0, 128, 128)'
    });
    this.svg.selectAll('g.label').attr('transform', function(d, i) {
        var off = i === 0 ? 15 : 120;
        return 'translate(0' + ',' + off + ' )';
    })



    this.svg.selectAll('g.label').selectAll("text").each(function() {
        var bbox = this.getBBox();
        var width = bbox.width;
        var height = bbox.height;
        var step = width - self.shape[1]
        if (step > 0) {
            //              d3.select(this.parentNode).translate
        }
        console.log("--->" + width);
    });

};

FastaDuo.prototype.__createLabel = function() {
    var labelShape = [this.cellDim()[0] * 2, 15];
    var Extended_wOffset = 100;
    this.shape(this.shape()[0], this.shape()[1] + labelShape[1]);
    this.svg.attr("width", this.shape()[1]);
    this.svg.selectAll('g.frame').attr('transform', 'translate( ' + labelShape[1] + ', 0)');
    this.svg.append('g').attr('class', 'label').append('g').attr('class', 'push').append('path')
        .attr('d', function() {
            return rectangle(0, 0, labelShape[1], labelShape[0], 5, 0, 0, 5);
        })
        .style('fill', 'whitesmoke');
    this.svg.selectAll('g.push').append('path').attr('d', function() {
        var x_max = labelShape[1],
            y_max = labelShape[0];
        return 'M' + Math.floor(x_max * 2 / 3) + ' ' + Math.floor(y_max * 1 / 6) + ' L ' +
            Math.floor(x_max * 1 / 3) + ' ' + Math.floor(y_max * 1 / 2) + ' L ' +
            Math.floor(x_max * 2 / 3) + ' ' + Math.floor(y_max * 5 / 6);
    }).style("fill", "2px");
    this.svg.selectAll('g.label').attr('transform', 'translate(0, ' + (2 * this.cellDim()[1]) + ')');
    var self = this;
    this.div.style("max-width", this.shape()[1] + 'px');
    this.svgHead.attr('width', this.shape()[1]);
    /*this.svgHead.selectAll('path').attr('d', function(){
        return rectangle(labelShap, 0, self.shape()[1], self.shape()[0], 5, 5, 0, 0);
    });*/
    this.svgHead.selectAll('g').attr("transform", 'translate (' + labelShape[1] + ', 0)');

    this.svg.selectAll('g.push').on('click', function()  {
        if (d3.select(this).classed('active')) {
            console.log("Active -> Inactive");
            d3.select(this).classed('active', false);
            self.shape(self.shape()[0], self.shape()[1] - Extended_wOffset);
            self.svg.attr("width", self.shape()[1]);
            self.svg.selectAll('g.frame').attr('transform', 'translate( ' + labelShape[1] + ', 0)');
            self.svgHead.selectAll('g').attr('transform', 'translate( ' + labelShape[1] + ', 0)');
            self.svgHead.attr('width', self.shape()[1]);
            //self.svg.selectAll('g.frame').attr('transform', 'translate( 0, 0)');
            //self.svg.selectAll('g.frame').attr('transform', 'translate( 0, 0)');

        } else if (!d3.select(this).classed('active')) {
            console.log("Inactive -> Active");
            d3.select(this).classed('active', true);
            self.shape(self.shape()[0], self.shape()[1] + Extended_wOffset);
            self.svg.attr("width", self.shape()[1]);

            self.svg.selectAll('g.frame').attr('transform', 'translate( ' + Extended_wOffset + ', 0)');
            self.svgHead.selectAll('g').attr('transform', 'translate( ' + Extended_wOffset + ', 0)');
            self.svgHead.attr('width', self.shape()[1]);
            // self.svgHead.selectAll('path').attr("d", function (){
            // };);
            /*self.div.style('left', function(){
                var left = d3.select(this).style('left');
                console.log(left)
            });*/
        }

    })
};
FastaDuo.prototype.toggleSse = function() {
    this.sse = this.sse ? false : true;
    var self = this;
    var words = this.svg.selectAll('g.word').filter(function(d, i) {
        if (i === 0 || i === 3) return true;
        return false;
    });
    if (this.sse) {
        //'hhhhhhh----cccccceeeeeeeeccccccchhhhhhhhhhhh-----
        words.each(function(d, i) {
            console.log("------>" + i);
            if (!self.data[i].hasOwnProperty('ss2')) return;
            var spec = self.data[i].ss2.split('');
            var x = 0;
            d3.select(this).selectAll('g.letter')
                .each(function(d, pos) {

                    var c = d3.select(this).selectAll("text").text();
                    var l = self.data[i].aa[pos];
                    //console.log(c + " " + l);

                    if (l === "-") {
                        d3.select(this).style("visibility", 'hidden');
                        return;
                    }
                    d3.select(this).selectAll('path').attr('d', function() {
                        return rectangle(2, 2, self.cellDim()[1] - 4, self.cellDim()[0] - 4, 2, 2, 2, 2);
                    }).style('fill', function() {
                        //   if (spec[x] === 'h' || spec[x] === 'H') {return 'green';}
                        //   if (spec[x] === 'b' || spec[x] === 'B') {return 'red';}
                        if (spec[pos] === 'h' || spec[pos] === 'H') {
                            return 'green';
                        }
                        if (spec[pos] === 'b' || spec[pos] === 'B') {
                            return 'red';
                        }
                        return 'smokewhite';
                    });

                    x++;
                });
        });
    } else {
        words.selectAll('g.letter').style("visibility", 'visible').selectAll("path").each(function() {
                console.log("toot");
            })
            .attr('d', function() {
                return rectangle(0, 0, self.cellDim()[1], self.cellDim()[0], 0, 0, 0, 0);
            }).style('fill', 'whitesmoke');
    }
};


var test = function(node, anchor) {
    var rootDiv = node ? node : 'body';
    var sample = [ { aa : "EFHQTIGELVEWLQRTEQNIKASEPVDLTEERSVLETKFKKFKDLRAELER-CEPRVVSLQDAADQLLRSVEGSEQQSQHTYERTLSRLTDLRLRLQSLRRL",
        name : "FBpp0292449 PF00435_seed (13307, 13408)",
        ss2 : "CHHHHHHHHHHHHHHHHHHHHHCCCCCCCCCHHHHHHHHHHHHHHHHHHHHxHCHHHHHHHHHHHHHHHHCCCHHHHHHHHHHHHHHHHHHHHHHHHHHHCC",
        startsAt : "13307"
        },{
        aa : "EFHQTIGELVEWLQRTEQNIKASEPVDLTEERSVLETKFKKFKDLRAELER-CEPRVVSLQDAADQLLRSVEGSEQQSQHTYERTLSRLTDLRLRLQSLRRL",
        name : "Babebibobu",
        ss2 : "CHHHHHHHHHHHHHHHHHHHHHCCCCCCCCCHHHHHHHHHHHHHHHHHHHHxHCHHHHHHHHHHHHHHHHCCCHHHHHHHHHHHHHHHHHHHHHHHHHHHCC",
        startsAt : "120"
        }
    ];

    var o = new FastaDuo(sample, rootDiv, anchor);
    o._draw({ shape : [140, 402]});
}

var testSolo = function(node, anchor) {
    var rootDiv = node ? node : 'body';
    var sample = [ { aa : "EFHQTIGELVEWLQRTEQNIKASEPVDLTEERSVLETKFKKFKDLRAELER-CEPRVVSLQDAADQLLRSVEGSEQQSQHTYERTLSRLTDLRLRLQSLRRL",
        name : "FBpp0292449 PF00435_seed (13307, 13408)",
        ss2 : "CHHHHHHHHHHHHHHHHHHHHHCCCCCCCCCHHHHHHHHHHHHHHHHHHHHxHCHHHHHHHHHHHHHHHHCCCHHHHHHHHHHHHHHHHHHHHHHHHHHHCC",
        startsAt : "13307"
        }
    ];

    var o = new FastaDuo(sample, rootDiv, anchor);
    o._draw({ shape : [90, 402]});
}


module.exports = {
    test: test,
    testSolo: testSolo,
    new: function(opt) {
        if (!opt.hasOwnProperty("data")) {
            alert("no Data fount for FastaDuo");
            return;
        }

        var node = opt.hasOwnProperty("node") ? opt["node"] : 'body';
        var anchor = opt.hasOwnProperty("anchor") ? opt["anchor"] : null;
        var o = new FastaDuo(opt['data'], node, anchor);
        return o;
    },
    FastaDuo : FastaDuo
};