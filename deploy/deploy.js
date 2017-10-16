loadScript('/Users/fernandolobato/Desktop/tesina/blockchain_voting/build/Voting.js');

var abi = compiledContractDefinition['contracts']['Voting']['abi'];
var bin = compiledContractDefinition['contracts']['Voting']['bin'];
var account = eth.accounts[0];
var passcode = "sastres";

var MAX_VOTERS_PER_RING = 500;

function deploySmartContract(contractAbi, contractBin, account, passcode, deployCallBack) {

    var transactionData = { from: account, data: contractBin, gas: '4689378' };
    var contractClass = web3.eth.contract(contractAbi);
    miner.start();
    personal.unlockAccount(account, passcode);
    return contractClass.new(transactionData, deployCallBack);
}

function displayDeployedContract(e, contract) {
    if (typeof contract.address !== 'undefined') {
        miner.stop();
        console.log('Contract mined! ', contract.address);
    } 
}

function deploySmartContractTest(testFunction){
    return deploySmartContract(abi, bin, account, passcode, function(e, contract){ 
        if (typeof contract.address !== 'undefined') {
            testFunction(e, contract);
            miner.stop();
            console.log('Test Case Passed!');
        } 
    });
}

function assert(condition, message) {
    if (!condition) {
        console.log('!!!Test failed: ', message);
    }
}

