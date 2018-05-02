#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# error function is used within a bash function in order to send the error
# message directly to the stderr output and exit.
error() {
    echo "$1" > /dev/stderr
    exit 0
}

# return is used within bash function in order to return the value.
return() {
    echo "$1"
}

geth --datadir /home/geth/ init /home/geth/genesis.json

exec geth \
    --datadir /home/geth/ \
    --rpc \
    --rpcapi="db,eth,net,web3,personal,miner,admin" \
    --rpcport "8545" \
    --rpcaddr "0.0.0.0" \
    --rpccorsdomain "*" \
    --nat "any"
