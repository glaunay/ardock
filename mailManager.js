const Email = require('email-templates');

let sendError = function(adress) {


}

let sendTest = function(adress) {

    console.log("Tryin to send to " + adress);

    let email = new Email({
      message: {
        from: 'guillaume.launay@ibcp.fr'
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: {
        jsonTransport: true
      }/*,
      textOnly: true*/
    });
    
    email
      .send({
        template: 'test',
        message: {
          to: adress
        },
        locals: {
          name: 'Elon'
        }
      })
      .then((e)=>{
        console.log("success sending");
        console.log(e); 
      })
      .catch((e)=>{
          console.log("error sending!!!");
          console.error(e);
        });

}


module.exports = {
    error : sendError,
    test : sendTest
}
