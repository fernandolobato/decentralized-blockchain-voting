(function( REGISTRATION, $, undefined ) {

    var registrationConfirmationModal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: ['escape', 'button', 'overlay'],
        closeLabel: "Close",
        cssClass: ['custom-class-1', 'custom-class-2']
    });

    REGISTRATION.registerVoter = function() {
        var pubKeyX = new BigNumber($('#pubKeyToRegisterX').val());
        var pubKeyY = new BigNumber($('#pubKeyToRegisterY').val());

        var pubKey = [pubKeyX, pubKeyY];

        var registeredKeys = ELECTION.contract.registerVoter.call(pubKey);
        
        if(registeredKeys) {
            web3.personal.unlockAccount(ELECTION.owner, ADMIN.passcode);
            var txHash = ELECTION.contract.registerVoter.sendTransaction(pubKey, {from:ELECTION.owner, gas:4200000});
            $('.close').click();
           
            registrationConfirmationModal.setContent('<p id="registrationConfirmationText"> Key registered with transaction: ' + txHash + '</p>');
            registrationConfirmationModal.open();
            $('#pubKeyToRegisterY').val('');
            $('#pubKeyToRegisterX').val('');
        }
        else{
            $('#pubKeyToRegisterY').val('');
            $('#pubKeyToRegisterX').val('');
        }   
    }

    REGISTRATION.endRegistration = function() {
        var txHash = ELECTION.contract.endRegistrationPhase.sendTransaction({from:ELECTION.owner, gas:4200000});
        ADMIN.changingContractState(txHash);
    }


}( window.REGISTRATION = window.REGISTRATION || {}, jQuery ));


$(document).ready(function() {
    
    $('#registerVoter').on('click', function(event) {
        event.preventDefault();
        REGISTRATION.registerVoter();
    });

    $('#endRegistration').on('click', function(event){
        REGISTRATION.endRegistration();
    })
});