(function( VOTERS, $, undefined ) {

    VOTERS.tabs = ['viewElectionTabButton', 'downloadRingTabButton', 'castVoteTabButton', 'viewVotersTabButton', 'viewVotesTabButton', 'tallyTabButton'];
    VOTERS.vote = {}

    var account = null;
    var passcode = null;

    var modal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: [],
        closeLabel: "Close",
        cssClass: ['custom-class-1', 'custom-class-2']
    });

    var verifyPasscode = function() {
        var pass = $('#passcode').val();
        var acc = $('#accounts').val();

        setTimeout(function() {
            try {
                web3.personal.unlockAccount(acc, pass);
                modal.close()
                passcode = pass;
                account = acc;
            }
            catch(err) {
                $('#passcode').val('');
                alert('Could not unlock contract');
            } 
        }, 100);
    }

    modal.setContent('<div id="modalContent"> </div>');
    modal.addFooterBtn('Verify', 'tingle-btn--pull-right', verifyPasscode);
    $("#modalContent").append($('#modal').clone().css('display', 'table'));

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    VOTERS.currentState = function() {
        ELECTION.hideTabs(VOTERS.tabs);

        var state = ELECTION.contract.state.call();

        if(state == ELECTION.states['SETUP']) {
            $('#viewElectionTabButton').show();
        }

        if(state == ELECTION.states['REGISTRATION']) {
            $('#viewElectionTabButton').show();
            $('#viewVotersTabButton').show();
        }

        if(state == ELECTION.states['VOTING']) {
            $('#castVoteTabButton').show();
            $('#viewElectionTabButton').show();
            $('#viewVotersTabButton').show();
            $('#viewVotesTabButton').show();
            $('#downloadRingTabButton').show();
        }

        if(state == ELECTION.states['FINISHED']) {
            $('#viewElectionTabButton').show();
            $('#viewVotersTabButton').show();
            $('#viewVotesTabButton').show();
        }

        if(state == ELECTION.states['READY_TO_TALLY']) {
            $('#viewElectionTabButton').show();
            $('#viewVotersTabButton').show();
            $('#viewVotesTabButton').show();
            $('#tallyTabButton').show();
        }

        ELECTION.updateDescription();
    }

    VOTERS.downloadRing = function(pubKey) {
        var ringIdx = ELECTION.contract.getRingIdx.call(pubKey);
        
        if(ringIdx == 0) {
            alert('Could not find ring');
            return;
        }

        var ringSize = ELECTION.contract.getRingSize.call(ringIdx - 1);
        var ring = [];

        for(var i = 0 ; i < ringSize / 2; i++) {
            var pk_x = ELECTION.contract.ring.call(ringIdx - 1, i * 2);
            var pk_y = ELECTION.contract.ring.call(ringIdx - 1, i * 2 + 1);

            ring.push([pk_x.toString(10), pk_y.toString(10)]);
        }

        let csvContent = "data:text/csv;charset=utf-8,";

        ring.forEach(function(obj, i) {
            csvContent +=  obj.join(',') + "\r\n"; // add carriage return
        });

        
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "my_ring.csv");
        document.body.appendChild(link);
        link.click(); 
    }

    VOTERS.downloadThresholdKey = function() {
        let csvContent = "data:text/csv;charset=utf-8,";
        var thKey = [];

        thKey[0] = ELECTION.contract.thresholdKey.call(0).toString(10);
        thKey[1] = ELECTION.contract.thresholdKey.call(1).toString(10);

        csvContent +=  thKey.join(',') + "\r\n"; // add carriage return
        
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "thresholdKey.csv");
        document.body.appendChild(link);
        link.click(); 
    }

    VOTERS.parseVoteFile = function(event) {
        var input = event.target;

        var reader = new FileReader();
        
        
        reader.onload = function() {
            
            var lines = reader.result.split("\n");

            if(lines.length != 6){
                alert('Wrong file format');
                return false;
            }

            var C = new BigNumber(lines[0]);
            
            var S = [];
            var ring = lines[1].split(',');
            
            for(var i = 0; i < ring.length; i++) {
                S.push(new BigNumber(ring[i]));
            }

            var link = lines[2].split(',');
            link = [ new BigNumber(link[0]), new BigNumber(link[1])];

            var eVote = lines[3].split(',');
            eVote = [new BigNumber(eVote[0]), new BigNumber(eVote[1]), new BigNumber(eVote[2])];

            var pubKeysText = lines[4].split(';');
            var pubKeys = [];

            for(var i = 0; i < pubKeysText.length; i++) {
                var pk = pubKeysText[i].split(',');

                pubKeys.push(new BigNumber(pk[0]))
                pubKeys.push(new BigNumber(pk[1]));
            }

            VOTERS.vote['C'] = C;
            VOTERS.vote['S'] = S;
            VOTERS.vote['LINK'] = link;
            VOTERS.vote['MESSAGE'] = eVote;
            VOTERS.vote['PUBLIC_KEYS'] = pubKeys;
            $('#castVoteButton').removeAttr("disabled"); 
        }

        reader.readAsText(input.files[0]);
    }

    async function waitVoteMine(txHash) {
        ELECTION.hideTabs(VOTERS.tabs);
        
        $('#electionDescription').html('Vote submited with transaction ' + txHash);
        var tx = web3.eth.getTransaction(txHash);

        while(tx == null || tx.blockNumber == null) {
            await sleep(2000);
            var tx = web3.eth.getTransaction(txHash);
        }

        VOTERS.currentState();
    }

    VOTERS.castVote = function() {
        $('#castVoteButton').attr("disabled", "disabled");


        var validVote = ELECTION.contract.castVote.call(
            VOTERS.vote['MESSAGE'],
            VOTERS.vote['PUBLIC_KEYS'],
            VOTERS.vote['C'],
            VOTERS.vote['S'],
            VOTERS.vote['LINK']);

        if(validVote) {
            web3.personal.unlockAccount(account, passcode);
            
            var txHash = ELECTION.contract.castVote.sendTransaction(
                VOTERS.vote['MESSAGE'],
                VOTERS.vote['PUBLIC_KEYS'],
                VOTERS.vote['C'],
                VOTERS.vote['S'],
                VOTERS.vote['LINK'],
                {from:web3.eth.accounts[0], gas:8718922, gasPrice:10});
                $('.close').click();
                waitVoteMine(txHash);
        }
        else{
            alert('Invalid Vote =(');
            $('#voteFile').val('');
        }
    }

    VOTERS.tallyElection = function() {
        var results = ELECTION.tallyResults();
        $('#electionResults').html('');

        results.forEach(function(obj, i) {
            var line = '<tr><td>' + (i+1) +'</td><td>' + obj.toString(10) +'</td> </tr>';

            $('#electionResults').append(line);
        });
    }

    VOTERS.authenticateUser = function() {
        modal.open();

        web3.personal.listAccounts.forEach(function(obj, i){
            $('#accounts').append('<option value="'+ obj +'">'+ obj +'</option>');
        });
    }

    VOTERS.isAuthenticated = function() {
        return account && passcode;
    }

}( window.VOTERS = window.VOTERS || {}, jQuery ));

function loadElectionInfo() {

    var state = ELECTION.contract.state.call();

    if( state == ELECTION.states['SETUP']) {
        $('#electionInfo').html('<p>Election hasn\'t been set up.</p>');
        return;
    }

    var registartionStartTime = ELECTION.unixTimeToDate(ELECTION.contract.registrationStartTime.call());
    var registrationEndTime = ELECTION.unixTimeToDate(ELECTION.contract.registrationEndTime.call());

    var votingStartTime = ELECTION.unixTimeToDate(ELECTION.contract.votingStartTime.call());
    var votingEndTime = ELECTION.unixTimeToDate(ELECTION.contract.votingEndTime.call());

    var tParties = ELECTION.contract.tParties.call();

    var numVotersRing = ELECTION.contract.numVoterPerRing.call();
    var numVotingOptions = ELECTION.contract.numberOfVotingOptions.call();

    var thresholdKey = [0, 0];
    thresholdKey[0] = ELECTION.contract.thresholdKey.call(0);
    thresholdKey[1] = ELECTION.contract.thresholdKey.call(1);

    var publicParameters = [];

    for(var i = 0; i < tParties; i++) {

        var param = [0, 0];

        param[0] = ELECTION.contract.secretShareVerifyPublicParams.call(i, 0);
        param[1] = ELECTION.contract.secretShareVerifyPublicParams.call(i, 1);

        publicParameters.push(param);
    }
    var info = '<a onclick="VOTERS.downloadThresholdKey()"> Download Threshold Key </a>';

    info += '<p>Registration phase starts at: ' +  registartionStartTime + '</p>';
    info += '<p>Registration phase ends at: ' + registrationEndTime + '</p><br>';
    info += '<p>Voting phase starts at: ' + votingStartTime + '</p>';
    info += '<p>Voting phase ends at: ' + votingEndTime + '</p><br>';

    info += '<p>ThresholdKey: <br>' + thresholdKey[0].toString(10) + '<br>' + thresholdKey[1].toString(10) + '</p>';

    info += '<p>Number of Voters per Ring: ' + numVotersRing + '</p>';
    info += '<p>Number of Voting Options: ' + numVotingOptions + '</p>';

    info += '<p>Public Parameters </p>';

    for(var i = 0; i < publicParameters.length; i++) {
        info += '<p>' + publicParameters[i][0].toString(10) + '<br>';
        info += publicParameters[i][1].toString(10) + '</p>'

    }

    $('#electionInfo').html(info);
}

$(document).ready(function() {
    VOTERS.currentState();
    
    loadElectionInfo();

    $('#castVoteButton').attr("disabled", "disabled");

    $('#tallyTabButton').on('click', function() {
        VOTERS.tallyElection();
    });

    $('#castVoteTabButton').on('click', function(e) {
        if(!VOTERS.isAuthenticated()) {
            e.preventDefault();
            VOTERS.authenticateUser();
        }
    });

    $('#downloadRing').on('click', function(e) {
        e.preventDefault();
        var pk = [];
        pk[0] = new BigNumber($('#pubKeyX').val());
        pk[1] = new BigNumber($('#pubKeyY').val());
        VOTERS.downloadRing(pk);
    });

    $('#castVoteButton').on('click', function(e) {
        e.preventDefault();
        VOTERS.castVote(); 
    });
});