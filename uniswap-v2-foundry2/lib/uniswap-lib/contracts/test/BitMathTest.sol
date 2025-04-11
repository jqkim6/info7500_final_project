// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.5.0;

import '../libraries/BitMath.sol';

contract BitMathTest {
    function mostSignificantBit(uint256 x) external view returns (uint8 r) {
        return BitMath.mostSignificantBit(x);
    }
}
