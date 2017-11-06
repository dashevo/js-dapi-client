const ax = require('axios');

const search = query => ax.get(`${'http://localhost:4000/graphql/graphiql?query={RootBase'}${query.returns}}`);

module.exports = { search };
