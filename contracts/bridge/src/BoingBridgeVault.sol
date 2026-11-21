// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BridgedBoing} from "./BridgedBoing.sol";

/// @title BoingBridgeVault — inventory-free Base vault for Boing ↔ Base.
/// @notice
/// - Boing → Base: validators with ≥ 2/3 stake ECDSA-sign a mint attestation; anyone submits
///   `mintWithAttestation` to mint bBOING (no pre-funded inventory).
/// - Base → Boing: user burns bBOING via `burnToBoing`; attestors sign on Boing to unlock native BOING.
/// - Platform fee: `feeBps` (default 50 = 0.5%) taken from the gross amount on mint and burn.
/// - Testnet-first: deploy on Base Sepolia (84532). Do not point production UI at unset addresses.
contract BoingBridgeVault {
    /// @dev Domain for mint attestations (Boing lock → Base mint).
    bytes32 public constant MINT_TYPEHASH = keccak256(
        "MintAttestation(uint64 sourceChainId,bytes32 sourceTxHash,uint64 lockNonce,address recipient,uint256 amount,uint64 destChainId)"
    );

    uint16 public constant FEE_BPS_DEFAULT = 50; // 0.5%
    uint16 public constant BPS_DENOM = 10_000;

    BridgedBoing public immutable token;
    address public owner;
    address public feeRecipient;
    uint16 public feeBps;

    /// @dev Boing L1 chain id expected in attestations (6913 testnet / 6914 planned mainnet).
    uint64 public boingChainId;
    /// @dev This chain's id (84532 Base Sepolia / 8453 Base).
    uint64 public localChainId;

    struct Validator {
        address signer; // secp256k1 address used for Base attestations
        uint128 stake; // weight mirrored from Boing bonded stake (scaled units OK)
        bool active;
    }

    Validator[] public validators;
    mapping(address => uint256) public validatorIndexPlusOne; // 1-based
    uint256 public totalStake;

    mapping(bytes32 => bool) public mintConsumed; // attestation id → used
    mapping(bytes32 => bool) public burnRecorded; // burn id → emitted (for indexing)

    uint64 public burnNonce;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FeeRecipientUpdated(address indexed feeRecipient);
    event FeeBpsUpdated(uint16 feeBps);
    event ValidatorUpserted(address indexed signer, uint128 stake, bool active);
    event ValidatorSetReplaced(uint256 count, uint256 totalStake);
    event MintedWithAttestation(
        bytes32 indexed attestationId,
        bytes32 indexed sourceTxHash,
        address indexed recipient,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 feeAmount
    );
    event BurnedToBoing(
        bytes32 indexed burnId,
        address indexed from,
        bytes32 boingRecipient,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 feeAmount,
        uint64 burnNonce
    );

    error OnlyOwner();
    error ZeroAddress();
    error BadFee();
    error BadLength();
    error BadStake();
    error QuorumNotMet();
    error BadSignature();
    error AlreadyConsumed();
    error BadChainId();
    error ZeroAmount();
    error DuplicateSigner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(
        BridgedBoing token_,
        address feeRecipient_,
        uint64 boingChainId_,
        uint64 localChainId_,
        uint16 feeBps_
    ) {
        if (address(token_) == address(0) || feeRecipient_ == address(0)) revert ZeroAddress();
        if (feeBps_ > 1_000) revert BadFee(); // cap 10%
        token = token_;
        owner = msg.sender;
        feeRecipient = feeRecipient_;
        feeBps = feeBps_ == 0 ? FEE_BPS_DEFAULT : feeBps_;
        boingChainId = boingChainId_;
        localChainId = localChainId_;
        emit OwnershipTransferred(address(0), msg.sender);
        emit FeeRecipientUpdated(feeRecipient_);
        emit FeeBpsUpdated(feeBps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setFeeRecipient(address feeRecipient_) external onlyOwner {
        if (feeRecipient_ == address(0)) revert ZeroAddress();
        feeRecipient = feeRecipient_;
        emit FeeRecipientUpdated(feeRecipient_);
    }

    function setFeeBps(uint16 feeBps_) external onlyOwner {
        if (feeBps_ > 1_000) revert BadFee();
        feeBps = feeBps_;
        emit FeeBpsUpdated(feeBps_);
    }

    function setBoingChainId(uint64 id) external onlyOwner {
        boingChainId = id;
    }

    /// @notice Replace the whole validator set (stake weights must mirror Boing bonded stake).
    function replaceValidatorSet(address[] calldata signers, uint128[] calldata stakes) external onlyOwner {
        if (signers.length != stakes.length || signers.length == 0) revert BadLength();

        // Clear old index map
        uint256 oldLen = validators.length;
        for (uint256 i = 0; i < oldLen; i++) {
            delete validatorIndexPlusOne[validators[i].signer];
        }
        delete validators;

        uint256 stakeSum;
        for (uint256 i = 0; i < signers.length; i++) {
            address s = signers[i];
            if (s == address(0)) revert ZeroAddress();
            if (stakes[i] == 0) revert BadStake();
            if (validatorIndexPlusOne[s] != 0) revert DuplicateSigner();
            validators.push(Validator({signer: s, stake: stakes[i], active: true}));
            validatorIndexPlusOne[s] = validators.length; // 1-based
            stakeSum += stakes[i];
        }
        totalStake = stakeSum;
        emit ValidatorSetReplaced(signers.length, stakeSum);
    }

    function upsertValidator(address signer, uint128 stake, bool active) external onlyOwner {
        if (signer == address(0)) revert ZeroAddress();
        uint256 idx1 = validatorIndexPlusOne[signer];
        if (idx1 == 0) {
            if (!active || stake == 0) revert BadStake();
            validators.push(Validator({signer: signer, stake: stake, active: true}));
            validatorIndexPlusOne[signer] = validators.length;
            totalStake += stake;
        } else {
            Validator storage v = validators[idx1 - 1];
            totalStake = totalStake - v.stake + (active ? stake : 0);
            v.stake = active ? stake : 0;
            v.active = active;
        }
        emit ValidatorUpserted(signer, stake, active);
    }

    function validatorCount() external view returns (uint256) {
        return validators.length;
    }

    /// @dev EIP-712-ish digest without full domain separator (chain-bound via localChainId in struct).
    function mintDigest(
        uint64 sourceChainId,
        bytes32 sourceTxHash,
        uint64 lockNonce,
        address recipient,
        uint256 amount,
        uint64 destChainId
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                MINT_TYPEHASH, sourceChainId, sourceTxHash, lockNonce, recipient, amount, destChainId
            )
        );
    }

    function attestationId(bytes32 digest) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("BOING_BRIDGE_MINT_V1", digest));
    }

    /// @notice Mint bBOING after Boing validators (≥2/3 stake) signed the lock attestation.
    /// @param signatures Concatenated 65-byte ECDSA signatures from active validators (any order).
    function mintWithAttestation(
        uint64 sourceChainId,
        bytes32 sourceTxHash,
        uint64 lockNonce,
        address recipient,
        uint256 amount,
        bytes calldata signatures
    ) external {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (sourceChainId != boingChainId) revert BadChainId();

        bytes32 digest = mintDigest(sourceChainId, sourceTxHash, lockNonce, recipient, amount, localChainId);
        bytes32 id = attestationId(digest);
        if (mintConsumed[id]) revert AlreadyConsumed();

        _requireStakeQuorum(digest, signatures);
        mintConsumed[id] = true;

        (uint256 net, uint256 fee) = _splitFee(amount);
        if (fee > 0) {
            token.mint(feeRecipient, fee);
        }
        token.mint(recipient, net);
        emit MintedWithAttestation(id, sourceTxHash, recipient, amount, net, fee);
    }

    /// @notice Burn bBOING to bridge back to Boing L1. Emits `BurnedToBoing` for attestors.
    /// @param boingRecipient 32-byte Boing AccountId (left-padded if ever shorter — always 32).
    function burnToBoing(uint256 amount, bytes32 boingRecipient) external {
        if (amount == 0) revert ZeroAmount();
        if (boingRecipient == bytes32(0)) revert ZeroAddress();

        (uint256 net, uint256 fee) = _splitFee(amount);
        token.burn(msg.sender, amount);
        if (fee > 0) {
            // Fee stays burned out of circulation (inventory-free); record it for accounting.
            // Optionally re-mint fee to feeRecipient so Base fee wallet accrues bBOING:
            token.mint(feeRecipient, fee);
        }

        uint64 n = ++burnNonce;
        bytes32 burnId = keccak256(
            abi.encodePacked(
                "BOING_BRIDGE_BURN_V1", localChainId, block.chainid, msg.sender, boingRecipient, amount, net, n
            )
        );
        burnRecorded[burnId] = true;
        emit BurnedToBoing(burnId, msg.sender, boingRecipient, amount, net, fee, n);
    }

    function _splitFee(uint256 amount) internal view returns (uint256 net, uint256 fee) {
        fee = (amount * feeBps) / BPS_DENOM;
        net = amount - fee;
    }

    /// @dev Recover signers from 65-byte signatures over `toEthSignedMessageHash(digest)` and
    /// require active stake sum ≥ ⌈2/3⌉ of `totalStake`.
    function _requireStakeQuorum(bytes32 digest, bytes calldata signatures) internal view {
        if (signatures.length == 0 || signatures.length % 65 != 0) revert BadSignature();
        if (totalStake == 0) revert QuorumNotMet();

        bytes32 ethHash = _toEthSignedMessageHash(digest);
        uint256 signedStake;
        uint256 n = signatures.length / 65;
        // Track used validator indices (max 256 for testnet / early mainnet).
        uint256 usedBits;

        for (uint256 i = 0; i < n; i++) {
            bytes memory sig = signatures[i * 65:(i + 1) * 65];
            address recovered = _recover(ethHash, sig);
            uint256 idx1 = validatorIndexPlusOne[recovered];
            if (idx1 == 0) revert BadSignature();
            uint256 idx = idx1 - 1;
            if (idx >= 256) revert BadSignature();
            uint256 bit = uint256(1) << idx;
            if (usedBits & bit != 0) revert DuplicateSigner();
            usedBits |= bit;
            Validator storage v = validators[idx];
            if (!v.active || v.stake == 0) revert BadSignature();
            signedStake += v.stake;
        }

        // ⌈2W/3⌉ via integer compare: signed * 3 >= total * 2
        if (signedStake * 3 < totalStake * 2) revert QuorumNotMet();
    }

    function _toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function _recover(bytes32 ethHash, bytes memory sig) internal pure returns (address) {
        if (sig.length != 65) revert BadSignature();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert BadSignature();
        address recovered = ecrecover(ethHash, v, r, s);
        if (recovered == address(0)) revert BadSignature();
        return recovered;
    }
}
