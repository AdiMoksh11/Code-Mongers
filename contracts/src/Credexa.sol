// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Credexa
 * @dev Stores and verifies credential hashes on the blockchain.
 */
contract Credexa is Ownable {
    // Struct to hold the core on-chain data for a credential
struct Credential {
        bytes32 credentialHash; // The unique hash of the credential data
        address issuer;         // The address of the issuing authority
        uint256 timestamp;      // When it was anchored
    }

    // Mapping from the credential hash to the credential data
    mapping(bytes32 => Credential) public credentials;

    // --- Custom Errors ---
    error CredentialAlreadyExists(bytes32 credentialHash);
    error CredentialNotFound(bytes32 credentialHash);

    // Event to notify off-chain services that a credential was anchored
    event CredentialAnchored(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Anchors a new credential hash to the blockchain.
     * Can only be called by the contract owner (your backend server's wallet).
     * @param _credentialHash The SHA-256 hash of the credential details.
     */
    function anchorCredential(bytes32 _credentialHash) external onlyOwner {
        if (credentials[_credentialHash].timestamp != 0) {
            revert CredentialAlreadyExists(_credentialHash);
        }

        credentials[_credentialHash] = Credential({
            credentialHash: _credentialHash,
            issuer: msg.sender,
            timestamp: block.timestamp
        });

        emit CredentialAnchored(
            _credentialHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Verifies if a credential hash exists and returns its data.
     * This is a view function, so it's free to call.
     * @param _credentialHash The hash to verify.
     * @return The credential data struct.
     */
    function getCredential(bytes32 _credentialHash)
        external
        view
        returns (Credential memory)
    {
        if (credentials[_credentialHash].timestamp == 0) {
            revert CredentialNotFound(_credentialHash);
        }
        return credentials[_credentialHash];
    }
}