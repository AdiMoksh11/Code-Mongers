// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Credexa} from "../src/Credexa.sol";

/**
 * @title DeployCredexa
 * @dev Deploys the Credexa contract. In production, use run().
 *      In tests, use runWithKey(uint256) to inject a fake private key.
 */
contract DeployCredexa is Script {
    function run() external returns (Credexa) {
        // Default broadcast (for production)
        vm.startBroadcast();
        Credexa credexa = new Credexa();
        vm.stopBroadcast();
        return credexa;
    }

    /// @notice Special variant for tests where we control the private key
    function runWithKey(uint256 privateKey) external returns (Credexa) {
        vm.startBroadcast(privateKey);
        Credexa credexa = new Credexa();
        vm.stopBroadcast();
        return credexa;
    }
}
