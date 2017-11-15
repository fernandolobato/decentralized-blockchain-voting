loadScript(PROJECT_PATH + 'deploy/deploy.js');
loadScript(PROJECT_PATH + 'tests/test_secretPublishing.js');

// loadScript(PROJECT_PATH + 'tests/test_keyPublishing.js');


function testKeyPublishing(e, contract, numVoters) {

    if(!testSecretPublishing(e, contract, numVoters)){
        console.log('Could not publish secerts');
        return;
    }
    
    console.log('------------- Begin Test Publishing Private Key -----------');
    var privateKey = new BigNumber('1225879447413546859544247169937794718548624677272314384478271807212732725745');
    var acceptedKey = contract.publishReconstructedKey.call(privateKey);

    assert(acceptedKey, 'Key was not accepted');

    if(acceptedKey) {
        var txHash = contract.publishReconstructedKey.sendTransaction(privateKey, {from:eth.accounts[0], gas:4200000});

        waitForTxMine(txHash);
        var reconstructedKey = new BigNumber(contract.reconstructedKey.call());

        assert(reconstructedKey.toString(10), privateKey.toString(10), 'Private Key not being published');
    }

    console.log('------------- End Test Publishing Private Key -----------');
    return true;
}

// var instance = deploySmartContractTest(testKeyPublishing);
