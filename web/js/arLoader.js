var d3ext = require('./d3ext');
var d3 = d3ext.d3;
var onD3TransitionsEnd = d3ext.onD3TransitionsEnd;
var Core =require('./Core.js').Core;

var Loader = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    this.width = nArgs.hasOwnProperty('width') ? nArgs.width : 250;
    this.height = nArgs.hasOwnProperty('height') ? nArgs.height : 250;
    //this.container = nArgs.hasOwnProperty('node') ? nArgs.node : 'body';
    this.container = this.getNode();
    this.radius = Math.min(this.width, this.height) / 2.0;
    this.svg = null;

    console.log('Loader Container is');
    console.log(this.container);
    this.bInitialDisplay = true;

}
Loader.prototype = Object.create(Core.prototype);
Loader.prototype.constructor = Loader;

Loader.prototype.display = function(data) {
    console.log(data);
    var shapeLock = {},
    colorLock = {};


    var transitionTime = 1200;
    if (this.bInitialDisplay) {
        this.bInitialDisplay = false;
        transitionTime = 0;
    }

    var input;
    if ( data.hasOwnProperty('frac') ){
        input = [ { start: 0.0, stop : parseFloat(data.frac.num) },
                  { start : 1.0, stop : parseFloat(data.frac.div) - parseFloat(data.frac.num) }
                ];
        this.norm = parseFloat(data.frac.div);
        this.numeric = parseInt((parseFloat(data.frac.num) / parseFloat(data.frac.div)) * 100)
    }
    var backGroundSpecs = data.hasOwnProperty('background') ? data.background : null;

    var color = d3.scale.linear()
        .domain([0, 0.5 , 1])
        .range(["red" , "orange", "green"]);

    var thickness = 0.25 * this.radius;

//    if (data.hasOwnProperty('thickness'))

    var arc = d3.svg.arc()
        .outerRadius(this.radius/* - 10*/)
        .innerRadius(this.radius - thickness/*25*/)
        //.cornerRadius(12);

    var pie = d3.layout.pie()
        .startAngle(-0.75 * Math.PI)
        .endAngle(0.75 * Math.PI)
        .sort(null)
        .value(function(d) { return d.start; });

    if (!this.svg)
        this.svg = d3.select(this.container).insert("svg",":first-child")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("class", "frame")
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
        if (backGroundSpecs) {
            var self = this;
            var shape =  backGroundSpecs.hasOwnProperty('shape') ? backGroundSpecs['shape'] : null;
            var colorId =  backGroundSpecs.hasOwnProperty('color') ? backGroundSpecs['color'] : null;
            if (shape && colorId) {
                this.svg.append(shape).each(function(){
                    if (shape === 'circle')
                        d3.select(this)
                        .attr('r', self.radius);
                })
                .style('fill', colorId)
            }
        }


        var g = this.svg.selectAll(".arc")
                .data(pie(input))
              //.data(pie([0, this.norm]))
            .enter().append("g")
            .attr("class", "arc");
        var self = this;
        g.append("path")
            .attr("d", arc)
            .each(function(d) { this._current = d; }); // store the initial angles;  return color(d.data / self.norm);});
        var path = this.svg.datum(data).selectAll("path");

        pie.value(function(d) { return d.stop; }); // change the value function
        path = path.data(pie(input)); // compute the new angles

        path.style("fill", function(d,i) {
                if (i === 1) return "grey";
                return color(d.data.stop / self.norm);
            });

        path.transition().duration(transitionTime)
        .each('end', function (d,i){
            if (i > 0) return;
            self.svg.selectAll("text").remove();
            self.svg.append("text")
            .attr("x", function(d){ return 0;return parseInt(self.width / 2)})
            .attr("y", function(d){ return parseInt(self.height * 0.1)})
            .attr("text-anchor", "middle")
            .attr("font-familly", "verdana")
            .style('fill', '#3c5061')
            .style("font-size", function(d){ return parseInt(self.radius / 1.75) + 'px' })
            .text(self.numeric + '%');

            if (parseInt(self.numeric) == 100)
                    self.emiter.emit("complete");
            })
        .attrTween("d", arcTween);



        // Store the displayed angles in _current.
        // Then, interpolate from _current to the new angles.
        // During the transition, _current is updated in-place by d3.interpolate.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        }


        function drawArcLine (radius, radians, node) {
            /*var radius = 100,
            padding = 10,
            */
            //radians = 9/5 * Math.PI;

            var dimension = (2 * radius),
            points = 50;

            var angle = d3.scale.linear()
                .domain([0, points-1])
                .range([0, radians]);

            var line = d3.svg.line.radial()
                .interpolate("basis")
                .tension(0)
                .radius(radius)
                .angle(function(d, i) { return angle(i); });

            var shape = node.append("path").datum(d3.range(points))
                        .attr("class", "line")
                        .attr("d", line);
            return shape;
        }



        function _pulse() {
            self.svg.selectAll('g.arcScaf').remove();
            var g = self.svg.append('g')
                    .attr('class', 'arcScaf')
                    .attr('transform','rotate(225)');
            var _r = 1.5 * Math.PI
            var pulsePath = drawArcLine(self.radius - thickness/2, _r , g);
            console.log("R = " + _r)
            pulsePath.style('stroke', 'red')
                .style('fill', 'none')
                .style('stroke-width', '0px');

            var startPoint = pathStartPoint(pulsePath);
            var endPoint = pathEndPoint(pulsePath);
            g.append("circle").attr("r", thickness/2)
                .attr('class', 'startCorner')
                .style('fill', function(){
                    console.log("numeric is " + self.numeric);
                    if (self.numeric === 0) {
                        console.log("ITS grey !!")
                        return self.svg.selectAll('g.arc path').last().style('fill');
                    }
                    console.log('it is not grey');
                    console.log(self.svg.selectAll('g.arc path').first().style('fill'));
                    return self.svg.selectAll('g.arc path').first().style('fill');
            })
            .attr("transform", "translate(" + startPoint + ")");

            g.append("circle").attr("r", thickness/2)
                .attr('class', 'endCorner')
                .style('fill', function(){
                    if (self.numeric === 100)
                        return self.svg.selectAll('g.arc path').first().style('fill');
                    return self.svg.selectAll('g.arc path').last().style('fill');
            })
            .attr("transform", "translate(" + endPoint + ")");

            var circle = g.append("circle")//self.svg.append("circle")
            .attr("r", thickness/2)
            .style('fill', 'red'/*'whitesmoke'*/)
            .style('opacity', '0.4')
            .attr("transform", "translate(" + startPoint + ")");

            transition();

            function pathStartPoint(path) {
                var point = path.attr("d").match(/^M([^L]+)L/)[1].split(',');
                return point;
            }
            function pathEndPoint(path) {
                var point = path.attr('d').match(/L([^L]+)$/)[1].split(',');
                return point;
            }

            function transition() {
                circle.transition()
                    .duration(5000)
                    .attrTween("transform", translateAlong(pulsePath.node()))
                    .each("end", transition);
            }

    // Returns an attrTween for translating along the specified path element.
            function translateAlong(path) {
                var l = path.getTotalLength();
                return function(d, i, a) {
                    return function(t) {
                        var p = path.getPointAtLength(t * l);
                        return "translate(" + p.x + "," + p.y + ")";
                    };
                };
            }
    }

    if ( data.hasOwnProperty('pulse') ){
        console.log("Pulsing");
        _pulse();
    };
/*        function shapeChange(path, duration) {
            d3.select(shapeLock).transition()
            .duration(duration)
            .tween("attr:transform", function() {
                var i = d3.interpolateString("rotate(0)", "rotate(720)");
            return function(t) { path.attr("transform", i(t)); };
        });
        }
*/
}


module.exports = {
    new : function(opt) {
        var o = new Loader(opt); return o;
    }
};




