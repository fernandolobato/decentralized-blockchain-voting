var PROJECT_PATH = '/Users/fernandolobato/Desktop/tesina/blockchain_voting/';
loadScript(PROJECT_PATH + 'build/Voting.js');

//loadScript(PROJECT_PATH + 'deploy/deploy.js');


var abi = compiledContractDefinition['contracts']['Voting']['abi'];
var bin = compiledContractDefinition['contracts']['Voting']['bin'];
var account = eth.accounts[0];
var passcode = "sastres";
var DEBUG = true;

var MAX_VOTERS_PER_RING = 500;

function deploySmartContract(contractAbi, contractBin, account, passcode, deployCallBack) {
    var transactionData = { from: account, data: contractBin, gas: '5200000' };
    var contractClass = web3.eth.contract(contractAbi);
    miner.start();
    personal.unlockAccount(account, passcode);
    return contractClass.new(false, transactionData, deployCallBack);
}

function displayDeployedContract(e, contract) {
    if (typeof contract.address !== 'undefined') {
        
        if(DEBUG) {
            var txHash = contract.setDebug.sendTransaction({from: account, gas: '5200000'})
            waitForTxMine(txHash);
            console.log('Set to Debug');
        }
        miner.stop();
        console.log('Contract mined! ', contract.address);
    } 
}

function deploySmartContractTest(testFunction){
    return deploySmartContract(abi, bin, account, passcode, function(e, contract){ 
        if (typeof contract.address !== 'undefined') {
            console.log('Contract Mined!', contract.address);
            
            if(DEBUG) {

                var txHash = contract.setDebug.sendTransaction({from:account, gas:'5200000'})
                waitForTxMine(txHash);
                console.log('Set to Debug');
            }

            testFunction(e, contract);
            miner.stop();
            console.log('Test Case Finished');
        }
    });
}

function assert(condition, message) {
    if (!condition) {
        console.log('!!!Test failed: ', message);
    }
}

function waitForTxMine(txHash, maxWait) {
    var secondsDown = 0;
    
    if(maxWait == null) {
        maxWait = 15;
    }

    while(tx == null || tx.blockNumber == null) {
        admin.sleep(1);
        secondsDown += 1;
                
        var tx = eth.getTransaction(txHash);
        if(secondsDown > maxWait){
            console.log('Transaction took longer than threshold to mine');
            return false;
        }
    }  

    return true;
}

// var instance = deploySmartContract(abi, bin, account, passcode, displayDeployedContract);

