loadScript(PROJECT_PATH + 'deploy/deploy.js');
loadScript(PROJECT_PATH + 'tests/test_registerVoter.js');

//loadScript(PROJECT_PATH + 'tests/test_voting.js');

function testVoting(e, contract, numVoters) {
    
    // var numVotersToRegister = pubKeys.length;
    var numVotersToRegister = 5;

    if(numVoters) {
       numVotersToRegister = numVoters; 
    }

    if(!testRegiserVoters(e, contract, numVotersToRegister)){
        console.log('Could not register voters');
    }

    console.log('\n--------- Begin Test Voting ----------\n');

    // Verify we can move state to voting.
    if(!contract.endRegistrationPhase.call()){
        console.log('Could not Finish Registration Phase');
        return;
    }

    var txHash = contract.endRegistrationPhase.sendTransaction({from:eth.accounts[0], gas:4200000});

    waitForTxMine(txHash);

    assert(contract.state.call() == 2, 'Could not move contract to voting phase');

    if(contract.state.call() != 2) {
        return;
    }

    /*********************************************************
                    Begin Voting Phase
    *********************************************************/

    // Finally we each paticipant most vote. This will take a while.
    var signatureDirectory = PROJECT_PATH + 'tests/test_data/signatures/';
    var file_name = 'signature_';


    // Vote Casting
    var numVotes = numVotersToRegister;

    console.log('Begin Voting');
    for(var i = 0; i < numVotes; i++) {
        var current_file = signatureDirectory + file_name + String(i) + '.js';
        loadScript(current_file);
  
        while(message == null){
            console.log('latencia de la red negro ;)')
            admin.sleep(1);
        }

        var validVote = contract.castVote.call(
            message,
            pub_keys, 
            c_0,
            s,
            Y);
        
        assert(validVote, 'Vote was invalid - Verify Ring Signature');

        // var callData = contract.castVote.getData(message,pub_keys,c_0,s,Y);
        // var result = web3.eth.estimateGas({
        //     to: contract.address, 
        //     data: callData
        // });

        if(validVote) {
            var txHash = contract.castVote.sendTransaction(
                message,
                pub_keys, 
                c_0,
                s,
                Y,
                {from:eth.accounts[0], gas:8718922, gasPrice:1});

            waitForTxMine(txHash, 15);

            assert(contract.getNumberCastedVotes.call() == i + 1, 'Vote was not recorded');

            console.log('Mined vote ', i);
        }
    }
    
    console.log('\n--------- End Test Voting ---------');
    return true;
}

// var instance = deploySmartContractTest(testVoting);
