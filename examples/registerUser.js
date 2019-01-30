const Api = require('../');

const {
  Transaction,
  PrivateKey,
} = require('@dashevo/dashcore-lib');

const userName = Math.random().toString(36).substring(7);
const feePrivateKey = new PrivateKey(process.env.FEE_PRIVATE_KEY);
const userPrivateKey = new PrivateKey(process.env.USER_PRIVATE_KEY);

api = new Api();

async function registerUser(userName, userPrivateKey, feePrivateKey) {

  // Derive addresses from private keys
  feeAddress = feePrivateKey.toAddress().toString();
  userAddress = userPrivateKey.toAddress().toString();

  // Construct a blockchain user subscription tx payload
  const validPayload = new Transaction.Payload.SubTxRegisterPayload()
   .setUserName(userName)
   .setPubKeyIdFromPrivateKey(userPrivateKey).sign(userPrivateKey);

  // Get inputs containing a balance to fund tx
  const inputs = await api.getUTXO(feeAddress);

  // Construct and sign the full subscription tx
  const transaction = Transaction()
   .setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
   .setExtraPayload(validPayload)
   .from(inputs.slice(-1)[0])
   .addFundingOutput(10000)
   .change(feeAddress)
   .sign(feePrivateKey);

  console.log('Subscription transaction:', transaction);

  // Broadcast the subscription tx
  ({ txid: userRegTxId } = await api.sendRawTransaction(transaction.serialize()));

  return userRegTxId;
}

const start = async () => {

  const userRegTxId = await registerUser(userName, userPrivateKey, feePrivateKey);
  console.log(userName, 'registration txid:', userRegTxId);

};

start();
