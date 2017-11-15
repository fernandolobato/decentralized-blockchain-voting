loadScript(PROJECT_PATH + 'deploy/deploy.js');

//loadScript(PROJECT_PATH + 'tests/test_setup.js');


var numVoterPerRing = 5;
var registrationStartTime = eth.getBlock(eth.blockNumber).timestamp + (60 * 5);
var registrationEndTime = registrationStartTime + (60 * 10);
var registrationVotingGap = (60 * 10);
var votingStartTime = registrationEndTime + registrationVotingGap;
var votingEndTime = votingStartTime + (60 * 10);

var numberVoterOptions = 3;

var tParties = 10;
var nParties = 25;

var thresholdKey = [new BigNumber('61231775618690165749564626470120491105592826495162750724593896247258543726202'), new BigNumber('61210584217842508670284023462702207750414782368184173586057315191500955814075')];
var secretShareVerifyPublicParams = [[new BigNumber('61231775618690165749564626470120491105592826495162750724593896247258543726202'), new BigNumber('61210584217842508670284023462702207750414782368184173586057315191500955814075')],[new BigNumber('86249214903156846881173062760386493272742615530456254094026145804375082674307'), new BigNumber('103835414976189216798227704480813156397572971170358261640100996265141919055658')],[new BigNumber('72815513936235049753056900462662145672927508400758101355240998881650041473265'), new BigNumber('64854380921284584116438919150710501460402538565885004891896884143489589953633')],[new BigNumber('41473948288220371232483447366693118685029139903501907284820882962284857079184'), new BigNumber('70039376540869677952556905675738034873325390196595211523535316555797932298315')],[new BigNumber('33325253144436861371584666908914349404301118113273888630625560458154048443059'), new BigNumber('83096491359864766763122509200953953210830648365586320898876670888634984509131')],[new BigNumber('17343464536302978469888526004404365276868281315156880049569103710702256014839'), new BigNumber('42621027713496445687907503031434797767564370645967452666785364134380066830940')],[new BigNumber('39722877204861822022404555666983592883155685926493216556761416146792625749889'), new BigNumber('89931468365399042027304040020651702779404428425256542129486962922662194299245')],[new BigNumber('71550092611500542563417696591121625930379907274946087689105566639836612132193'), new BigNumber('65037326778386928730112745133474854659701472539919062239144581337603721466221')],[new BigNumber('8390946166535652714924983470918077528369511074170095701001494092851616986517'), new BigNumber('41003026113083387422644684657446647113634791382214538226065181050826778798660')],[new BigNumber('28693387683278076925609982250307226709867846450301437123712178887675804545043'), new BigNumber('42233557614234217668271586036841895547952904798127899107390066911924554872669')]];


function testCorrectFinishSetup(e, contract) {
    console.log('\n-------Begin Test For Contract Setup-------\n');

    assert(contract.state.call() == 0, 'Contract is in inital state');

    // Execute all functions that don't change state 
    testThresholdKeyNotValid(e, contract);
    testSecretPublicParamsNotValid(e, contract);
    testMaxVotersPerRing(e, contract);
    testInvalidStartTime(e, contract);


    var validRegistrationParameters = contract.finishSetUp.call(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        secretShareVerifyPublicParams,
        thresholdKey);

    assert(validRegistrationParameters, 'Setup parameters should be valid');
    

    if(validRegistrationParameters != true){
        return;
    }


    var txHash = contract.finishSetUp.sendTransaction(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        secretShareVerifyPublicParams,
        thresholdKey,
        {from:eth.accounts[0], gas:4200000});
    
    waitForTxMine(txHash);
    assert(contract.state.call() == 1, 'Contract did not change state.');

    console.log('\n-------End Test For Contract Setup-------');
    return contract.state.call() == 1;
}

function testThresholdKeyNotValid(e, contract) {

    var validThresholdKey = contract.finishSetUp.call(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        secretShareVerifyPublicParams,
        [123, 123]);

    assert(validThresholdKey == false, 'Threshold key should not be valid');
}

function testSecretPublicParamsNotValid(e, contract) {
    var invalidSecretParams = secretShareVerifyPublicParams.slice();
    invalidSecretParams[0] = [123, 123];
    var validSecretParams = contract.finishSetUp.call(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        invalidSecretParams,
        thresholdKey);
    assert(validSecretParams == false, 'Secret shares should not be valid');
}


function testMaxVotersPerRing(e, contract) {
    
    var validSetup = contract.finishSetUp.call(
        MAX_VOTERS_PER_RING + 40,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        secretShareVerifyPublicParams,
        thresholdKey);

    assert(validSetup == false, 'Number of voters per ring should not be more than max');

}

function testInvalidStartTime(e, contract) {
    var validSetup = contract.finishSetUp.call(
        numVoterPerRing,
        registrationEndTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        secretShareVerifyPublicParams,
        thresholdKey);

    assert(validSetup == false, 'Registration time should not be valid');

    var validSetup = contract.finishSetUp.call(
        numVoterPerRing,
        555555,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        secretShareVerifyPublicParams,
        thresholdKey);

    assert(validSetup == false, 'Registration cant be less than current time');
}


function testVoteGapTimesValidity() {
    
}

// var instance = deploySmartContractTest(testCorrectFinishSetup);



