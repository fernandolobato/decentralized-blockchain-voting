# Decentralized Voting on the Ethereum Blockchain

This repo contains an implementation of a decentralized voting scheme on top of Ethereum in the form of a smart contract. The scheme uses linkable ring signatures and threshold cryptography to ensure voter privacy. For more information on the scheme works I wrote a paper available [here]().


## How does it work

The voting scheme is divided into the following phases after being deployed on the blockchain.

1. SETUP

    Election authority uploads all informatio nabout the election. Length of voting and registration periods, threshold key for voters to encypt their votes and the voting options. 
    

2. REGISTRATION
    
    At this phase any voter can go with the election authority and request his public key be included into the set of public keys elegible to vote. 
    
    
3. VOTING

    At this phase any previously registered voter and submit an encypted vote with the threshold key published in the contract with a ring signature of all the public keys registered in the sub ring.

4. FINISHED

    Once the voting phase is over all the third parties olding secrets can submit them to the blockchain. When all the secrets are in the contract, anybody can download and reconstruct the private key.
    

5. READY TO TALLY

    Anybody can tally the result of the ellection.


This repo contains:

- Solidity contracts to represent election.
- Python scripts to compile and deploy.
- Javascript files for testing.
- A small web application to run the election scheme.
- Python program for working with linkable ring signatures.
- Python program for working with threshold encryption.


## How do I run this?



It is important to have [geth](https://github.com/ethereum/go-ethereum/wiki/Installing-Geth) installed and the [solc](https://solidity.readthedocs.io/en/develop/installing-solidity.html) compiler if you wish to make changes to the contract. 

You can run this on the a private network or use [testrpc](https://github.com/ethereumjs/testrpc) for quick deployment.

It's a lot easier using the testrpc but running your own private networm might give you more insight into Ethereum.

To create your own private network you just need to define a genesis.json file in the directory where you want to run your private blockchain and run:

```bash
$ geth --datadir /PATH/TO/FOLDER/ init /PATH/TO/FOLDER/genesis.json
```
This is an example of a genesis.json file:
The account 0x33bfbdc0048f477810434707de9c13031abd47ca will be allocated sum funds.

```javascript
{
  "config": {
        "chainId": 10,
        "homesteadBlock": 0,
        "eip155Block": 0,
        "eip158Block": 0
    },
  "alloc"      : {
    "0x33bfbdc0048f477810434707de9c13031abd47ca": {
        "balance": "200000000000000000000"
    }
  },
  "coinbase"   : "0x0000000000000000000000000000000000000000",
  "difficulty" : "0x20000",
  "extraData"  : "",
  "gasLimit"   : "0x8000000",
  "nonce"      : "0x0000000000000042",
  "mixhash"    : "0x0000000000000000000000000000000000000000000000000000000000000000",
  "parentHash" : "0x0000000000000000000000000000000000000000000000000000000000000000",
  "timestamp"  : "0x00"
}
```


```bash
$ geth --datadir /PATH/TO/FOLDER/ init /PATH/TO/FOLDER/genesis.json
```

Now you are ready to run your private ethereum network:

```bash
$ geth --datadir /PATH/TO/FOLDER/ --nodiscover --rpc --rpcapi="db,eth,net,web3,personal,miner,admin" --rpcport "8545 --rpcaddr "0.0.0.0" --rpccordomain "*" --nat "any"
```

This will set up an ethereum client that takes rpc api connection on port 8545 and can be accessed by other computers on your network.

To access the geth console and begin to play with you blockchain you just need to run: 

```bash
$ geth attach http://YOUR.IP.ADDRESS.PLEASE:8545
```

If you wish to compile the contracts just run:

```bash
$ ./compile.py
```

It is a python script that uses solc to compile the contracts and places them in the bin folder.

This repo already contains a lot of scripts to deploy this project easily. Inside the deploy folder there is a deploy.js file, that file has a hardcoded string of where the project resides, change that, add that variable to the geth console and you can include that file into the console for easy deployment.

