exports.getDapiCandidateURI = function() {

    return new Promise(function(resolve, reject) {
        SDK.Discover.getDapiCandidate()
            .then(candidate => {
                resolve(candidate.URI)
            })
            .catch(err => {
                reject(err);
            })
    });
}