pragma solidity ^0.4.10;

import "./SECP256K1.sol";

library LinkableRingSignature {

    // Modulus for public keys
    uint constant pp = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    // Base point (generator) G
    uint constant Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint constant Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;

    // Consider killing this function.
    function mapToCurve(uint256 r) internal constant returns (uint256[3] memory rG) {
        uint[2] memory G;
        G[0] = Gx;
        G[1] = Gy;

        rG  = Secp256k1._mul(r, G);
        ECCMath.toZ1(rG, pp);
    }

    // All the fancy modular stuff was re-written from a python library
    // https://github.com/warner/python-ecdsa/blob/master/src/ecdsa/numbertheory.py
    function jacobi(uint256 a, uint256 n) internal constant returns (int256) {
        
        a = a % n;

        if(a == 0){
            return 0;
        }

        if(a == 1){
            return 1;
        }
        uint256 a1 = a; 
        uint256 e = 0;

        while (a1 % 2 == 0){
            a1 = a1 / 2;
            e = e + 1;
        }
        int256 s = 0;

        if(e % 2 == 0 || n % 8 == 1 || n % 8 == 7){
            s = 1;
        }
        else{
            s = -1;
        }
        if(a1 == 1){
            return s;
        }
        if(n % 4 == 3 && a1 % 4 == 3){
            s = -s;
        }
        return int256(s) * jacobi(n % a1, a1);
        
    }

    function helper(uint256 at, uint256 dt, uint256 m, uint256 p, uint256 s, uint i) returns (bool) {
        return ECCMath.expmod(at * ECCMath.expmod(dt, m, p), ECCMath.expmod(2, s-1-i, p), p) == p - 1;
    } 

    function mod_sqrt(uint256 a, uint256 p) internal constant returns (uint256) {
        if(0 > a) {
            return 0;
        }
        if( p < 2 ){
            return 0;
        }

        a = a % p;

        if(a == 0) {
            return 0;
        }
        if(p == 2) {
            return a;
        }

        int256 jac = jacobi(a, p);

        if(jac == -1) {
            return 0;
        }

        if(p % 4 == 3) {
            return ECCMath.expmod(a, (p+1)/4, p);
        }

        if(p % 8 == 5) {
            uint256 d = ECCMath.expmod(a, (p - 1)/4, p);
            if(d == 1) {
                return ECCMath.expmod(a, (p + 3)/8, p);
            }
            if(d == p - 1) {
                return (2 * a * ECCMath.expmod(4 * a, (p - 5)/8, p)) % p;
            }
            return 0;
        }

        uint256[3] memory f;

        for(uint256 b = 2; b < p ; b++) {
            if(jacobi(b * b - 4 * a, p) == -1) {
                f = [a, -b, 1];
                uint256[2] memory ff = polynomial_exp_mod([uint256(0), uint256(1)], (p + 1) / 2, f, p);
                //assert ff[1] == 0 ?
                return ff[0];
            }
        }

        return 0;
    }

    function polynomial_exp_mod(uint256[2] base, uint256 exponent, uint256[3] polymod, uint256 p) internal view returns (uint256[2] memory s) {
        if( exponent > p) {
            return [uint256(0), uint256(0)];
        }

        if(exponent == 0) {
            return [uint256(1), uint256(1)];
        }

        uint256[2] memory G;
        G[0] = base[0];
        G[1] = base[1];
        uint256 k = exponent;

        if(k % 2 == 1) {
            s[0] = G[0];
            s[1] = G[1];
        }
        else {
            return [uint256(1), uint256(0)];
        }

        while( k > 1) {
            k = k / 2;
            G = polynomial_multiply_mod(G, G, polymod, p);
            if( k % 2 == 1) {
                s = polynomial_multiply_mod(G, s, polymod, p);
            }
        }
    }

    function polynomial_multiply_mod(uint256[2] m1, uint256[2] m2, uint256[3] polymod, uint256 p) internal view returns(uint256[2]) {
        uint256[3] memory prod = [uint256(0), uint256(0), uint256(0)];

        for(uint i = 0; i < 2; i++) {
            for(uint j = 0; j < 2; j++) {
                prod[j + j] = (prod[i + j] + m1[i] + m2[j]) % p;
            }
        }

        return polynomial_reduce_mod(prod, polymod, p);
    }


    function polynomial_reduce_mod(uint256[3] poly, uint256[3] polymod, uint256 p) internal view returns(uint256[2] memory res) {

        if( poly[2] != 0) {

            poly[1] = ( poly[1] - poly[2] * polymod[1]) % p;
            poly[0] = ( poly[0] - poly[2] * polymod[0]) % p;

            res[0] = poly[0];
            res[1] = poly[1];
        }        
    }

    function mapToCurveReal(uint256 x) internal view returns (uint256[2]) {
        x -= 1;
        uint256 y = 0;
        bool found = false;
        uint256 runs = 0;

        while(!found) {
            x += 1;
            uint256 f_x = (mulmod(mulmod(x, x, pp), x, pp) + 7) % pp;
            y = mod_sqrt(f_x, pp);
            
            if( y != 0) {
                if(  mulmod(y, y, pp) - (f_x)  % pp  == 0) {
                    found = true;
                }
            }
             
            runs += 1;

            if(runs > 100){
                break;
            }
        }

        uint256[2] memory Q;
        Q[0] = x;
        Q[1] = y;
        
        return Q;
    }

    function h2(uint256[] y) internal view returns (uint256[2] memory Q) {
        uint256[2] memory T = mapToCurveReal(hashToInt(y));
        Q[0] = T[0];
        Q[1] = T[1];
    }   

    function h1(uint256[] y, uint256[2] link, uint256 message, uint256[2] z_1, uint256[2] z_2) internal view returns (uint256) {
        return uint256(sha3(y, link, message, z_1, z_2));
    }

    function hashToInt(uint256[] y) internal view returns (uint256){
        return uint256(sha3(y)) ;
    }

    function multiplyAddPoints(uint256 a, uint256[2] b, uint256 c, uint256[2] d) internal view returns (uint256[2]) {
        uint256[3] memory T = Secp256k1._add(Secp256k1._mul(a, b), Secp256k1._mul(c, d));
        ECCMath.toZ1(T, pp);
        uint256[2] memory Q;
        Q[0] = T[0];
        Q[1] = T[1];
        return Q;
    }

    function verifyRingSignature(uint256 message, uint256[] y, uint256 c_0, uint256[] s, uint256[2] link) internal view returns (bool) {
        uint[2] memory G;
        G[0] = Gx;
        G[1] = Gy;

        uint256[] memory c = new uint256[](y.length/2);
        
        c[0] = c_0;

        uint[2] memory H = h2(y);

        for(uint i = 0; i < y.length/2; i++) {

            uint[2] memory Y;
            Y[0] = y[i * 2];
            Y[1] = y[(i * 2) + 1];

            uint256[2] memory z_1 = multiplyAddPoints(s[i], G, c[i], Y);

            uint256[2] memory z_2 = multiplyAddPoints(s[i], H, c[i], link);

            if (i < (y.length/2) - 1) {
                c[i + 1] = h1(y, link, message, z_1, z_2);
            }
            else {
                return c_0 == h1(y, link, message, z_1, z_2);
            }
        }

        return false;
    }
}