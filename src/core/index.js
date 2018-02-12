const { StateTransition } = require('bitcore-lib-dash');
module.exports.User = require('./User');
module.exports.Address = require('./Address');
module.exports.Transaction = require('./Transaction');
module.exports.RegSubTx = require('./subscriptionTransactions/RegSubTx');
module.exports.TopUpSubTx = require('./subscriptionTransactions/TopUpSubTx');

module.exports.StateTransition = StateTransition;
module.exports.TransitionHeader = StateTransition.TransitionHeader;
module.exports.TransitionPacket = StateTransition.TransitionPacket;
