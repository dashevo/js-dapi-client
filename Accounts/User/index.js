const { create } = require('./create');
const { login } = require('./login');
const { search } = require('./search');
const { send } = require('./send');
const { update } = require('./update');
const { remove } = require('./remove');

const User = () => ({
  create,
  login,
  search,
  send,
  update,
  remove,
});

module.exports = {
  User,
};
