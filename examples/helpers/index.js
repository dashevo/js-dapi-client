function confirmationPrompt() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

module.exports = { confirmationPrompt };
