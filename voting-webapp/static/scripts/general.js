if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
}

BigNumber = web3.BigNumber;

(function( ELECTION, $, undefined ) {
    
    var abi = compiledContractDefinition['contracts']['Voting']['abi'];

    ELECTION.address = "0xbd5f37c84fdf1b8f73f6040c94e2f46ccbf8ef5a";
    ELECTION.contract = web3.eth.contract(abi).at(ELECTION.address);
    ELECTION.owner = ELECTION.contract.owner.call();
    ELECTION.thresholdKey = [];
    ELECTION.publicVerifyParams = [];
        
    ELECTION.states = {
      'SETUP': 0,
      'REGISTRATION': 1,
      'VOTING': 2,
      'FINISHED': 3,
      'READY_TO_TALLY': 4
    }

    ELECTION.stateNames = ['SETUP', 'REGISTRATION', 'VOTING', 'FINISHED VOTING', 'READY TO TALLY'];

    ELECTION.hideTabs = function(tabs) {
        for(var i = 0; i < tabs.length; i++){
            $('#' + tabs[i]).hide();
        }
    }

    ELECTION.dateToUnixTime = function(date){
        if(date){
           return Math.round((new Date(date)).getTime() / 1000);  
        }
        else{
            return Math.round((new Date()).getTime() / 1000);
        }
    }


    ELECTION.unixTimeToDate = function(unixTime) {
        var time = new Date(unixTime * 1000);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var year = time.getFullYear();
        var month = months[time.getMonth()];
        var date = number(time.getDate());
        var hour = number(time.getHours());
        var min = number(time.getMinutes());
        var sec = number(time.getSeconds());
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
        return time;
    }

    ELECTION.updateDescription = function(state) {
        // Updates the description of the contract for the user to know in which
        // phase the election is.

        if(state == null) state = ELECTION.contract.state.call();
        
        $('#electionDescription').html('Election contract with address: ' + ELECTION.address);
        $("#electionDescription").append('<br> Currently in ' + ELECTION.stateNames[state] + ' Phase');

        if(state == ELECTION.states['REGISTRATION'] || state == ELECTION.states['VOTING']) {

            var startTime = ELECTION.contract.votingStartTime.call();
            var endTime = ELECTION.contract.votingEndTime.call();
            
            if(state == ELECTION.states['REGISTRATION']){
                var startTime = ELECTION.contract.registrationStartTime.call();
                var endTime = ELECTION.contract.registrationEndTime.call();
            }

            var curr = ELECTION.unixTimeToDate(ELECTION.dateToUnixTime())
            var start = ELECTION.unixTimeToDate(startTime);
            var end = ELECTION.unixTimeToDate(endTime);

            $('#electionDescription').append('<br>Start Time: ' + start);
            $('#electionDescription').append('<br>Current Time: ' + curr);
            $('#electionDescription').append('<br>End Time: ' + end);
        }
    }

    ELECTION.tallyResults = function(div) {
        var state = ELECTION.contract.state.call();
        var numVotingOptions = parseInt(ELECTION.contract.numberOfVotingOptions.call().toString(10));

        if(state = ELECTION.states['READY_TO_TALLY']) {
            var results = ELECTION.contract.tallyElection.call();
            return results.slice(1, numVotingOptions + 1);
        }        

        return false;
        
    }

    ELECTION.keyCanBeReconstructed = function() {
        var n = ELECTION.contract.nParties.call();
        var secrets = [];

        for(var i = 0; i < n ;i++) {
            var s = ELECTION.contract.secretShare.call(i);

            if(s == 0) {
                return false;
            }

            secrets.push(s.toString(10));
        }

        return secrets;
    }

    function number(time) {
        if(time < 10) {
            return '0' + time;
        }
        return time;
    }

}( window.ELECTION = window.ELECTION || {}, jQuery ));
