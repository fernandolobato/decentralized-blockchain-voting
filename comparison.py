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

msg = [43968933545375136198836234753203499091996196898240806929131239879284863692170, 75946476920109448047590099234176065743441942249000920162478607946457873838618]
a = concat(msg)
b = h2(a)

print(b)
# print(int(b,16))