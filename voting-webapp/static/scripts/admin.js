(function( ADMIN, $, undefined ) {

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    var modal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: [],
        closeLabel: "Close",
        cssClass: ['custom-class-1', 'custom-class-2']
    });


    ADMIN.passcode = null;

    ADMIN.tabs = ['setupTabButton', 'finishVotingPhaseButton', 'endRegistration', 'registerTabButton', 'viewVotersTabButton', 'viewVotesTabButton', 'tallyTabButton'];

    ADMIN.verifyPasscode = function() {

        var pass = $("#passcode").val();
        $('.tingle-btn--pull-right').hide();

        setTimeout(function() {
            try {
                web3.personal.unlockAccount(ELECTION.owner, pass);
                modal.close()
                ADMIN.passcode = pass;
                ADMIN.currentState();
            }
            catch(err) {
                console.log(err, 'Could not unlock contract');
                $('.tingle-btn--pull-right').show();
            } 
        }, 100);
    }

    modal.setContent('<div id="modalContent"> </div>');
    modal.addFooterBtn('Verify', 'tingle-btn--pull-right', ADMIN.verifyPasscode);
    $("#modalContent").append($('#modal').clone().css('display', 'table'));


    ADMIN.changingContractState = async function(txHash) {
        ELECTION.hideTabs(ADMIN.tabs);
        
        $('#electionDescription').html('Contract changing state with transaction ' + txHash);
        var tx = web3.eth.getTransaction(txHash);

        while(tx == null || tx.blockNumber == null) {
            await sleep(2000);
            var tx = web3.eth.getTransaction(txHash);
        }

        ADMIN.currentState(); 
    }

    ADMIN.currentState = function(){
        ELECTION.hideTabs(ADMIN.tabs);

        var state = ELECTION.contract.state.call();

        if(state == ELECTION.states['SETUP']) {
            $('#setupTabButton').show();
        
        }

        if(state == ELECTION.states['REGISTRATION']) {
            var currentTime = ELECTION.dateToUnixTime();
            var registartionStartTime = ELECTION.contract.registrationStartTime.call().toString(10);
            
            if(currentTime < registartionStartTime) {

                var curr = ELECTION.unixTimeToDate(currentTime)
                var start = ELECTION.unixTimeToDate(registartionStartTime);

                $('#electionDescription').html('Waiting for registartion to start');
                $('#electionDescription').append('<br> Current Time: ' + curr );
                $("#electionDescription").append('<br> Registration Starts: ' + start);

                return state;
            }

            $('#registerTabButton').show();
            $('#viewVotersTabButton').show();

            var startTime = ELECTION.contract.registrationStartTime.call();
            var endTime = ELECTION.contract.registrationEndTime.call();
            
            if(currentTime > endTime) {
                $('#endRegistration').show();
            }
        }
        if(state == ELECTION.states['VOTING']) {
            $('#viewVotersTabButton').show();
            $('#viewVotesTabButton').show();

            var votingstartTime = ELECTION.contract.votingStartTime.call();
            var votingEndTime = ELECTION.contract.votingEndTime.call();
            var currentTime = ELECTION.dateToUnixTime();

            if(currentTime < votingstartTime) {
                var curr = ELECTION.unixTimeToDate(currentTime)
                var start = ELECTION.unixTimeToDate(votingstartTime);

                $('#electionDescription').html('Waiting for Voting to start');
                $('#electionDescription').append('<br> Current Time: ' + curr );
                $("#electionDescription").append('<br> Voting Starts: ' + start);
            }

            if(currentTime > votingEndTime) {
                $('#finishVotingPhaseButton').show();
            }
        
        }
        if(state == ELECTION.states['FINISHED']) {
            $('#viewVotersTabButton').show();
            $('#viewVotesTabButton').show();
        
        }
        if(state == ELECTION.states['READY_TO_TALLY']) {
            $('#viewVotersTabButton').show();
            $('#viewVotesTabButton').show();
            $('#tallyTabButton').show();
        }

        ELECTION.updateDescription(state);
        return state;
    }

    ADMIN.askForPasscode = function() {
        modal.open();
    }

    ADMIN.endVotingPhase = function() {
        var endable = ELECTION.contract.endVotingPhase.call();

        if(endable) {
            var txHash = ELECTION.contract.endVotingPhase.sendTransaction({from:ELECTION.owner, gas:4200000});
            ADMIN.changingContractState(txHash);
        }
    } 

    ADMIN.tallyVotes = function() {
        var results = ELECTION.tallyResults();
        $('#electionResults').html('');

        results.forEach(function(obj, i) {
            var line = '<tr><td>' + (i+1) +'</td><td>' + obj.toString(10) +'</td> </tr>';

            $('#electionResults').append(line);
        });
    }

}( window.ADMIN = window.ADMIN || {}, jQuery ));

$(document).ready(function() {
    ELECTION.hideTabs(ADMIN.tabs);
    
    if(web3.eth.accounts.includes(ELECTION.owner)) {
        ADMIN.askForPasscode();
    }
    else{
        $('#electionDescription').html('Your geth instance does not have an administrator key.');
    }

    $("#passcode").on('keydown', function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            ADMIN.verifyPasscode();
        }
    });

    $('#finishVotingPhaseButton').on('click', function() {
        ADMIN.endVotingPhase();
    });

    $('#tallyTabButton').on('click', function() {
        ADMIN.tallyVotes();
    });
});






