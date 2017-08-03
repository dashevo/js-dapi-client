exports.getConnectorCandidateURI = function() {

    return new Promise(function(resolve, reject) {
        SDK.Discover.getConnectorCandidate()
            .then(candidate => {
                resolve(candidate.URI)
            })
            .catch(err => {
                reject(err);
            })
    });
}