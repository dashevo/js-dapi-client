//Choose a random socket.io endpoint to connect
const {math} = require('khal');

exports.getSocketCandidate = function() {
    let self = this;
    return async function(){
        return new Promise(async function (resolve, reject) {
            let validMNList = self.Discover.Masternode.validMNList;
            if(validMNList && validMNList.length>0){
                //Select randomnly one of them
                let selectedMNIdx = math.randomBetweenMinAndMax(0, validMNList.length-1);
                let el = validMNList[selectedMNIdx];
                let socketPath = `${el.fullBase}`;
                return resolve({URI:socketPath,idx:selectedMNIdx});
            }else{
                throw new Error('No MN found :( Sadness & emptyness');
                return resolve(false);
            }
        });
    }
}