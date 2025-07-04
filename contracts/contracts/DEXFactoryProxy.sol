// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/utils/StorageSlot.sol";

contract DEXFactoryProxy is Proxy {
    receive() external payable {}
    bytes32 private constant _IMPLEMENTATION_SLOT = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    bytes32 private constant _ADMIN_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);

    event AdminChanged(address previousAdmin, address newAdmin);
    event ImplementationUpgraded(address indexed implementation);

    modifier ifAdmin() {
        if (msg.sender == _getAdmin()) {
            _;
        } else {
            _fallback();
        }
    }

    constructor(address implementation_, address admin_, bytes memory _data) {
        _setAdmin(admin_);
        _setImplementation(implementation_);
        if (_data.length > 0) {
            Address.functionDelegateCall(implementation_, _data);
        }
    }

    function _implementation() internal view virtual override returns (address impl) {
        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    function _setImplementation(address newImplementation) private {
        require(Address.isContract(newImplementation), "ERC1967: new implementation is not a contract");
        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
        emit ImplementationUpgraded(newImplementation);
    }

    function _getAdmin() private view returns (address) {
        return StorageSlot.getAddressSlot(_ADMIN_SLOT).value;
    }

    function _setAdmin(address newAdmin) private {
        require(newAdmin != address(0), "ERC1967: new admin is the zero address");
        StorageSlot.getAddressSlot(_ADMIN_SLOT).value = newAdmin;
    }

    function admin() external ifAdmin returns (address admin_) {
        admin_ = _getAdmin();
    }

    function implementation() external ifAdmin returns (address implementation_) {
        implementation_ = _implementation();
    }

    function changeAdmin(address newAdmin) external virtual ifAdmin {
        emit AdminChanged(_getAdmin(), newAdmin);
        _setAdmin(newAdmin);
    }

    function upgradeTo(address newImplementation) external virtual ifAdmin {
        _setImplementation(newImplementation);
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual ifAdmin {
        _setImplementation(newImplementation);
        Address.functionDelegateCall(newImplementation, data);
    }
}

library Address {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    function functionDelegateCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    function verifyCallResult(bool success, bytes memory returndata, string memory errorMessage) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
} 