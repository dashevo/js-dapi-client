require('../../_before.js');
const should = require('should');

//pvr: not a valid test yet - just temp used for dev purposes
var signature = '';
var authBaseAddress = '';
describe('Accounts - create', function() {
    it('should create transaction on the blockchain with user object data', async function() {

        SDK.Accounts.User.create('pierre', 'yiBCPVWznF2nHDQD6H8wFWB8bhN8TKHFXc', signature, authBaseAddress)
            .then((result) => {
                console.log(result)
            })
            .catch((err) => {
                console.log(err)
            });


    });
});