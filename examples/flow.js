const registerUser = require('./register_user');

async function main() {
  const user = await registerUser();
  console.log(user);
}

main().catch(console.error);
