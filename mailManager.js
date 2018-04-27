const Email = require('email-templates');

let sendError = function(adress) {


}

let sendTest = function(adress) {

    console.log("Tryin to send to " + adress);

    let email = new Email({
      message: {
        from: 'niftylettuce@gmail.com'
      },
      // uncomment below to send emails in development/test env:
      // send: true
      transport: {
        jsonTransport: true
      }
    });
    
    email
      .send({
        template: 'tests',
        message: {
          to: adress
        },
        locals: {
          name: 'Elon'
        }
      })
      .then(console.log)
      .catch(console.error);

}


module.exports = {
    error : sendError,
    test : sendTest
}
