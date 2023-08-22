const nodemailer = require('nodemailer');


const smtpConfig = {
    service: 'gmail',
    auth : {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_SMTP
    }
}

const transporter = nodemailer.createTransport(smtpConfig)

const sendWelcomeEmail = (email, name) => {
  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, ${name}. Let me know how you get along with the app `
  };
  
  // Kirim email
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent:  ${info.response}`);
    }
  });

}

const sendCancelEmail = (email, name) => {
  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Sorry to see you go!',
    text: `I'm so sorry ${name}. I Hope to see you soon! `
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    }{
      console.log(`Email sent: ${info.response}`)
    }
  })


}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
}