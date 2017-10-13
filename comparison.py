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

msg = [67235805167425861068089906426919154027038855607351758310384798001184755494578, 81841085106827978484619575410326988922534763137673026675078713210806441367876]
a = concat(msg)
b = h2(a)

print(int(b,16))