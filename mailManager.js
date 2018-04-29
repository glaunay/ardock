const Email = require('email-templates');
const nodemailer = require('nodemailer');


let user, pass = null;
let ibcpTransporter;

let configure = function (opt) {
  user = opt.user;
  pass = opt.pass;
  
  ibcpTransporter = nodemailer.createTransport({
    host: 'smtp.ibcp.fr',
    port: 587,
    secure: false // true for 465, false for other ports
    ,auth: {
      user: user, // generated ethereal user
      pass: pass // generated ethereal password
    },
    tls: {
    // do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
}

let authorBot = 'jobManager-ardock@ibcp.fr';

let sendTest = function(adress) {

  //console.log("Tryin to send to " + adress);

  let email = new Email({
    message: {
      from: authorBot
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: ibcpTransporter/* {
      jsonTransport: true
    }*//*,
    textOnly: true*/
  });
  
  email
    .send({
      template: 'jobStart',
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


let sendError = function(adress) {


}

let sendStart = function(adress, jobKey) {

    let email = new Email({
      message: {
        from: authorBot
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: ibcpTransporter/* {
        jsonTransport: true
      }*//*,
      textOnly: true*/
    });
    
    email
      .send({
        template: 'jobStart',
        message: {
          to: adress
        },
        locals: {
          name: jobKey
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

let sendEnd = function(adress, jobKey) {
  let email = new Email({
    message: {
      from: authorBot
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: ibcpTransporter/* {
      jsonTransport: true
    }*//*,
    textOnly: true*/
  });
  
  email
    .send({
      template: 'jobEnd',
      message: {
        to: adress
      },
      locals: {
        name: jobKey
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
    test : sendTest,
    start : sendStart,
    end : sendEnd,
    configure : configure
}
