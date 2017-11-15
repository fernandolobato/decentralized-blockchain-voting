loadScript(PROJECT_PATH + 'deploy/deploy.js');
loadScript(PROJECT_PATH + 'tests/test_keyPublishing.js');

// loadScript(PROJECT_PATH + 'tests/test_tallying.js');


function tallyElection(e, contract) {
    if(!testKeyPublishing(e, contract, 10)) {
        console.log('Could not publish reconstructed key');
        return;
    }

    var result = contract.tallyElection.call();
    console.log('Election Results:');
    console.log(result);
}

var instance = deploySmartContractTest(tallyElection);