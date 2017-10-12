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

    enum State { SETUP, REGISTRATION, VOTE, FINISHED, READY_TO_TALLY }
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
    mapping(uint => uint256[]) public rings;
    mapping(bytes32 => uint) public hashRingToIdx;

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
    mapping(bytes32 => uint) registeredVoteLink;

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

    // TODO: Everything
    function registerVoter() inState(State.REGISTRATION) onlyOwner returns (bool){
        
        if(block.timestamp > registrationEndTime) {
            throw; // throw returns the voter's ether, but exhausts their gas.
        }

        return true;
    }

    function verifyRingSignature(string message, uint256[] y, uint256 c_0, uint256[] s, uint256[2] link) constant returns (bool) {
        return LinkableRingSignature.verifyRingSignature(message, y, c_0, s, link);
    }

}