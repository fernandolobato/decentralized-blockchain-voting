import sha3
import functools

def h(msg, hashfunc=sha3.keccak_256):
    return '0x'+ hashfunc(msg.encode('utf-8')).hexdigest()

def h1(msg, hashfunc=sha3.keccak_256):
    return '0x' + hashfunc(msg.to_bytes(32, 'big')).hexdigest()

def h2(msg, hashfunc=sha3.keccak_256):
    return '0x' + hashfunc(msg).hexdigest()


def concat(params):
    return functools.reduce(lambda x, y: x + y, [ p.to_bytes(32, 'big') for p in params])

msg = [1]
a = concat(msg)
b = h2(a)

print(int(b,16))