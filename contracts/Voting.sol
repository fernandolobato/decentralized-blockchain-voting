pragma solidity ^0.4.10;

import "./SECP256k1.sol";
import "./LinkableRingSignature.sol";
import "./Owned.sol";

contract Voting is owned{

    uint constant pp = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    // Base point (generator) G
    uint constant Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint constant Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;

    // Order of G
    uint constant nn = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    enum State { SETUP, REGISTRATION, VOTING, FINISHED, READY_TO_TALLY }
    State public state;

    modifier inState(State s) {
        if(state != s) {
            throw;
        }
        _;
    }

    bool public debug = false;

    /****************************************
                    SETUP DATA
    /****************************************/
    uint public constant maxNumberVotersPerRing = 500;
    uint public numVoterPerRing;

    uint public registrationStartTime;
    uint public registrationEndTime;
    uint public registrationVotingGap;
    uint public votingStartTime;
    uint public votingEndTime;

    uint public numberOfVotingOptions;

    uint public tParties;
    uint public nParties;

    uint public minimumPhaseTime = 10;

    // Parameters for threshold cryptosystem.
    uint256[2][] public secretShareVerifyPublicParams;
    mapping(uint256 => bool) public registeredSubSecrets;
    uint256[] public secretShare;
    uint256[2] public thresholdKey;
    uint256 public reconstructedKey = 0;
    /****************************************
                END SETUP DATA
    /****************************************/


    /****************************************
                REGISTRATION DATA
    /****************************************/
    uint public currentRingIdx; 
    mapping(uint => uint256[]) public ring;

    uint256[2][] public voters;
    mapping(uint256 => uint) public hashRingToIdx;
    mapping(bytes32 => bool) public registeredKeys;
    mapping(bytes32 => uint) public hashKeyToRingIdx;
    /****************************************
             END REGISTRATION DATA
    /****************************************/


    /****************************************
                    VOTE DATA
    /****************************************/
    uint256[3][] public encryptedVotes;
    mapping(bytes32 => uint) public registeredVoteLink;
    /****************************************
                  END VOTE DATA
    /****************************************/


    function Voting() {
        state = State.SETUP;
        currentRingIdx = 1;
    }

    // @dev Sets a contract to debug mode so election times can be ignored.
    // Can only be called by owner.
    function setDebug() inState(State.SETUP) onlyOwner() {
        debug = true;
    }

    function finishSetUp(
        uint _numVoterPerRing,
        uint _registrationStartTime,
        uint _registrationEndTime,
        uint _registrationVotingGap,
        uint _votingStartTime,
        uint _votingEndTime,
        uint _numberOfVotingOptions,
        uint _tParties,
        uint _nParties,
        uint256[2][] _secretShareVerifyPublicParams,
        uint256[2] _thresholdKey) inState(State.SETUP) onlyOwner() returns (bool) {

        if(_numVoterPerRing > maxNumberVotersPerRing) {
            return false;
        }

        if(_registrationStartTime < block.timestamp) {
            return false;
        }

        if(_registrationStartTime + minimumPhaseTime > _registrationEndTime){
            return false;
        }   

        if(_registrationEndTime > _votingStartTime ||
            _registrationEndTime + _registrationVotingGap >_votingStartTime ||
            _votingStartTime + minimumPhaseTime > _votingEndTime) {
            return false;
        }

        if(Secp256k1.isPubKey(_thresholdKey) == false) {
            return false;
        }

        for(uint i = 0; i < _secretShareVerifyPublicParams.length; i++) {
            if(Secp256k1.isPubKey(_secretShareVerifyPublicParams[i]) == false) {
                return false;
            }
        }

        if( _tParties != _secretShareVerifyPublicParams.length) {
            return false;
        }

        if(_numberOfVotingOptions < 2) {
            return false;
        }

        numberOfVotingOptions = _numberOfVotingOptions;

        numVoterPerRing = _numVoterPerRing;
        registrationStartTime = _registrationStartTime;
        registrationEndTime = _registrationEndTime;
        votingStartTime = _votingStartTime;
        votingEndTime = _votingEndTime;

        tParties = _tParties;
        nParties = _nParties;

        for(i = 0; i < nParties; i++) {
            secretShare.push(0);
        }

        secretShareVerifyPublicParams = _secretShareVerifyPublicParams;
        thresholdKey = _thresholdKey;
        state = State.REGISTRATION;
        
        return true;
    }


    function registerVoter(uint256[2] publicKey) inState(State.REGISTRATION) onlyOwner returns (bool){
        
        if(block.timestamp > registrationEndTime + registrationVotingGap) {
            state = State.VOTING;
            return false;
        }

        if(block.timestamp > registrationEndTime) {
            return false;
        }

        if(Secp256k1.isPubKey(publicKey) == false) {
            return false;
        }

        if(registeredKeys[sha3(publicKey)]) {
            return false;
        }

        if(ring[currentRingIdx - 1].length / 2 == numVoterPerRing) {
            uint256 ringHash = LinkableRingSignature.hashToInt(ring[currentRingIdx - 1]);
            hashRingToIdx[ringHash] = currentRingIdx;
            currentRingIdx += 1;
        }

        ring[currentRingIdx - 1].push(publicKey[0]);
        ring[currentRingIdx - 1].push(publicKey[1]);
        voters.push([publicKey[0], publicKey[1]]);
        registeredKeys[sha3(publicKey)] = true;
        hashKeyToRingIdx[sha3(publicKey)] = currentRingIdx;

        if(ring[currentRingIdx - 1].length / 2 == numVoterPerRing) {
            uint256 closeringHash = LinkableRingSignature.hashToInt(ring[currentRingIdx - 1]);
            hashRingToIdx[closeringHash] = currentRingIdx;
            currentRingIdx += 1;
        }

        return true;
    }


    function endRegistrationPhase() inState(State.REGISTRATION) onlyOwner returns (bool) {

        if(!debug) {
            if(block.timestamp < registrationEndTime) {
                return false;
            }  
        }

        if(ring[currentRingIdx - 1].length / 2 < numVoterPerRing) {
            uint256 closeringHash = LinkableRingSignature.hashToInt(ring[currentRingIdx - 1]);
            hashRingToIdx[closeringHash] = currentRingIdx;
            currentRingIdx += 1;
        }

        state = State.VOTING;

        return true;
    }


    function endVotingPhase() inState(State.VOTING) onlyOwner returns (bool) {
        
        if(!debug) {
            if(block.timestamp < votingEndTime) {
                return false;
            }
        }

        state = State.FINISHED;

        return true;
    }


    function beginTallyPhase() inState(State.FINISHED) onlyOwner returns (bool) {

        if(secretShare.length != nParties) {
            return false;
        }

        for(uint i = 0; i < secretShare.length; i++) {
            if(secretShare[i] == 0) {
                return false;
            }
        }

        if(reconstructedKey == 0) {
            return false;
        }

        state = State.READY_TO_TALLY;

        return true;
    }

    
    function castVote(
        uint256[3] encryptedVote,
        uint256[] pubKeys,
        uint256 c_0,
        uint256[] signature,
        uint256[2] link) inState(State.VOTING) returns (bool){ 

        if(registeredVoteLink[sha3(link)] != 0) {
            return true;
        }

        uint256 ringHash = LinkableRingSignature.hashToInt(pubKeys);
        
        if( hashRingToIdx[ringHash] == 0) {
            return false;
        }
        
        if(LinkableRingSignature.verifyRingSignature(uint256(sha3(encryptedVote)), pubKeys, c_0, signature, link)) {
            
            encryptedVotes.push([encryptedVote[0], encryptedVote[1], encryptedVote[2]]);
            registeredVoteLink[sha3(link)] = encryptedVotes.length;

            return true;
        }

        return false;
    }

    function verifyRingSignature(uint256[3] message, uint256[] y, uint256 c_0, uint256[] s, uint256[2] link) constant returns (bool) {
        return LinkableRingSignature.verifyRingSignature(uint256(sha3(message)), y, c_0, s, link);
    }

    function publishSecretShares(uint idx, uint256 subSecret) inState(State.FINISHED) returns (bool) {
        
        if(!registeredSubSecrets[subSecret]) {

            if(verifySecretShare(idx, subSecret)){
                registeredSubSecrets[subSecret] = true;
                secretShare[idx] = subSecret;
                return true;
            }
        }
        return false;
    }


    function verifySecretShare(uint idx, uint256 subSecret) constant returns (bool) {

        uint[2] memory G;
        G[0] = Gx;
        G[1] = Gy;

        uint256[2] memory verify;

        verify[0] = secretShareVerifyPublicParams[0][0];
        verify[1] = secretShareVerifyPublicParams[0][1];

        for(uint j = 1; j < secretShareVerifyPublicParams.length; j++) {
            
            uint256[3] memory T = Secp256k1._addMixed(Secp256k1._mul( ((idx+1) ** j), secretShareVerifyPublicParams[j]), verify);
            ECCMath.toZ1(T, pp);

            verify[0] = T[0];
            verify[1] = T[1];
        }

        uint256[3] memory R = Secp256k1._mul(subSecret, G);
        ECCMath.toZ1(R, pp);

        if(R[0] == verify[0] && R[1] == verify[1]) {
            return true;
        }

        return false;
    }


    function publishReconstructedKey(uint256 rKey) inState(State.FINISHED) returns (bool) {

        if(reconstructedKey != 0) {
            return false;
        }

        uint256[2] memory G;
        G[0] = Gx;
        G[1] = Gy;
        uint256[3] memory Y = Secp256k1._mul(rKey, G);

        ECCMath.toZ1(Y, pp);

        if(Y[0] == thresholdKey[0] && Y[1] == thresholdKey[1]) {
            reconstructedKey = rKey;
            state = State.READY_TO_TALLY;
            return true;
        }

        return false;
    }


    function decryptVote(uint256[3] encryptedVote, uint256 secretKey) constant returns (uint) {
        uint256[2] memory P;
        P[0] = encryptedVote[0];
        P[1] = encryptedVote[1];

        uint256 c = encryptedVote[2];

        uint256[3] memory H = Secp256k1._mul(secretKey, P);
        ECCMath.toZ1(H, pp);

        uint message = mulmod(c, ECCMath.invmod(H[1], nn), nn);

        return message;
    }


    function tallyElection() inState(State.READY_TO_TALLY) constant returns (int[10]) {
        
        int[10] memory electionResults;

        for(uint i = 0; i < encryptedVotes.length; i++){
            uint vote = decryptVote(encryptedVotes[i], reconstructedKey);
            electionResults[vote] += 1;
        }

        return electionResults;
    }


    function getRingIdx(uint256[2] pubKey)constant returns (uint) {
        return hashKeyToRingIdx[sha3(pubKey)];
    }


    function getRingSize(uint ringIdx) constant returns (uint) {
        return ring[ringIdx].length;
    }
    

    function getNumberCastedVotes() constant returns (uint) {
        return encryptedVotes.length;
    }


    function getNumRegisterVoters() constant returns (uint) {
        return voters.length;
    }


    function numOfSecrets() constant returns (uint) {
        return secretShare.length;
    }
}