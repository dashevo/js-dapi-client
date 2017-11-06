const remove = query => new Promise(((resolve) => {
  console.log(query); // TODO: Remove this in production
  resolve(true);
}));

module.exports = { remove };
