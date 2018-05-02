#! /usr/bin/python

import os
import json
import subprocess
import argparse

CONTRACT_DIR = 'contracts/'
BUILD_DIR = 'build/'

def format_contract(contract, name):
    """ Formats contract JSON string output into python dict and
        removes special characters.
    """
    path = CONTRACT_DIR + name
    contract = json.loads(contract)

    remove_keys = []
    
    if 'contracts' not in contract : return

    for key,val in contract['contracts'].items():
        remove_keys.append(key)
        new_key = key[key.index(':')+1 : ]
        contract['contracts'][new_key] = {'abi': json.loads(val['abi']), 'bin': '0x' + val['bin']}

    for k in remove_keys:
        del contract['contracts'][k]

    return contract


def compile_using_solc(contract_file_name):
    """ Compiles contract using solc compiler and gets output as a JSON string.
    """
    contract_path = CONTRACT_DIR + contract_file_name

    command = 'solc --optimize --combined-json abi,bin,interface ' + contract_path
    result = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE).stdout.read().decode('utf-8')

    return result


def write_contract_file(contract, contract_name):
    """ Writes contract json definition to file
    """
    build_path = BUILD_DIR + contract_name + '.js'
    
    arch = open(build_path, 'w')
    
    # arch.write('var ' + contract_name + 'Contract = ' + json.dumps(contract, indent=4, sort_keys=True))
    arch.write('var compiledContractDefinition = ' + json.dumps(contract) + ';')

def main():
    parser = argparse.ArgumentParser(description="Compiler Helper")

    file_group = parser.add_argument_group(title="files")
    
    file_group.add_argument(
        '--ignore',
        default=[],
        metavar="I",
        help="File to ignore compilation.")

    args = parser.parse_args()

    contracts = os.listdir(CONTRACT_DIR)
    
    ignore = args.ignore

    for contract_file_name in contracts:
        if contract_file_name[-4:] == '.sol' and contract_file_name not in ignore:
            contract_json_string = compile_using_solc(contract_file_name)
            contract = format_contract(contract_json_string, contract_file_name)
            write_contract_file(contract, contract_file_name[:-4])   


if __name__ == "__main__":
    main()