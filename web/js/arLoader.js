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

}
Loader.prototype = Object.create(Core.prototype);
Loader.prototype.constructor = Loader;

Loader.prototype.display = function(data) {
    console.log(data);
    var shapeLock = {},
    colorLock = {};

    var input;
    if ( data.hasOwnProperty('frac') ){
        input = [ { start: 0.0, stop : parseFloat(data.frac.num) },
                  { start : 1.0, stop : parseFloat(data.frac.div) - parseFloat(data.frac.num) }
                ];
        this.norm = parseFloat(data.frac.div);
        this.numeric = parseInt((parseFloat(data.frac.num) / parseFloat(data.frac.div)) * 100)
    }
    console.log('<<IN>>');
    console.log(input);

    var backGroundSpecs = data.hasOwnProperty('background') ? data.background : null;

    var color = d3.scale.linear()
        .domain([0, 0.5 , 1])
        .range(["red" , "orange", "green"]);

        var thickness = 0.15 * this.radius;

    var arc = d3.svg.arc()
        .outerRadius(this.radius/* - 10*/)
        .innerRadius(this.radius - thickness/*25*/)
        //.cornerRadius(12);

    var pie = d3.layout.pie()
        .startAngle(-0.75 * Math.PI)
        .endAngle(0.75 * Math.PI)
        .sort(null)
        .value(function(d) { console.log('pieValues'); console.dir(d);return d.start; });

    if (!this.svg)
        this.svg = d3.select(this.container).insert("svg",":first-child")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
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
        /*
        .style("fill", function(d,i) {
                console.log('fillValues');console.dir(d);
                if (i === 1) return "grey";  console.log(d.data.stop + ' / ' + self.norm);
               // return color(d.data.stop / self.norm);
                console.log("COLOR ");
                console.dir(color(d.data.stop / self.norm));
                return color(d.data.stop / self.norm);
            })
            */
            .attr("d", arc)
            .each(function(d) { this._current = d; }); // store the initial angles;  return color(d.data / self.norm);});
        var path = this.svg.datum(data).selectAll("path");

        console.log('updating');

        pie.value(function(d) {  console.log('pieUpdateValues');console.dir(d);return d.stop; }); // change the value function
        path = path.data(pie(input)); // compute the new angles

        path.style("fill", function(d,i) {
                console.log('fillValues');console.dir(d);
                if (i === 1) return "grey";  console.log(d.data.stop + ' / ' + self.norm);
               // return color(d.data.stop / self.norm);
                console.log("COLOR ");
                console.log(d.data.stop / self.norm);
                console.dir(color(d.data.stop / self.norm));
                return color(d.data.stop / self.norm);
            });
        console.log('Running transition');
        //path = path.data(pie(input));

        path.transition().duration(2000)
        .each('end', function (d,i){
            if (i > 0) return;
            self.svg.selectAll("text").remove();
            self.svg.append("text")
            .attr("x", function(d){ return 0;return parseInt(self.width / 2)})
            .attr("y", function(d){ return parseInt(self.height * 0.1)})
            .attr("text-anchor", "middle")
            .attr("font-familly", "verdana")
            .style('fill', '#3c5061')
            .style("font-size", function(d){ return parseInt(self.radius / 1.25) + 'px' })
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




