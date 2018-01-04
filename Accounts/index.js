const { AuthService } = require('./AuthService/authService');

const Accounts = () => ({
  API: {
    AuthService,
  },
});

module.exports = {
  Accounts,
};
