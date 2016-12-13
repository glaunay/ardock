var d3 = require('./d3ext').d3;
var u = require('./utils');

u.expandJQ();
var crop = function(matrix, dim) {

    /*console.log("crop routine arguments");
    console.dir(dim);*/
    var xmin = 'xmin' in dim ? dim.xmin : 0;
    var xmax = 'xmax' in dim ? dim.xmax : matrix[0].length;
    var ymin = 'ymin' in dim ? dim.ymin : 0;
    var ymax = 'ymax' in dim ? dim.ymax : matrix.length;

    var crop = matrix.slice(ymin, ymax /*+ 1*/ );

    for (var i = 0; i < crop.length; i++) {
        crop[i] = crop[i].slice(xmin, xmax /*+ 1*/ );
    }
    return crop;
}

// passed matrix is effectively modifed
var pluckInOut = function(data, from, to) {
    if (from == to) return;

    if ('matrix' in data) {
        var row = data.matrix[from].slice();
        data.matrix.splice(from, 1);
        // if (from < to) to--;
        data.matrix.splice(to, 0, row);
    }
    if ('list' in data) {
        var elem = data.list[from];
        data.list.splice(from, 1);
        // if (from < to) to--;
        data.list.splice(to, 0, elem);
    }
}

var Msa = function(options) {
    if (!options.data) {
        alert("no data provided");
        return null;
    }
    if (!options.target) {
        alert("target provided");
        return null;
    }
    if (!options.seqName) {
        alert("no sequence names provided");
        return null;
    }

    var nSeq = options.data.length,
        nCol = options.data[0].length;

    var data = new Array(nSeq);
    for (var i = 0; i < nSeq; i++) {
        data[i] = new Array(nCol || 0);
        var offset = 0;
        for (var j = 0; j < nCol; j++) {
            data[i][j] = {
                letter: options.data[i][j],
                pos: options.positionMask ? options.positionMask[i][j] : offset,
                x: j,
                y: i,
                location: null,
                sse: 'sheet' // For dev purpose helix sheet
            };
            if (options.data[i][j] !== '-') {
                data[i][j]['location'] = options.locations ? options.locations[i][data[i][j]['pos']] : null;
                offset++;
            } else {
                //    console.log("found a gap");
            }

        }
    }

    var topSliderHeight = 20,
        columnLabelHeight = 15;
    var topOffset = topSliderHeight + columnLabelHeight;

    var leftSliderWidth = 20,
        rowLabelWidth = 95;
    var leftOffset = leftSliderWidth + rowLabelWidth + 5;
    var rh = 50,
        rw = 50;
    var nColDisplayed = options.nColView ? options.nColView : 25,
        nRowDisplayed = options.nRowView ? options.nRowView : 10;

    nColDisplayed = nColDisplayed < nCol ? nColDisplayed : nCol;
    nRowDisplayed = nRowDisplayed < nSeq ? nRowDisplayed : nSeq;

    var botOffset = 30;
    var totalHeight = topOffset + nRowDisplayed * rh;
    if (options.cons) totalHeight += botOffset;

    return {
        vignetteBool: options.locations ? true : false,
        locations: options.locations ? true : false,
        botOffset: botOffset,
        consData: options.cons ? options.cons : null,
        draggable: options.draggable ? options.draggable : false,
        seqBind: options.seqBind ? options.seqBind : null,
        nColDisplayed: nColDisplayed,
        nRowDisplayed: nRowDisplayed,
        leftOffset: leftOffset,
        topOffset: topOffset,
        msaViewPoint: {
            w: nColDisplayed * rw,
            h: nRowDisplayed * rh
        },
        w: leftOffset + nColDisplayed * rw, //w : rw * nCol < 800 ? rw * nCol : 800,
        h: totalHeight, //h : rh * nSeq < 400 ? rh * nSeq : 400,
        data: data,
        names: options.seqName,
        nCol: nCol,
        nRow: nSeq,
        rh: rh,
        rw: rh,
        sliderRadius: 10,
        xBufferSize: 5,
        yBufferSize: 5,
        boundaries: {
            x: {
                min: 0,
                max: nColDisplayed / 2
            },
            y: {
                min: 0,
                max: nRowDisplayed / 2
            }
        },
        topSlider: {
            h: topSliderHeight,
            w: topSliderHeight
        }, // circle for now
        columnLabelHeight: columnLabelHeight,
        leftSlider: {
            h: leftSliderWidth,
            w: leftSliderWidth
        }, // circle for now
        rowLabelWidth: rowLabelWidth,
        rowLabelWidthMin: rowLabelWidth,
        target: options.target,
        svg: null,
        getBufferLength: {
            x: {
                forward: d3.scale.linear().domain([0, nCol])
                    .range([nColDisplayed, 0]).clamp(true),
                backward: d3.scale.linear().domain([0, nCol])
                    .range([0, nColDisplayed]).clamp(true)
            },
            y: {

            }
        },
        _refreshClip: function(data) {
            if ('zMsaLayer' in data) {
                d3.select('#zMsaClip rect').attr('x', data.zMsaLayer);
            }
            if ('seqNameArea' in data) {
                d3.select('#seqNameAreaClip rect').attr('width', data.seqNameArea);
            }
        },
        toggleVignette: function() {
            var self = this;
            self.vignetteBool = self.vignetteBool ? false : true;
            if (!self.vignetteBool) {
                d3.selectAll("g.msaCell g.vignette").remove();
            } else {
                d3.selectAll('.msaCell')
                    .each(function() {
                        self._sseVignette(this);
                    });
            }

        },
        _sseVignette: function(cell) {

            // Precompute sin and tan waves
            if (!this.trigo) {
                this.trigo = {
                    INTERVAL: Math.PI / 3
                };
                this.trigo.domain = d3.range(0, Math.PI / 2 + this.INTERVAL, this.INTERVAL);
                this.trigo.sinWave = this.trigo.domain.map(Math.sin),
                    //    this.trigo.tanWave = this.trigo.domain.map(Math.tan);
                    // Remove problematic "infinite" point
                    //  this.trigo.tanWave.pop();
                    this.trigo.h = this.rh / 2, this.trigo.w = this.rw / 2,
                    this.trigo.x = d3.scale.linear().domain([-5, 15]).range([0, this.trigo.w]),
                    this.trigo.y = this.trigo.x,
                    this.trigo.r = (function(a, b) {
                        return Math.sqrt(a * a + b * b);
                    })(this.trigo.x.invert(this.trigo.w), this.trigo.y.invert(this.trigo.h));
            }
            var self = this;
            var datum = d3.select(cell).datum();
            if (!datum.hasOwnProperty("sse")) return;
            if (datum.sse == "helix") {
                d3.select(cell).append("g")
                    .attr("class", "vignette sinwave")
                    .attr("width", self.trigo.w)
                    .attr("height", self.trigo.h)
                    .attr("transform", "translate(" + self.trigo.x(1) + ")")
                    .selectAll("path")
                    .data([d3.range(0, 8 * Math.PI + self.trigo.INTERVAL, self.trigo.INTERVAL).map(Math.sin)])
                    .enter().append("path")
                    .attr("class", "wave")
                    .attr("d", d3.svg.line()
                        .x(function(d, i) {
                            return self.trigo.x(i * self.trigo.INTERVAL) - self.trigo.x(0)
                        })
                        .y(function(d) {
                            return self.trigo.y(d)
                        }))
                    .style("stroke", "black")
                    .style("stroke-width", "3px");
            }
            if (datum.sse == "sheet") {
                //  console.log(self.trigo.h)
                var arrows = d3.select(cell).append("g")
                    .attr("class", "vignette arrow")
                    .attr("width", self.trigo.w)
                    .attr("height", self.trigo.h)
                    .attr("transform", "matrix(0.5, 0, 0, 0.5, " + (self.rw * 0.7) + ", " + (self.rh * 0.05) + ")");
                arrows.append('rect').attr('width', self.trigo.w / 2).attr('height', self.trigo.h / 2).attr('y', self.trigo.h / 4)
                    .style("fill", "black");
                arrows.append('path').attr('d', "M" + (self.trigo.w / 2) + " 0 L" + self.trigo.w + " " + (self.trigo.h / 2) + " L" + (self.trigo.w / 2) + " " + self.trigo.h + " Z")
                    .style("fill", "black")

            }

        },
        toggleCellColor: function(optColor) {
            var regCode = {
                "default": true,
                "location": true
            };
            if (!optColor) {
                this.colorCode = "default";
            }
            if (optColor in regCode) {
                this.colorCode = optColor;
            } else {
                console.log(optColor + " is no known color code");
            }

            this._paint();
        },
        colorCode: "default",
        searchSequences: function(strs) {

            /*
             return function findMatches(q, cb) {
                 var matches, substrRegex;

                 // an array that will be populated with substring matches
                 matches = [];

                 // regex used to determine if a string contains the substring `q`
                 substrRegex = new RegExp(q, 'i');

                 // iterate through the pool of strings and for any string that
                 // contains the substring `q`, add it to the `matches` array
                 $.each(strs, function(i, str) {
                     if (substrRegex.test(str)) {
                     // the typeahead jQuery plugin expects suggestions to a
                     // JavaScript object, refer to typeahead docs for more info
                         matches.push({ value: str, index : i });
                     }
                 });
                 cb(matches);
             };
             */
        },
        _swapRow: function(from, to) { // maybe directly supply the responsible DOM object
            pluckInOut({
                matrix: this.data
            }, from, to);
            pluckInOut({
                list: this.names
            }, from, to);
            this._paint();
            this._drawSeqNameArea(true);
        },
        _moveTo: function(data) { // scroll and updte slider position
            if ('name' in data) { // Not working properly
                for (var i = 0; i < this.names.length; i++) {
                    console.log(this.names[i] + " ?? " + data.name);
                    if (this.names[i] === data.name) {
                        console.log("index row is " + i);


                        // Do something to scroll to index X in svg Space // ymin, ymax sett and _paint

                        var ySliderPos = this.rowRealScale.invert(i) + 1;
                        var dy = i > this.nRow - this.nRowDisplayed ? this.nRow - this.nRowDisplayed : i;

                        var Ry = this.rowRealScale(ySliderPos);
                        var Dy = this.rowDisplayedScale(ySliderPos);


                        //var dy = self.svgScaleY(i);
                        console.log("======>" + dy + " , " + Ry + " , " + Dy);
                        this.scroll({
                            "dy": dy,
                            'Ry': Ry,
                            'Dy': Dy
                        });



                        this.svg.selectAll('.handleV').attr("transform", function() {
                            var trCoor = u.getTranslationCoordinates(d3.select(this).attr("transform"));
                            return "translate(" + trCoor[0] + ', ' + ySliderPos + ")";
                        })
                    }
                }
            }
            if ('column' in data) {



            }

        },
        draw: function() {
            console.log("running draw");
            var self = this;

            d3.select(self.target).append('div').attr('class', 'msaHeader');
            d3.select(self.target).append('div').attr('class', 'msaBody');
            d3.select(self.target).append('div').attr('class', 'msaFooter');


            $(self.target + ' div.msaHeader').append('<div class="typeAheadWrap">' + '<input class="typeahead" type="text" placeholder="Sequence name"></div>');

          /*
            $(self.target + ' .typeAheadWrap .typeahead').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'sequenceName',
                displayKey: 'value',
                source: self.searchSequences(self.names)
            });

            $(self.target + ' .typeAheadWrap .typeahead').on('typeahead:selected', function() {
                self._moveTo({
                    name: this.value
                });
            });
            */
            $(self.target + " .fasearch").on('click', function() {
                self._moveTo();
            } /*self._moveTop()*/ );
            this.svg = d3.select(self.target + ' div.msaBody').append('svg')
                .attr('width', self.w)
                .attr('height', self.h)
                .attr('class', 'msaFrame');
            // Cliping mask definitions

            this.svg.append('defs').append('clipPath').attr("id", "zMsaClip")
                .append('rect').attr('x', self.leftOffset).attr('y', self.topOffset)
                .attr('height', self.nRowDisplayed * self.rh).attr('width', self.nColDisplayed * self.rw);

            this.svg.selectAll('defs').append('clipPath').attr('id', 'consBandClip')
                .append('rect').attr('x', self.leftOffset)
                .attr('y', self.topOffset + self.nRowDisplayed * self.rh)
                .attr('height', self.botOffset).attr('width', self.nColDisplayed * self.rw);

            this.svg.selectAll('defs').append('clipPath').attr('id', 'colLabelClip')
                .append('rect').attr('x', self.leftOffset).attr('y', self.topSlider.h)
                .attr('height', self.columnLabelHeight).attr('width', self.nColDisplayed * self.rw);

            this.svg.selectAll('defs').append('clipPath').attr("id", "seqNameAreaClip")
                .append('rect').attr('x', 0).attr('y', self.topOffset)
                .attr('height', self.nRowDisplayed * self.rh).attr('width', self.rowLabelWidth);

            var zFrame = this.svg.append('g').attr('style', "clip-path: url(#zMsaClip);")
                .attr('class', "nudgeable");
            var zLayer = zFrame.append('g').attr('class', 'zMsaLayer')
                .attr("transform", 'translate(0, 0)');

            self._paint({
                xmin: 0,
                xmax: self.nColDisplayed,
                ymin: 0,
                ymax: self.nRowDisplayed
            });
            this._drawColumnLabels();
            this._drawSeqNameArea();
            this._drawConsBand();
            this._drawHorizontalSlider();
            this._drawVerticalSlider();

            if (self.draggable)
                $(self.target).drags({
                    handle: "div.msaHeader"
                });
            console.log("drawing done " + self.target);
        },
        showCell: function(d) {
            console.dir(d);
            d3.select(this.target).selectAll(".showcase").remove();
            if (d.letter === "-") return;
            d3.select(this.target).selectAll(".msaHeader").append("div").attr("class", "showcase")
                .html(d.letter + (d.pos + 1));
        },
        _paint: function(coor) {
            var self = this;

            var zLayer = d3.select('.zMsaLayer');
            if (!coor) {
                zLayer.selectAll('.msaRow').remove();
            } else {

                //console.log("Painting w/");
                //console.dir(coor);

                // define the new dataset
                this.boundaries.x.min = 'xmin' in coor ? coor.xmin - self.xBufferSize < 0 ? 0 : coor.xmin - self.xBufferSize : this.boundaries.x.min;
                this.boundaries.x.max = 'xmax' in coor ? coor.xmax + self.xBufferSize > self.nCol ? self.nCol : coor.xmax + self.xBufferSize : this.boundaries.x.max;
                this.boundaries.y.min = 'ymin' in coor ? coor.ymin - self.yBufferSize < 0 ? 0 : coor.ymin - self.yBufferSize : this.boundaries.y.min;
                this.boundaries.y.max = 'ymax' in coor ? coor.ymax + self.yBufferSize > self.nRow ? self.nRow : coor.ymax + self.yBufferSize : this.boundaries.y.max;
            }
            var xmin = this.boundaries.x.min;
            var xmax = this.boundaries.x.max;
            var ymin = this.boundaries.y.min;
            var ymax = this.boundaries.y.max;

            //console.dir(this.boundaries)

            var data = crop(self.data, {
                xmin: xmin,
                xmax: xmax,
                ymin: ymin,
                ymax: ymax
            });
            //  console.log("Cropped Data w/ " + xmin + ' '+ xmax + ' '+ ymin + ' '+ ymax);
            //  console.dir(data);
            // use key function to avoid del/redraw of persistent rows
            var offset = self.sliderHeight + self.colHeaderHeight;

            var rCount = ymin;
            var grp = zLayer.selectAll('.msaRow')
                .data(data, function(d, i) {
                    rCount++;
                    return 'r' + rCount;
                });
            rCount = ymin;
            grp.enter()
                .append('g')
                .attr('transform', function(d, i) {
                    var off = self.topOffset + self.rh * rCount;
                    rCount++;
                    return 'translate(0, ' + off + ')'; // BUGGY HERE
                })
                .attr('class', 'msaRow');
            // grp.exit().transition().delay("250").remove();
            grp.exit().remove();


            var cellGrp = grp.selectAll('.msaCell')
                .data(function(d) {
                    return d;
                }, function(d, i) {
                    return 'c' + i;
                });

            cellGrp.enter()
                .append('g')
                .attr("class", "msaCell")
                .attr('transform', function(d, i) {
                    var off = self.leftOffset + (self.rw) * d.x;
                    return 'translate(' + off + ', 0)';
                })
                .style('fill', function(d) {
                    return self.getCellColor(d);
                }).on('click', function(d) {
                    self.showCell(d);
                });
            //cellGrp.exit().transition().delay("250").remove();
            cellGrp.exit().remove();
            grp.selectAll('.msaCell')
                .append("rect")
                .attr("width", self.rw)
                .attr("height", self.rh);
            grp.selectAll('.msaCell')
                .each(function() {
                    if (!self.vignetteBool) return;
                    self._sseVignette(this);
                })
            grp.selectAll('.msaCell')
                .append("text")
                .attr("x", function(d) {
                    return self.rw / 2 - 5;
                })
                .attr("y", self.rh / 2)
                .attr("dy", ".15em")
                .attr('font-size', function(d) {
                    return (self.rh / 4) < 10 ? 10 + "px" : (self.rh / 4) + "px";
                })
                .style('fill', "black")
                .attr('font-weight', "bold")
                .text(function(d) {
                    return d.letter;
                });

            //
            return;
            //

            if (self.locations) {
                var ll = grp.selectAll('.msaCell').select(function(d) {
                    if (d.location) return this;
                    return null
                });
                ll.append("path")
                    .attr("d", d3.svg.symbol()
                        .type(function(d) {
                            if (d.location === "M") {
                                return "circle";
                            } else if (d.location === "I") {
                                return "square";
                            } else if (d.location === "E") {
                                return "diamond";
                            }
                            return "none";
                        })
                        .size(function() {
                            return self.rh * 0.6;
                        })
                    )
                    .attr("transform", function(d) {
                        return "translate(" + (self.rw * 0.75) + ", " + (self.rh * 0.2) + ")";
                    })
                    .style("fill", "purple");
            }


        },
        _getSeqNameAreaViewPoint: function() { // return top and bot y coordinates of leftPanel
            var string = this.svg.select(".msaSeqNameArea").attr("transform");
            var trans = u.getTranslationCoordinates(string);

            return {
                min: -1 * trans[1] + this.topOffset,
                max: -1 * trans[1] + this.topOffset + (this.nRowDisplayed - 1) * rh
            };
            var offset = -1 * trans[1] + this.topOffset;
            console.log("current top offset is " + offset);
            /* d3.selectAll('g.seqName').each(function(d){
                 console.log("You?");
                 var s = d3.select(this).attr("transform");
                 console.log(s);
                 if (d3.select(this).attr("transform") === "translate(0, " + offset + ")") {

                 }

             });*/

        },
        _drawSeqNameArea: function(resetBool) {
            var self = this;
            if (d3.selectAll('rect.seqNameAreaBackground').size() == 0) {
                console.log("NO  BACKGROUNDDD");
                /*  this.svg.append('rect')
                        .attr('class', 'seqNameAreaBackground')
                        .attr('x', 0).attr("width", self.leftOffset)
                        .attr("height", self.h);
                */

                var nFrame = this.svg.append('g').attr('style', "clip-path: url(#seqNameAreaClip);");
                nFrame.append('g').attr('class', 'msaSeqNameArea')
                    .attr('transform', 'translate(0, 0)');
            }
            var seqNameArea = this.svg.select(".msaSeqNameArea");
            // remove only child labelArea, keep above whole Area translation

            if (resetBool) seqNameArea.selectAll('.seqName').remove();

            var drag = d3.behavior.drag()
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragended);


            function dragstarted(d) {
                //console.log(d3.event.target);
                //d3.event.sourceEvent.stopPropagation();

                d3.select(this).transition().attr("class", function() {
                    return d3.select(this).attr("class") + " dragging";
                }).delay(250);

                d3.select(this).moveToFront();

            }
            // newY test, if d3.event.y > self.topOffset scroll top
            // newY test, if d3.event.y > self.topOffset + nRowDisplayed * rh scroll down
            function dragged(d) {
                var currCoor = u.getTranslationCoordinates(d3.select(this).attr("transform"));
                var vp = self._getSeqNameAreaViewPoint();
                var newY = d3.event.y > vp.min ? d3.event.y : vp.min;
                d3.select(this).attr("transform", function(d) {
                    return "translate(" + currCoor[0] + ", " + newY + ")";
                });
                d3obj = this;
                if (newY == vp.min) {
                    self.scroll({
                        increment: 'top'
                    }).done(function(top) {
                        d3.select(d3obj).attr("transform", "translate(0, " + (-1 * (top) + self.topOffset) + ")");
                    });
                } else {
                    //  console.log("nope");
                }


                //  d3.select(this).selectAll('foreignObject').remove();
            }

            function dragended(d) {
                d3.select(this).classed("dragging", false);
                var iStart, yEnd;
                d3.select(this).each(function() {
                    var c = d3.select(this).attr("class");
                    var m = c.match(/[\s]*s([\d]+)/);
                    iStart = m[1];
                });
                yEnd = u.getTranslationCoordinates(d3.select(this).attr("transform"))[1];
                yEnd -= self.topOffset;
                /*console.log(iStart);
                console.log(yEnd);*/
                var div = Math.floor(yEnd / self.rh);
                var rem = yEnd % self.rh;
                console.log(div + ' ' + rem);
                var iEnd = rem > self.rh / 3 ? div + 1 : div;
                self._swapRow(iStart, iEnd);
                console.log("moving from " + iStart + " to " + iEnd);
            }


            seqNameArea.selectAll('.seqName')
                .data(self.names).enter().append('g')
                .attr('class', function(d, i) {
                    return 'seqName s' + i;
                })
                .attr('transform', function(d, i) {
                    var off = self.topOffset + (self.rh) * i;
                    return 'translate(0, ' + off + ')';
                })
                .call(drag);

            seqNameArea.selectAll('.seqName').append("rect")
                .attr("width", self.rowLabelWidth)
                .attr("height", self.rh)
                .style("fill", "rgb(255, 255, 255)");

            seqNameArea.selectAll('.seqName').append('foreignObject')
                .attr('width', self.rowLabelWidth)
                .attr('height', rh)
                .attr('class', 'seqNameString')
                .html(function(d) {
                    if (self.seqBind) {
                        return '<div class="nameCell"><i class="fa fa-search pull-left"></i>' + d + '<i class="fa fa-chevron-circle-up pull-right"></i>' + '</div>';
                    } else {
                        return '<div class="nameCell">' + d + '<i class="fa fa-chevron-circle-up pull-right"></i></div>';
                    }
                });
            if (self.seqBind) {
                d3.selectAll('.msaSeqNameArea i.fa-search').on('mousedown', function(d, i) {
                    var sequence = [];
                    self.data[i].forEach(function(elem) {
                        sequence.push({
                            "letter": elem.letter,
                            "pos": elem.pos
                        });
                    });
                    self.seqBind(sequence);
                });
            }
            // Buggy
            d3.selectAll('.msaSeqNameArea i.fa-chevron-circle-up').on('mousedown', function(d, i) {
                console.log("mm chevron");
                d3.event.stopPropagation();
                if (i > 0) self._swapRow(i, i - 1);
                // d3.event.preventDefault();
            }).on("dblclick", function(d, i) {
                self._swapRow(i, 0);

            });
            if (d3.selectAll('rect.seqNameAreaBackground').size() == 1) {
                this.svg.append('rect')
                    .attr('class', 'seqNameAreaBackground')
                    .attr('x', 0).attr("width", self.rowLabelWidth)
                    .attr("height", self.topOffset);
            }
        },
        _drawConsBand: function() {
            if (!this.consData) return;
            var h = this.botOffset;
            var self = this;

            var min = this.consData[0],
                max = this.consData[0];
            this.consData.forEach(function(elem) {
                min = elem < min ? elem : min;
                max = elem > max ? elem : max;
            });
            var hScale = d3.scale.linear().domain([min, max])
                .range([0, h]).clamp(true);
            var cbFrame = this.svg.append('g').attr('style', "clip-path: url(#consBandClip);")
                .attr('class', "nudgeable");

            var group = cbFrame.append('g').attr('class', 'consBand')
                .attr('transform', 'translate(0, 0)');


            var back = group.append('g').attr('class', 'consBackGroup')
                .attr('transform', 'translate(' + 0 + ', ' + (self.h - h) + ')');
            back.append('rect').attr('class', 'consBackground')
                .attr('width', self.leftOffset)
                .attr('height', h)
                .style('fill', 'white');
            //.attr("y", self.h - h)

            back.append('rect').attr('class', 'consPaint')
                .attr('width', self.nColDisplayed * rw)
                .attr('height', h)
                .style('fill', 'rgb(184,184,184) ')
                .attr('x', self.leftOffset);

            var bars = cbFrame.append('g').attr('class', 'consBars')
            bars.selectAll('.consBar').data(self.consData).enter()
                .append('g').attr('class', 'consBar').attr('transform', function(d, i) {
                    var off = self.leftOffset + (self.rw) * i;
                    return 'translate(' + off + ', ' + (self.h - h) + ')';
                });
            bars.selectAll('.consBar').append('rect')
                .attr('height', function(d) {
                    return hScale(d);
                }).attr('width', self.rw)
                .style('fill', 'steelblue')
                .attr("y", function(d) {
                    return h - hScale(d);
                });
            //.attr("y", 0);

        },
        _drawColumnLabels: function() {
            var self = this;
            var label = [];
            for (var i = 0; i < this.nCol; i++) {
                label.push({
                    n: i + 1,
                    shown: (i + 1) % 5 === 0 || i === 0 ? 'numeral' : 'dotted'
                });
            }
            console.dir(label);
            var colLabelFrame = this.svg.append('g')
                .attr('style', "clip-path: url(#colLabelClip);")
                .attr('class', "nudgeable");

            var group = colLabelFrame.append('g').attr('class', 'colLabels')
                .attr('transform', 'translate(0, 0)');
            group.selectAll('.colLabelCell').data(label).enter()
                .append('g').attr('class', 'colLabelCell')
                .attr('transform', function(d, i) {
                    var off = self.leftOffset + (self.rw) * i;
                    return 'translate(' + off + ', ' + self.topSlider.h + ')';
                })

            group.selectAll('.colLabelCell').append('rect').attr('width', self.rw).attr('height', self.columnLabelHeight);

            var numeral = group.selectAll('.colLabelCell').filter(function(d) {
                    return d.shown === "numeral" ? true : false;
                })
                .append("text")
                .attr('class', "numeral");
            var dotted = group.selectAll('.colLabelCell').filter(function(d) {
                    return d.shown === "dotted" ? true : false;
                })
                .append('circle')
                .attr('class', "dotted");

            group.selectAll('.colLabelCell text.numeral')
                .attr("x", function(d) {
                    return 5;
                })
                .attr("y", self.columnLabelHeight / 2)
                .attr("dy", ".15em")
                .attr('font-size', "10px")
                .style('fill', "black")
                .attr('font-weight', "bold")
                .text(function(d) {
                    return d.n;
                });

            group.selectAll('.colLabelCell circle.dotted')
                .attr('cx', self.rw / 2).attr('cy', self.columnLabelHeight / 2).attr('r', 2).style("fill", "steelblue");

        },
        _resetHoriSlider: function() { // Left element on change, update is made on self.leftOffset value
            // BUGGY
            console.log("reseting Hslider");
            var self = this;
            var slider_w = self.sliderRadius;
            d3.select("g.sliderH rect.backgroundH").attr('width', self.w - self.leftOffset)

            var currCoor = u.getTranslationCoordinates(d3.select('g.sliderH').attr("transform"));
            var xMin = self.leftOffset + slider_w - currCoor[0];
            var xMax = self.w - slider_w //self.leftOffset + self.nColDisplayed * self.rw - slider_w;
            self.svgScaleX = d3.scale.linear()
                .domain([xMin, xMax])
                .range([0, self.nCol - nColDisplayed]).clamp(true);
            self.columnRealScale = d3.scale.linear()
                .domain([xMin, self.leftOffset + self.nColDisplayed * self.rw - slider_w])
                .range([0, self.nCol]).clamp(true);
            self.columnDisplayedScale = d3.scale.linear()
                .domain([xMin, self.leftOffset + self.nColDisplayed * self.rw - slider_w])
                .range([0, self.nColDisplayed]).clamp(true);


            // Reset Hslider position and viewPoint
            var hCurrCoor = u.getTranslationCoordinates(d3.select('g.sliderH circle.handleH').attr("transform"));
            d3.selectAll("g.sliderH circle.handleH");

            /*var handle = d3.selectAll("g.sliderH circle.handleH");
            var oldX = u.getTranslationCoordinates(handle.attr("transform"))[0];*/

            // console.log(oldX)
        },
        _drawHorizontalSlider: function() {
            var self = this;
            var slider = this.svg.append("g")
                .attr("class", "sliderH nudgeable");
            slider.append('rect').attr('class', 'backgroundH')
                .attr('x', self.leftOffset)
                .attr("height", self.topSlider.h)
                .attr("width", self.msaViewPoint.w)
                .attr("rx", self.sliderRadius).attr("ry", self.sliderRadius);

            var slider_w = self.sliderRadius;
            self.svgScaleX = d3.scale.linear()
                .domain([self.leftOffset + slider_w, self.leftOffset + self.nColDisplayed * self.rw - slider_w])
                .range([0, self.nCol - nColDisplayed]).clamp(true);
            self.columnRealScale = d3.scale.linear()
                .domain([self.leftOffset + slider_w, self.leftOffset + self.nColDisplayed * self.rw - slider_w])
                .range([0, self.nCol]).clamp(true);
            self.columnDisplayedScale = d3.scale.linear()
                .domain([self.leftOffset + slider_w, self.leftOffset + self.nColDisplayed * self.rw - slider_w])
                .range([0, self.nColDisplayed]).clamp(true);

            var handle = slider.append("circle")
                .attr("class", "handleH")
                .attr("transform", "translate(" + self.svgScaleX.domain()[0] + "," + self.topSlider.h / 2 + ")")
                .attr("r", slider_w);

            var drag = d3.behavior.drag()
                .on("drag", Xdragmove);

            function Xdragmove(d) {
                // move it
                //console.log("Hslider lowerLimitX is " + self.svgScaleX.domain()[0]);
                //console.log("Hslider upperLimitX is " + self.svgScaleX.domain()[1]);
                var curX = d3.select(this).attr("transform").match(/\(([^,]+),/)[1];
                var newX = Math.max(self.svgScaleX.domain()[0], d3.event.x);
                newX = Math.min(self.svgScaleX.domain()[1], newX);
                var newTransform = d3.select(this).attr("transform").replace(/\([^,]+,/, "(" + newX + ",");
                d3.select(this).attr("transform", newTransform);
                var dx = self.svgScaleX(newX);
                var Rx = self.columnRealScale(newX);
                var Dx = self.columnDisplayedScale(newX);
                //console.log(curX);
                //console.log(newX);
                //console.log(dx);
                //console.log(Rx);

                console.log('fire');
                drag.on("dragend", function() {
                    self.scroll({
                        dx: dx,
                        Rx: Rx,
                        Dx: Dx
                    });
                });
                //self.scroll({dx : dx, Rx : Rx, Dx : Dx });

            }

            // HoverIntent to smooth things
            d3.selectAll(".handleH").call(drag);

            d3.select(".sliderH")
                .on('mouseover', function() {
                    d3.select('.backgroundH').style('fill', 'rgb(232, 232, 232)');
                }).on('mouseout', function() {
                    d3.select('.backgroundH').style('fill', 'rgb(255, 255, 255)');
                });
            d3.select(".backgroundH").on('click', function(e) {
                var newX = Math.max(self.svgScaleX.domain()[0], d3.mouse(this)[0]);
                var newTransform = d3.select('.handleH').attr("transform").replace(/\([^,]+,/, "(" + newX + ",");
                d3.select('.handleH').attr("transform", newTransform);
                var dx = self.svgScaleX(newX);
                var Rx = self.columnRealScale(newX);
                var Dx = self.columnDisplayedScale(newX);
                self.scroll({
                    dx: dx,
                    Rx: Rx,
                    Dx: Dx
                });
            });
        },
        _drawVerticalSlider: function() {
            var self = this;
            var slider = this.svg.append("g")
                .attr("class", "sliderV nudgeable");
            slider.append('rect').attr('class', 'backgroundV')
                .attr("height", self.msaViewPoint.h)
                .attr("width", self.leftSlider.w)
                .attr("rx", "10").attr("ry", "10");

            slider.attr("transform", 'translate (' + self.rowLabelWidth + ', ' + self.topOffset + ')');

            var slider_w = self.sliderRadius;
            self.svgScaleY = d3.scale.linear()
                .domain([slider_w, self.nRowDisplayed * self.rh - slider_w])
                .range([0, self.nRow - self.nRowDisplayed])
                .clamp(true);
            self.rowRealScale = d3.scale.linear()
                .domain([slider_w, self.nRowDisplayed * self.rh - slider_w])
                .range([0, self.nRow]).clamp(true);
            self.rowDisplayedScale = d3.scale.linear()
                .domain([slider_w, self.nRowDisplayed * self.rh - slider_w])
                .range([0, self.nRowDisplayed]).clamp(true);

            slider.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', self.nRowDisplayed * self.rh)
                .style('cursor', 'nesw-resize')
                .style('stroke-width', '2px')
                .style('stroke', 'rgb(255, 255, 255)')
                .attr("class", "rzHandler");


            var handle = slider.append("circle")
                .attr("class", "handleV")
                .attr("transform", "translate(" + slider_w + ", " + (self.leftSlider.h / 2) + ")")
                .attr("r", slider_w);
            console.log(self.topOffset + self.leftSlider.h / 2);

            var drag = d3.behavior.drag()
                .on("drag", Ydragmove);

            function Ydragmove(d) {
                //  d3.event.stopPropagation();
                // move it
                // console.log("drag Y" + d3.event.y);
                var curY = d3.select(this).attr("transform").match(/,([^,]+)\)/)[1];
                var newY = Math.max(self.svgScaleY.domain()[0], d3.event.y);
                newY = Math.min(self.svgScaleY.domain()[1], newY);
                var newTransform = d3.select(this).attr("transform").replace(/,[^,]+\)/, "," + newY + ")");
                d3.select(this).attr("transform", newTransform);
                var dy = self.svgScaleY(newY);
                var Ry = self.rowRealScale(newY);
                var Dy = self.rowDisplayedScale(newY);
                //  console.log(dy + " , " + Ry + " , " + Dy);
                drag.on("dragend", function() {
                    self.scroll({
                        'dy': dy,
                        'Ry': Ry,
                        'Dy': Dy
                    });
                });

            }

            d3.selectAll(".handleV").call(drag);

            d3.select(".sliderV")
                .on('mouseover', function() {
                    d3.select('.backgroundV').style('fill', 'rgb(232, 232, 232)');
                })
                .on('mouseout', function() {
                    d3.select('.backgroundV').style('fill', 'rgb(255, 255, 255)');
                });
            d3.select(".backgroundV").on('click', function(e) {
                console.log("clickY " + d3.mouse(this));
                var newY = Math.max(self.svgScaleY.domain()[0], d3.mouse(this)[1]);
                var newTransform = d3.select('.handleV').attr("transform").replace(/,[^,]+\)/, "," + newY + ")");
                console.log("TT to " + newTransform);
                d3.select('.handleV').attr("transform", newTransform);
                var dy = self.svgScaleY(newY);
                var Ry = self.rowRealScale(newY);
                var Dy = self.rowDisplayedScale(newY);
                //console.log(dy);
                self.scroll({
                    dy: dy,
                    Ry: Ry,
                    Dy: Dy
                });
            });


            /*resize event
                Currently disabled, need to settle things down, overall rendering logics
                became obfuscated
            */
            //var resizeDrag = d3.behavior.drag()
            //       .on("drag", RZdragMove);


            function RZdragMove() {
                var x = d3.event.x > self.rowLabelWidthMin ? d3.event.x : self.rowLabelWidthMin;
                var nw = x;
                //var nw = x - self.leftSlider.w;
                if (nw < self.rowLabelWidthMin) nw = self.rowLabelWidthMin;



                self.rowLabelWidth = nw;
                self.leftOffset = self.leftSlider.w + self.rowLabelWidth + 5;

                //    console.log( "x = " + x +"\nnw = " + nw + "\nleftOffset = " + self.leftOffset);

                d3.selectAll('g.msaSeqNameArea g.seqName rect')
                    .attr('width', nw);
                d3.selectAll('g.msaSeqNameArea g.seqName')
                    .selectAll(function() {
                        return this.getElementsByTagName("foreignObject");
                    })
                    .attr('width', nw);
                d3.selectAll(".nudgeable").attr('transform', function() {
                    if (d3.select(this).classed("sliderV")) {
                        var currCoor = u.getTranslationCoordinates(d3.select('g.sliderV').attr("transform"));
                        return 'translate(' + x + ', ' + currCoor[1] + ')';
                    }
                    return 'translate(' + (self.leftOffset - self.rowLabelWidthMin - self.leftSlider.w - 5) + ' , 0)';
                });
                self._refreshClip({
                    'seqNameArea': self.rowLabelWidth
                });
                self._resetHoriSlider();
            }
            // d3.selectAll("g.sliderV").call(resizeDrag);
        },
        // dx OR dy translation  Rx is the value in column numbering space
        // Rx gives us an approximation of window center
        scroll: function(opt) {
            /*  console.log("scroll options");
              console.dir(opt);*/
            var deferred = $.Deferred();
            if (!opt) return;

            if ('increment' in opt) { //
                var c = opt.increment === 'top' ? d3.selectAll('g.seqName').first() : d3.selectAll('g.seqName').last();
                if (opt.increment === 'top') {

                    var string = this.svg.select("g.msaSeqNameArea").attr("transform");
                    var trans = u.getTranslationCoordinates(string);
                    var newY = trans[1] + this.rh > 0 ? 0 : trans[1] + this.rh;
                    //       console.log("-->computed new Y is " + newY);
                    d3.select("g.msaSeqNameArea").attr("transform", 'translate(0, ' + newY + ')');
                    var ymin = this.boundaries.y.min - 1,
                        ymax = this.boundaries.y.max - 1;
                    this._paint({
                        ymin: ymin,
                        ymax: ymax
                    });


                    deferred.resolve(newY);

                    return deferred.promise();
                    // get 1st g div indexmove up, and call scroll to
                    /*d3.selectAll('g.seqName').first();
                        var c = d3.select(this).attr("class");
                        var m = c.match(/[\s]*s([\d]+)/);
                        iStart = m[1];
                    });
                    this.scroll({to : i})*/
                }
            }

            if ('dx' in opt) {
                // Draw surrounding region, Rx is xmin, xmax is Rx + nColDisplayed

                var Rx = opt.Rx < 0 ? 0 : Math.round(opt.Rx);

                if (Rx > self.nCol - this.nColDisplayed) {
                    Rx = self.nCol - this.nColDisplayed;
                }

                var Dx = Math.round(opt.Dx);
                this._paint({
                    xmin: Rx - Dx,
                    xmax: Rx + this.nColDisplayed - Dx
                });
                // perform translation
                var dx = opt.dx < 0 ? 0 : Math.round(opt.dx);
                dx = (-1) * dx * rw;
                var translitteralX = this.svg.select(".zMsaLayer").attr("transform");
                var trCoor = u.getTranslationCoordinates(translitteralX);
                console.log(translitteralX)
                console.log(trCoor)
                translitteralX = translitteralX.replace(/\([^,]+,/, "(" + dx + ",");
                this.svg.select(".colLabels").attr("transform", 'translate(' + dx + ', 0)');
                this.svg.select(".consBars").attr("transform", 'translate(' + dx + ', 0)');
                this.svg.select(".zMsaLayer").attr("transform", translitteralX);
                return;
            }
            if ('dy' in opt) {
                var Ry = opt.Ry < 0 ? 0 : Math.round(opt.Ry);

                if (Ry > self.nRow - this.nRowDisplayed) {
                    Ry = self.nRow - this.nRowDisplayed;
                }

                var Dy = Math.round(opt.Dy);
                this._paint({
                    ymin: Ry - Dy,
                    ymax: Ry + this.nRowDisplayed - Dy
                });

                var dy = opt.dy < 0 ? 0 : Math.round(opt.dy);
                dy = (-1) * dy * rh;

                var translitteralY = this.svg.select(".zMsaLayer").attr("transform");
                var trCoor = u.getTranslationCoordinates(translitteralY);
                //translitteralY = translitteralY.replace(/,[\s]*[^,]+\)/, "," + dy + ")");
                //console.log("---->" + translitteralY);
                // this.svg.select(".zMsaLayer").attr("transform", translitteralY);
                // this.svg.select(".msaSeqNameArea").attr("transform", translitteralY);
                this.svg.select(".zMsaLayer")
                    .attr("transform", "translate(" + trCoor[0] + ", " + dy + ")");
                this.svg.select(".msaSeqNameArea")
                    .attr("transform", "translate(0, " + dy + ")");
                return;
            }
        },
        getCellColor: function(d) {
            /* if (this.color === "default") {
                 return this.aaSpecs[d.letter].color;
             }
             */
            if (this.colorCode === "location") {
                if (!d.location) return 'grey';
                return this.locSpecs[d.location];
            }
            return this.aaSpecs[d.letter].color;
        },
        locSpecs: {
            'I': "red",
            'E': "blue",
            'M': 'yellow'
        },
        aaSpecs: {
            'A': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'C': {
                color: 'yellow',
                charge: '0',
                polar: true
            },
            'D': {
                color: 'red',
                charge: '-1',
                polar: true
            },
            'E': {
                color: 'red',
                charge: '-1',
                polar: true
            },
            'F': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'G': {
                color: 'grey',
                charge: '0',
                polar: false
            },
            'H': {
                color: 'blue',
                charge: '+1',
                polar: true
            },
            'I': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'K': {
                color: 'blue',
                charge: '+1',
                polar: true
            },
            'L': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'M': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'N': {
                color: 'orange',
                charge: '0',
                polar: true
            },
            'P': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'Q': {
                color: 'orange',
                charge: '0',
                polar: true
            },
            'R': {
                color: 'blue',
                charge: '+1',
                polar: true
            },
            'S': {
                color: 'orange',
                charge: '0',
                polar: true
            },
            'T': {
                color: 'orange',
                charge: '0',
                polar: true
            },
            'V': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'W': {
                color: 'yellow',
                charge: '0',
                polar: false
            },
            'Y': {
                color: 'yellow',
                charge: '0',
                polar: true
            },
            '-': {
                color: 'grey',
                charge: 'na',
                polar: 'na'
            }
        }
    };
}

var test = function(target, nSeq, nCol) {
    var alp = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y', '-'];
    var msa = new Array(nSeq);

    var seqName = [];
    for (var i = 0; i < nSeq; i++) {
        seqName.push("seq n°" + i);
        msa[i] = new Array(nCol || 0);
        for (var j = 0; j < nCol; j++) {
            msa[i][j] = alp[Math.floor((Math.random() * 20))];
        }
    }

    console.dir(msa);
    msaObj = new Msa({
        data: msa,
        target: target,
        seqName: seqName
    });
    msaObj.draw();
}


module.exports = {
    new: function(opt) {
        var nArgs = opt ? opt : {};
        var o = Msa(nArgs);
        return (o);
    },
    test: test
};