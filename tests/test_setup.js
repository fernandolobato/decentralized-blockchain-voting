loadScript('/Users/fernandolobato/Desktop/tesina/blockchain_voting/deploy/deploy.js');

var numVoterPerRing = 50;
var registrationStartTime = eth.getBlock(eth.blockNumber).timestamp + (60 * 5);
var registrationEndTime = registrationStartTime + (60 * 10);
var registrationVotingGap = (60 * 10);
var votingStartTime = registrationEndTime + registrationVotingGap;
var votingEndTime = votingStartTime + (60 * 10);
var thresholdKey = [new BigNumber('90707198880225589485528336504749167732206651384440532747977047495411092046340'), new BigNumber('77084686888007402684172433506500060614310963628784863865537207333428118762045')];
var secretShareVerifyPublicParams = [[new BigNumber('90707198880225589485528336504749167732206651384440532747977047495411092046340'), new BigNumber('77084686888007402684172433506500060614310963628784863865537207333428118762045')],[new BigNumber('49350005808383302783042045427704947485544722476824293903450283537989159942450'), new BigNumber('90108999286733602337371949814062733273551140570796147712088604473945890851861')],[new BigNumber('64339514700532449445185865156921574028463049708070436070900564526691351119767'), new BigNumber('26158242204126733289338399713561943963149172697945046488891245334023385597880')],[new BigNumber('58902117177447791115821116144889288190100789255069829584719574514399215991577'), new BigNumber('20289824429026413922144544816472085423183208637154748624463959312121668442941')],[new BigNumber('105017402916506244200490181456334332313176026815639637721625193522493368665828'), new BigNumber('7961995489715701823898250278072888891793398145248077940672200395381755806101')],[new BigNumber('33804538464200777412681467085190814485545172357595015290431676178288082772180'), new BigNumber('104108737397705816236270176988569207945307324676913114702351976851153051956532')],[new BigNumber('104577946860589706899769219675820042681268801449041759597884768012039533345581'), new BigNumber('59507489266175605398457522727785180031610942465344835354674122188699674146582')],[new BigNumber('7893626809082308123054331426479839645471592744985363512465459223889838147396'), new BigNumber('7618630237953768918491256097089925269516803227910825566337876250768439736475')],[new BigNumber('88615539394742769173526331498704337847300014777132898371183736363007263005927'), new BigNumber('91436632728213246267575217039600247758814574357058693804490587593952838216981')],[new BigNumber('47613066797889855795182695765873577419680073619907936513971097498002506152977'), new BigNumber('7188155867287692306159154692068164186742420749317223739373299333559113076583')]];

deploySmartContractTest(testCorrectFinishSetup);


function testCorrectFinishSetup(e, contract) {
    
    assert(contract.state.call() == 0, 'Contract is in inital state');

    /* Execute all functions that don't change state*/
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
        secretShareVerifyPublicParams,
        thresholdKey);

    assert(validRegistrationParameters, 'Setup parameters should be valid');

    var transactionHash = contract.finishSetUp.sendTransaction(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        secretShareVerifyPublicParams,
        thresholdKey,
        {from:eth.accounts[0], gas:4200000});
    

    var transaction = eth.getTransaction(transactionHash);

    while(transaction == null || transaction.blockNumber == null) {
        var transaction = eth.getTransaction(transactionHash);
    }

    assert(contract.state.call() == 1, 'Contract did not change state.');
}

function testThresholdKeyNotValid(e, contract) {

    var validThresholdKey = contract.finishSetUp.call(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
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
        secretShareVerifyPublicParams,
        thresholdKey);

    assert(validSetup == false, 'Registration cant be less than current time');
}


