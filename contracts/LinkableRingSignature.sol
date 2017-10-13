pragma solidity ^0.4.10;

import "./SECP256k1.sol";

library LinkableRingSignature {

    // Modulus for public keys
    uint constant pp = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    // Base point (generator) G
    uint constant Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint constant Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;

    // Modulus for private keys (sub-group)
    uint constant nn = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    function mapToCurve(uint256 r) internal constant returns (uint256[3] memory rG) {
        uint[2] memory G;
        G[0] = Gx;
        G[1] = Gy;

        rG  = Secp256k1._mul(r, G);
        ECCMath.toZ1(rG, pp);
   }

    function h2(uint256[] y) internal constant  returns (uint256[2] memory Q) {
        uint256[3] memory T = mapToCurve(hashToInt(y));
        Q[0] = T[0];
        Q[1] = T[1];
    }   

    function h1(uint256[] y, uint256[2] link, string message, uint256[2] z_1, uint256[2] z_2) internal constant  returns (uint256) {
        return uint256(sha3(y, link, message, z_1, z_2));
    }

    function hashToInt(uint256[] y) internal constant  returns (uint256){
        return uint256(sha3(y)) ;
    }

    function multiplyAddPoints(uint256 a, uint256[2] b, uint256 c, uint256[2] d) internal constant  returns (uint256[2]) {
        uint256[3] memory T = Secp256k1._add(Secp256k1._mul(a, b), Secp256k1._mul(c, d));
        ECCMath.toZ1(T, pp);
        uint256[2] memory Q;
        Q[0] = T[0];
        Q[1] = T[1];
        return Q;
    }

    function verifyRingSignature(string message, uint256[] y, uint256 c_0, uint256[] s, uint256[2] link) internal constant  returns (bool) {
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

            // Calculate Z_1
            uint256[2] memory z_1 = multiplyAddPoints(s[i], G, c[i], Y);

            // Calculate Z_2
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