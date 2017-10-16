pragma solidity ^0.4.10;

import "./SECP256k1.sol";
import "./LinkableRingSignature.sol";
import "./Owned.sol";


contract Voting is owned{

    enum State { SETUP, REGISTRATION, VOTING, FINISHED, READY_TO_TALLY }
    State public state;

    modifier inState(State s) {
        if(state != s) {
            throw;
        }
        _;
    }

    /****************************************
                    SETUP DATA
    /****************************************/
    uint public constant maxNumberVotersPerRing = 500;
    uint public numVoterPerRing;

    
    // Required times for different phases of election.
    uint public registrationStartTime;
    uint public registrationEndTime;
    uint public registrationVotingGap;
    uint public votingStartTime;
    uint public votingEndTime;

    // This should probably be higher =)
    uint public minimumPhaseTime = 10;

    // Parameters for threshold cryptosystem.
    uint256[2][] public secretShareVerifyPublicParams;
    uint256[] public secretShare;
    uint256[2] public thresholdKey;

    /****************************************
                END SETUP DATA
    /****************************************/


    /****************************************
                REGISTRATION DATA
    /****************************************/

    uint public currentRingIdx; 
    mapping(uint => uint256[]) public ring;

    //This works the other way expected...
    uint256[2][] public voters;
    mapping(uint256 => uint) public hashRingToIdx;
    mapping(bytes32 => bool) public registeredKeys;

    /****************************************
             END REGISTRATION DATA
    /****************************************/


    /****************************************
                    VOTE DATA

    Would it be worthwhile creating a vote struct?
    we could store the signature for future verification?

    /****************************************/
    string[] public encryptedVotes;
    
    // Mapping to verify if anybody voter and where
    // their vote is stored.
    mapping(bytes32 => uint) public registeredVoteLink;

    /****************************************
                  END VOTE DATA
    /****************************************/


    function Voting() {
        state = State.SETUP;
        currentRingIdx = 0;
    }

    function finishSetUp(
        uint _numVoterPerRing,
        uint _registrationStartTime,
        uint _registrationEndTime,
        uint _registrationVotingGap,
        uint _votingStartTime,
        uint _votingEndTime,
        uint256[2][] _secretShareVerifyPublicParams,
        uint256[2] _thresholdKey) inState(State.SETUP) onlyOwner returns (bool) {

        if(_numVoterPerRing > maxNumberVotersPerRing) {
            return false;
        }

        if(_registrationStartTime < block.timestamp) {
            return false;
        }

        if(_registrationStartTime + minimumPhaseTime > _registrationEndTime){
            return false;
        }   

        // Missing a test for this.
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

        numVoterPerRing = _numVoterPerRing;
        registrationStartTime = _registrationStartTime;
        registrationEndTime = _registrationEndTime;
        votingStartTime = _votingStartTime;
        votingEndTime = _votingEndTime;

        secretShareVerifyPublicParams = _secretShareVerifyPublicParams;
        thresholdKey = _thresholdKey;
        state = State.REGISTRATION;
        
        return true;
    }

    // TODO: Test Case for multiple rings
    function registerVoter(uint256[2] publicKey) inState(State.REGISTRATION) onlyOwner returns (bool){
        
        // Voter registration period already over.
        // TODO: Pass to next phase??
        if(block.timestamp > registrationEndTime) {
            return false;
        }

        if(Secp256k1.isPubKey(publicKey) == false) {
            return false;
        }

        if(registeredKeys[sha3(publicKey)]) {
            return false;
        }

        //Ring just filled up.
        if(ring[currentRingIdx].length / 2 == numVoterPerRing) {
            uint256 ringHash = LinkableRingSignature.hashToInt(ring[currentRingIdx]);
            hashRingToIdx[ringHash] = currentRingIdx;
            currentRingIdx += 1;
        }

        ring[currentRingIdx].push(publicKey[0]);
        ring[currentRingIdx].push(publicKey[1]);
        voters.push([publicKey[0], publicKey[1]]);
        registeredKeys[sha3(publicKey)] = true;

        //Last one hit the lights.
        if(ring[currentRingIdx].length / 2 == numVoterPerRing) {
            uint256 closeringHash = LinkableRingSignature.hashToInt(ring[currentRingIdx]);
            hashRingToIdx[closeringHash] = currentRingIdx;
            currentRingIdx += 1;
        }

        return true;
    }

    function endRegistrationPhase() inState(State.VOTING) onlyOwner returns (bool) {

        if(block.timestamp < registrationEndTime) {
            return false;
        }

        state = State.VOTING;

        return true;
    }


    function castVote(
        string encryptedVote,
        uint256[] pubKeys,
        uint256 c_0,
        uint256[] signature,
        uint256[2] link) returns (bool){
        
        // This link has already been submited.
        if(registeredVoteLink[sha3(link)] != 0) {
            return false;
        }
        
        // Ring sig is valid =)
        if(LinkableRingSignature.verifyRingSignature(encryptedVote, pubKeys, c_0, signature, link)) {
            
            encryptedVotes.push(encryptedVote);
            registeredVoteLink[sha3(link)] = encryptedVotes.length;
            return true;
        }

        return false;
    }


    function getNumRegisterVoters() constant returns (uint) {
        return voters.length;
    }
}