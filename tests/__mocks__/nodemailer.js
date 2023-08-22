// __mocks__/nodemailer.js
const sendEmailMock = jest.fn();

module.exports = {
  createTransport: jest.fn(() => ({
    sendMail: sendEmailMock,
  })),
  sendEmailMock,
};
