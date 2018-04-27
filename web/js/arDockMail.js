var $  = require( 'jquery' );
var events = require('events');

var validator = require("email-validator");
var Core =require('./Core.js').Core;




var arDockMail = function(opt) {
    //  console.dir(opt);
      var nArgs = opt ? opt : {};
     // console.log($(nArgs.root));
        Core.call(this, nArgs);
      this.mode = null;
      this.bDisabled = false;
  }
  
arDockMail.prototype = Object.create(Core.prototype);
  //arDockTable.prototype = Object.create(widgets.Core.prototype);
  
arDockMail.prototype.constructor = arDockMail;
  
arDockMail.prototype.display = function(opt) {
    $(this.getNode()).addClass('arDockMail').append('<div class="input-group email-input margin-bottom-sm">'
//+ '<span class="input-group-addon"><i class="fa fa-envelope-o fa-fw"></i></span>'
        + '<span class="input-group-addon"><i class="fa fa-envelope-o fa-fw"></i></span>'
        + '<input class="form-control" type="text" placeholder="Email adress to inform on results">'
        + '<span class="input-group-addon submissionHit">Submit</span>'
        + '</div>');

           /* Dynamic Email managment */
    let input = $(this.getNode()).find('.email-input input')[0];
    let self = this;
    input.addEventListener('input', function()
    {
        console.log('input changed to: ', input.value);
        self.checkMail(input.value);

    });
};


arDockMail.prototype.checkMail = function(value){
    $(this.getNode()).find('.submissionHit').off('click');
    $(this.getNode()).find('.submissionHit').html('Submit');
    if(validator.validate(value)) {
        console.log('mail ok');
        this.email = value;
        let self = this;
        $(this.getNode()).find('.submissionHit').addClass('submissionOK');
        $(this.getNode()).find('.submissionHit').on('click', () => {
            self.emiter.emit('newEmail', self.email);
            $(this.getNode()).find('.submissionHit').html('<i class="fa fa-check" aria-hidden="true"></i>');
        });
    } else {
        $(this.getNode()).find('.submissionHit').removeClass('submissionOK');
       
    }
    
}





module.exports = {
    new : function(opt) { var o = new arDockMail(opt); return o;}
};
