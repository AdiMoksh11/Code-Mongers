// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DeployCredexa} from "../script/DeployCredexa.s.sol";
import {Credexa} from "../src/Credexa.sol";

contract DeployCredexaTest is Test {
    DeployCredexa public deployScript;

    function setUp() public {
        deployScript = new DeployCredexa();
    }

    function test_ScriptDeploysContractAndSetsOwner() public {
        // Create a fake private key & derive its address
        uint256 fakeKey = 0xA11CE;
        address expectedOwner = vm.addr(fakeKey);

        // Deploy using the injected key
        Credexa credexa = deployScript.runWithKey(fakeKey);

        // Assertions
        assertNotEq(address(credexa), address(0));
        assertEq(credexa.owner(), expectedOwner);
    }
}
