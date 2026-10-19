// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Obscura voucher registry: scoped, time-limited, revocable access grants
/// over encrypted Inco handles (bytes32).
contract ObscuraVouchers {
    struct Voucher {
        address grantor;
        address auditor;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 revokedAt;
        bool revocable;
        uint8 disclosure;
        bytes32 verifiersHash;
        bytes32[] handles;
    }

    uint256 public count;
    mapping(uint256 => Voucher) private _v;

    event VoucherIssued(uint256 indexed id, address indexed grantor, address indexed auditor, bytes32[] handles, uint64 expiresAt, bool revocable, uint8 disclosure, bytes32 verifiersHash);
    event VoucherRevoked(uint256 indexed id, address indexed grantor);

    function issue(address auditor, bytes32[] calldata handles, uint64 expiresAt, bool revocable, uint8 disclosure, bytes32 verifiersHash) external returns (uint256 id) {
        require(auditor != address(0) && auditor != msg.sender, "bad auditor");
        require(handles.length > 0, "no handles");
        require(expiresAt > block.timestamp, "bad expiry");
        id = ++count;
        Voucher storage v = _v[id];
        v.grantor = msg.sender;
        v.auditor = auditor;
        v.createdAt = uint64(block.timestamp);
        v.expiresAt = expiresAt;
        v.revocable = revocable;
        v.disclosure = disclosure;
        v.verifiersHash = verifiersHash;
        v.handles = handles;
        emit VoucherIssued(id, msg.sender, auditor, handles, expiresAt, revocable, disclosure, verifiersHash);
    }

    function revoke(uint256 id) external {
        Voucher storage v = _v[id];
        require(v.grantor == msg.sender, "not grantor");
        require(v.revocable, "not revocable");
        require(v.revokedAt == 0 && v.expiresAt > block.timestamp, "inactive");
        v.revokedAt = uint64(block.timestamp);
        emit VoucherRevoked(id, msg.sender);
    }

    function isActive(uint256 id, address auditor, bytes32 handle) external view returns (bool) {
        Voucher storage v = _v[id];
        if (v.auditor != auditor || v.revokedAt != 0 || v.expiresAt <= block.timestamp) return false;
        for (uint256 i; i < v.handles.length; i++) if (v.handles[i] == handle) return true;
        return false;
    }

    function getVoucher(uint256 id) external view returns (Voucher memory) { return _v[id]; }
}
