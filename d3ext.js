var d3 = require('d3');

d3.selection.prototype.size = function() {
    var n = 0;
    this.each(function() { ++n; });
    return n;
  };

d3.selection.prototype.first = function() {
  return d3.select(this[0][0]);
};
d3.selection.prototype.last = function() {
  var last = this.size() - 1;
  return d3.select(this[0][last]);
};

d3.selection.prototype.index = function(i) {
    if(i > this.size() - 1) return null;
    return d3.select(this[0][i]);
};

//prototype. move to front
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

//prototype. delegated events
d3.selection.prototype.delegate = function(event, targetselector, handler) {
    var self = this;
    return this.on(event, function() {
        var eventTarget = d3.event.target,
            target = self.selectAll(targetselector);
        target.each(function() {
            //only perform event handler if the eventTarget and intendedTarget match
            if (eventTarget === this) {
                handler.call(eventTarget, eventTarget.__data__);
            } else if (eventTarget.parentNode === this) {
                handler.call(eventTarget.parentNode, eventTarget.parentNode.__data__);
            }
        });
    });
};


module.exports = {
    d3 : d3
};