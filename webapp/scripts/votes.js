if(ELECTION === undefined) {
    throw 'Election library is not defined';
}

function getVotes() {
    var numVotes = ELECTION.contract.getNumberCastedVotes.call();

    $('#registeredVotesTable').html('');

    for(var i = 0; i < numVotes; i++) {

        var Px = ELECTION.contract.encryptedVotes(i, 0);
        var Py = ELECTION.contract.encryptedVotes(i, 1);
        var c = ELECTION.contract.encryptedVotes(i, 2);
        var v = '<tr><td>(' + Px.toString(10) + ',' + Py.toString(10) + ')</td>';
        v +='<td>' + c.toString(10) + '</td></tr>';
        
        $('#registeredVotesTable').append(v);
    }
}

function getRegisteredVoters() {
    var numRegisteredVoters = ELECTION.contract.getNumRegisterVoters.call();
    
    $("#registeredPublicKeyTable").html('');

    for(var i = 0; i < numRegisteredVoters; i++) {
        var vX = ELECTION.contract.voters.call(i, 0);
        var vY = ELECTION.contract.voters.call(i, 1);

        var pk = '<tr><td>(' + vX.toString(10) + ',<br>' + vY.toString(10) + ')</td><td>0</td><td>' + i + '</td></tr>';
        $('#registeredPublicKeyTable').append(pk);
    }
}

$(document).ready(function() {

    $('#viewVotersButton').on('click', function() {
        getRegisteredVoters();
    });

    $('#viewVotesTabButton').on('click', function() {
        getVotes();
    })

});