function openFile(event) {
    var input = event.target;

    var reader = new FileReader();
    
    var n = document.getElementById('nVoters').value;
    var t = document.getElementById('tVoters').value;

    reader.onload = function() {
        var lines = reader.result.split("\n");

        if(lines.length - 2 == t) {

            var row = lines[0].split(",");
            ELECTION.thresholdKey = [new BigNumber(row[0]), new BigNumber(row[1])];
            ELECTION.publicVerifyParams = [];

            for(var i = 1; i < lines.length - 1; i++) {
                var row = lines[i].split(",");
                ELECTION.publicVerifyParams.push([new BigNumber(row[0]), new BigNumber(row[1])])
            }
        }
        else{
            input.value = "";
            alert('Problem with file');
        }
    }

    reader.readAsText(input.files[0]);
};


function verifySetupForm() {

    var registrationStartTime = ELECTION.dateToUnixTime($('#registrationStartTime').val());
    var registrationEndTime = ELECTION.dateToUnixTime($('#registrationEndTime').val());
    var votingStartTime = ELECTION.dateToUnixTime($('#votingStartTime').val());
    var votingEndTime = ELECTION.dateToUnixTime($('#votingEndTime').val());
    var registrationVotingGap = (60 * 10);

    var numVoterPerRing = parseInt($("#numVoterPerRing").val());
    var numberVoterOptions = parseInt($("#numVotingOptions").val());
    var tParties = parseInt($('#tVoters').val());
    var nParties = parseInt($('#nVoters').val());

    var validRegistrationParameters = ELECTION.contract.finishSetUp.call(
        numVoterPerRing,
        registrationStartTime,
        registrationEndTime,
        registrationVotingGap,
        votingStartTime,
        votingEndTime,
        numberVoterOptions,
        tParties,
        nParties,
        ELECTION.publicVerifyParams,
        ELECTION.thresholdKey);

    if(validRegistrationParameters) {

        web3.personal.unlockAccount(ELECTION.owner, ADMIN.passcode);
        var txHash = ELECTION.contract.finishSetUp.sendTransaction(
            numVoterPerRing,
            registrationStartTime,
            registrationEndTime,
            registrationVotingGap,
            votingStartTime,
            votingEndTime,
            numberVoterOptions,
            tParties,
            nParties,
            ELECTION.publicVerifyParams,
            ELECTION.thresholdKey,
            {from:ELECTION.owner, gas:4200000});

        $('.close').click();

        ADMIN.changingContractState(txHash);
    }
    return validRegistrationParameters;
}


$(document).ready(function() {

    $('#registerElection').on('click', function(event) {
        event.preventDefault();
        verifySetupForm();
    });

});
