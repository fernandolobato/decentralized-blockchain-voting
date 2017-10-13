pragma solidity ^0.4.10;

import "./SECP256k1.sol";
import "./LinkableRingSignature.sol";

contract owned {
    address public owner;

    /* Initialise contract creator as owner */
    function owned() {
        owner = msg.sender;
    }

    /* Function to dictate that only the designated owner can call a function */
    modifier onlyOwner {
        if(owner != msg.sender) throw;
        _;
    }

    /* Transfer ownership of this contract to someone else */
    function transferOwnership(address newOwner) onlyOwner() {
        owner = newOwner;
    }
}

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
    uint256[] public secretShareVerifyPublicParams;
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
    bytes32[] public encryptedVotes;
    
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
        uint256[] _secretShareVerifyPublicParams,
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

        if(_registrationEndTime > _votingStartTime ||
            _registrationEndTime + _registrationVotingGap >_votingStartTime ||
            _votingStartTime + minimumPhaseTime > _votingEndTime) {
            return false;
        }

        if(Secp256k1.isPubKey(_thresholdKey) == false) {
            return false;
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

    function castVote(string encryptedVote, uint256[] pubKeys, uint256 c_0, uint256[] signature, uint256[2] link) returns (bool){
        
        if(registeredVoteLink[sha3(link)] == 0) {
            //Check for the first poor bastard who actually voted with
            // idx cero.
            return false;
        }
        
        // Ring sig is valid =)
        if(LinkableRingSignature.verifyRingSignature(encryptedVote, pubKeys, c_0, signature, link)) {

        }

        return false;
    }

    function getNumRegisterVoters() constant returns (uint) {
        return voters.length;
    }

    function verifyRingSignature(string message, uint256[] y, uint256 c_0, uint256[] s, uint256[2] link) constant returns (bool) {
        return LinkableRingSignature.verifyRingSignature(message, y, c_0, s, link);
    }

    function mapToCurve(uint256 r) constant returns (uint256[3] memory rG) {
        return LinkableRingSignature.mapToCurve(r);
    }

    function h2(uint256[] y) constant  returns (uint256[2] memory Q) {
        return LinkableRingSignature.h2(y);
    }   

    function h1(uint256[] y, uint256[2] link, string message, uint256[2] z_1, uint256[2] z_2) constant  returns (uint256) {
        return LinkableRingSignature.h1(y, link, message, z_1, z_2);
    }

    function hashToInt(uint256[] y) constant  returns (uint256){
        return LinkableRingSignature.hashToInt(y);
    }

}