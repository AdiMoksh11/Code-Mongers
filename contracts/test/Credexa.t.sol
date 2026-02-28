// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Credexa} from "../src/Credexa.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CredexaTest is Test {
    Credexa public credexa;
    address public owner = address(0x1);
    address public randomUser = address(0x2);

    function setUp() public {
        vm.prank(owner); // Set the next transaction's sender to be 'owner'
        credexa = new Credexa();
    }

    function test_OwnerCanAnchorCredential() public {
        bytes32 mockHash = keccak256("test_credential");

        vm.prank(owner);
        credexa.anchorCredential(mockHash);

        Credexa.Credential memory c = credexa.getCredential(mockHash);
        assertEq(c.credentialHash, mockHash);
        assertEq(c.issuer, owner);
    }

    function test_Fail_NonOwnerCannotAnchor() public {
        bytes32 mockHash = keccak256("another_credential");

        vm.prank(randomUser); // Try to call as a random user

        // Expect the transaction to fail with the specific custom error
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                randomUser
            )
        );

        credexa.anchorCredential(mockHash);
    }

    function test_Fail_CannotAnchorSameCredentialTwice() public {
        bytes32 mockHash = keccak256("duplicate_credential");

        vm.prank(owner);
        credexa.anchorCredential(mockHash);

        // Try to anchor it again and expect the custom error
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                Credexa.CredentialAlreadyExists.selector,
                mockHash
            )
        );
        credexa.anchorCredential(mockHash);
    }

    function test_Fail_GetNonExistentCredential() public {
        bytes32 mockHash = keccak256("non_existent_credential");

        // Expect the transaction to fail with the CredentialNotFound error
        vm.expectRevert(
            abi.encodeWithSelector(
                Credexa.CredentialNotFound.selector,
                mockHash
            )
        );
        credexa.getCredential(mockHash);
    }
}