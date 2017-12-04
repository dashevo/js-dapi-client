const { User } = require('./User/');
const { AuthService } = require('./AuthService/authService');

const Accounts = () => ({
  API: {
    User: User(),
    AuthService,
  },
});

module.exports = {
  Accounts,
};
