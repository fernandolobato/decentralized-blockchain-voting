import random
import sys
import os

from ecc_linkable_ring_signatures.linkable_ring_signature import ring_signature, verify_ring_signature, H1
from ecc_linkable_ring_signatures.linkable_ring_signature import export_signature, export_signature_javascript

from ecc_linkable_ring_signatures.ecdsa.util import randrange
from ecc_linkable_ring_signatures.ecdsa.curves import SECP256k1
from ecc_linkable_ring_signatures.ecdsa.ecdsa import curve_secp256k1
from ecc_linkable_ring_signatures.ecdsa.ellipticcurve import Point

OUTPUT_FOLDER =  os.path.join('.', 'tests' , 'test_data',)

def encrypt(pub_key, message, G=SECP256k1.generator, O=SECP256k1.order):
    k = randrange(O)
    
    P = k * G
    H = k * pub_key

    c = message * H.y() % O

    return (P, c)


def import_private_keys(path=os.path.join(OUTPUT_FOLDER, 'private_keys.txt')):
    return [int(k[:-1]) for k in open(path, 'r').readlines()]


def import_master_public_key(path=os.path.join(OUTPUT_FOLDER, 'threshold' , 'public.csv')):
    k = open(path, 'r').read().split('\n')[0].split(',')
    return Point(curve_secp256k1, int(k[0]), int(k[1]))

def cast_vote(m_pk):
    v = encrypt(m_pk, random.randint(1, 3))

    return [v[0].x(), v[0].y(), v[1]]


def main():
    m_pk =import_master_public_key()
    
    ring_size = 5
    s_keys = import_private_keys()
    p_keys = list(map(lambda x: x * SECP256k1.generator, s_keys))

    numRings = int(len(s_keys) / ring_size)

    s_rings = [ s_keys[i * ring_size:(i + 1) * ring_size] for i in range(numRings)]
    p_rings = [ p_keys[i * ring_size:(i + 1) * ring_size] for i in range(numRings)]

    # for i in range(numRings): assert(len(s_rings[i]) == ring_size)

    signatures = [None] * len(s_keys)
    
    """
        Votes need to be encrypted.
    """
    votes = [ cast_vote(m_pk) for i in range(len(s_keys))]
    
    k = 0
    for i in range(numRings):
        for j in range(ring_size):
            signatures[k] = ring_signature(s_rings[i][j], j, H1(votes[k]), p_rings[i])
            
            if i == 0 and j == 0:
                assert(verify_ring_signature(H1(votes[k]), p_rings[i], *signatures[k]))
            
            file_name = 'signature_{}.txt'.format(k)
            file_name_js = 'signature_{}.js'.format(k)
            
            export_signature(p_rings[i], votes[k], signatures[k], './elections/signatures/', file_name)
            export_signature_javascript(p_rings[i], votes[k], signatures[k], './elections/signatures/', file_name_js)
            
            k += 1
            print('Generating Signature: {}'.format(k))


if __name__ == '__main__':
    main()

