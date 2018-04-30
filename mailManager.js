const Email = require('email-templates');
const nodemailer = require('nodemailer');
var ejs = require('ejs');

let user, pass = null;
let ibcpTransporter;

let configure = function (opt) {
  /*user = opt.user;
  pass = opt.pass;*/
  
  ibcpTransporter = nodemailer.createTransport({
    host: 'smtp.ibcp.fr',
    port: 587,
    secure: false // true for 465, false for other ports
   /* ,auth: {
      user: user,
      pass: pass 
    }*/,
    tls: {
    // do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
}

let authorBot = 'jobManager-ardock@ibcp.fr';

let sendTest = function(adress) {
  console.log('Testing start');
  sendEnd(adress, 'totoJob');
  return;


    let user = {firstName : 'John', lastName: 'Doe'};

    let subject = ejs.render('Hello <%= firstName %>', user);
    let text = ejs.render('Hello, <%= firstName %> <%= lastName %>!', user);


  var options = {
      from: authorBot,
      replyTo: authorBot,
      to: 'pitooon@gmail.com',
      subject: subject,
      text: text
  };

  ibcpTransporter.sendMail(options, 
      (err, info)=> {
        console.log(info.envelope);
        console.log(info.message.Id);}
  );
        
}


let _sendTest = function(adress) {
 
  //console.log("Tryin to send to " + adress);

  let email = new Email({
    message: {
      from: authorBot
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: ibcpTransporter,
    textOnly: true
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


let sendError = function(adress) {


}


let sendStart = function(adress, jobKey) {
  let data = { key : jobKey};

  let text = 'Dear user,\n\nYour job ' + jobKey + ' was successfully submitted.\n'
            + 'You will receive an additional email upon completion.\n\n\t\t\tThe ARDOCK Service.\n'
            + '***This is an automatically generated email, please do not reply';
  let subject = ejs.render('ArDock job <%= key %> start', data);


  let options = {
    from: authorBot,
    replyTo: authorBot,
    to: adress,
    subject: subject,
    text: text
  };

  ibcpTransporter.sendMail(options, 
    (err, info)=> {
      console.log(info.envelope);
      console.log(info.message.Id);}
  );
      
}
let sendEnd = function(adress, jobKey) {
  let data = { key : jobKey};

  let text = 'Dear user,\n\nYour job ' + jobKey + ' is completed.\nYou can access results via the restore menu on our'
      +' homepage at ardock.ibcp.fr.\n'
      +'The restore key is ' + jobKey + '.'
      + '\n\n'
      +'                                            The ARDOCK Service.'
      + '\n***This is an automatically generated email, please do not reply';
  let subject = ejs.render('ArDock job <%= key %> completion', data);





  let options = {
    from: authorBot,
    replyTo: authorBot,
    to: adress,
    subject: subject,
    text: text
  };

  ibcpTransporter.sendMail(options, 
    (err, info)=> {
      console.log(info.envelope);
      console.log(info.message.Id);}
  );
}

let _sendStart = function(adress, jobKey) {

    let email = new Email({
      message: {
        from: authorBot
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: ibcpTransporter,
      textOnly: true
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

let _sendEnd = function(adress, jobKey) {
  let email = new Email({
    message: {
      from: authorBot
    },
    // uncomment below to send emails in development/test env:
    send: true,
    textOnly: true,
    transport: ibcpTransporter
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
     /* console.log("success sending");
      console.log(e); */
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
