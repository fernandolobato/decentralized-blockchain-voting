#! /usr/bin/env python
import argparse
import sys
import os

from ecc_linkable_ring_signatures.linkable_ring_signature import ring_signature, verify_ring_signature, H1
from ecc_linkable_ring_signatures.linkable_ring_signature import export_signature, export_signature_javascript

from ecdsa.util import randrange
from ecdsa.curves import SECP256k1
from ecdsa.ecdsa import curve_secp256k1
from ecdsa.ellipticcurve import Point

def pointify(pk):
    return Point(curve_secp256k1, int(pk[0]), int(pk[1]))


def encrypt(pub_key, message, G=SECP256k1.generator, O=SECP256k1.order):
    k = randrange(O)
    
    P = k * G
    H = k * pub_key

    c = message * H.y() % O

    return (P, c)

def main():
    parser = argparse.ArgumentParser(description='Linakble Ring Signature Voting Tool')

    voting_group = parser.add_argument_group(title='Vote')

    home = os.path.expanduser("~")
    ring_path = os.path.join(home, 'Downloads', 'my_ring.csv')
    threshold_path = os.path.join(home, 'Downloads', 'thresholdKey.csv')

    voting_group.add_argument(
        '--ring',
        default=ring_path,
        type=str,
        metavar='RING',
        help='Path to csv file with public keys over which to compute signature')

    voting_group.add_argument(
        '--seckey',
        default=None,
        type=str,
        metavar='SK',
        help='Path to file with secret key corresponding to one of the public keys to perform signature')

    voting_group.add_argument(
        '--thkey',
        default=threshold_path,
        type=str,
        metavar='THKEY',
        help='Path to csv file with threshold key to generate vote')

    voting_group.add_argument(
        '--vote',
        default=None,
        type=int,
        metavar='VOTE',
        help='Integer representation of voting option to encrypt and sign')


    voting_group.add_argument(
        '--exp',
        default=os.path.join('.', 'my_sig.txt'),
        type=str,
        metavar='VOTE',
        help='Path of file to export signature too.')

    key_gen_group = parser.add_argument_group(title='Key Generation')

    key_gen_group.add_argument(
        '--keygen',
        default=os.path.join('.', 'priv_key.txt'),
        type=str,
        metavar='KEYGEN',
        help='Generate a new private key and save to file [Default: ./priv_key.txt]')

    args = parser.parse_args()

    if args.ring and args.seckey and args.thkey and args.vote:
        
        ring = [ pointify(pk[:-1].split(',')) for pk in open(args.ring, 'r').readlines()]

        thresholdKey = pointify(open(args.thkey, 'r').readlines()[0][:-1].split(','))

        v = encrypt(thresholdKey, args.vote)

        vote = [v[0].x(), v[0].y(), v[1]]

        seckey = int(open(args.seckey, 'r').readlines()[0][:-1])

        j = 0
        
        for i,pk in enumerate(ring):
            if SECP256k1.generator * seckey == pk:
                j = i

        sig = ring_signature(seckey, j, H1(vote), ring)
        assert(verify_ring_signature(H1(vote), ring, *sig))

        export_signature(ring, vote, sig, '.', args.exp)

    elif args.keygen:
        s_key = randrange(SECP256k1.order)
        open(args.keygen, 'w').write(str(s_key) + '\n')
        print('Key Generated : {}'.format(s_key))
    else:
        print('Wrong usage, run: {} --help'.format(sys.argv[0]))



if __name__ == '__main__':
    main()