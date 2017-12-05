const SDK = require('../../');

SDK.getUser('alice')
  .then(res => res.result)
  .then(userRes => SDK.createUser(userRes.uname, userRes.pubkey))
  .then((createRes) => {
    console.log(createRes);
  });

