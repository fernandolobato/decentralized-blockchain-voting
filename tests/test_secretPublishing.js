loadScript(PROJECT_PATH + 'deploy/deploy.js');
loadScript(PROJECT_PATH + 'tests/test_voting.js');

//loadScript(PROJECT_PATH + 'tests/test_secretPublishing.js');

function testSecretPublishing(e, contract, numVoters) {
    
    if(!testVoting(e, contract, numVoters)){
        console.log('Could no carry out vote');
        return;
    }

    console.log('\n---------- Begin Test Publishing secrets -----------\n');
    assert(contract.endVotingPhase.call(), 'Could not end voting phase.');
    
    var txHash = contract.endVotingPhase.sendTransaction({from:eth.accounts[0], gas:4200000});

    waitForTxMine(txHash);
    
    assert(contract.state.call() == 3, 'Could not begin secret publishing phase');

    var secretDirectory = PROJECT_PATH + 'tests/test_data/threshold/';
    var fileName = 'share_';

    // Upload Secret Share.
    for(var i = nParties - 1; i > -1; i--) {
        var currentFile = secretDirectory + fileName + String(i+1) + '.js';
        console.log(currentFile);
        loadScript(currentFile);

        while(secret == null) {
            console.log('Network latency');
            admin.sleep(1);
        }

        var res = contract.publishSecretShares.call(i, secret);

        assert(res, 'Secret share should be valid.');

        console.log('About to Mine Secret', i);
        personal.unlockAccount(account, passcode);
        var txHash = contract.publishSecretShares.sendTransaction(i, secret, {from:eth.accounts[0], gas:4300000, gasPrice:1});    
            
        console.log(txHash);
        waitForTxMine(txHash, 15);
        console.log('Mined Secret', i);
        assert(secret.toString(10) == contract.secretShare.call(i).toString(10), 'Secret not uploaded');
    }

    console.log('---------- End Test Publishing secrets -----------');

    return true;
}

// var instance = deploySmartContractTest(testSecretPublishing);
