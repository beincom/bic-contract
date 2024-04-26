// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract BicToken is Context, AccessControlEnumerable, ERC20Burnable, ERC20Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 public constant BLACK_LIST_ROLE = keccak256("BLACK_LIST_ROLE");

    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    uint256 public timeUnlockTransfer = 1723075200; // Thursday, August 8, 2024 12:00:00 AM (GMT)

    constructor() ERC20("Bein Chain", "BIC") {
        address adminAddress = _msgSender();

        _setupRole(DEFAULT_ADMIN_ROLE, adminAddress);

        _setupRole(BLACK_LIST_ROLE, adminAddress);

        _setupRole(PAUSER_ROLE, adminAddress);

        _setupRole(TRANSFER_ROLE, adminAddress);

        _mint(adminAddress, 6339777879 * 1e18);
    }

    event BlockAddress(address addr, uint256 time);

    event UnblockAddress(address addr, uint256 time);

    event UpdateTimeUnlockTransfer(uint256 timeUnlock, uint256 time);

    mapping(address => bool) public blacklist;

    function blockAddress(address addr) public {
        require(hasRole(BLACK_LIST_ROLE, _msgSender()), "Must have black list role to block");
        blacklist[addr] = true;
        emit BlockAddress(addr, block.timestamp);
    }

    function unblockAddress(address addr) public {
        require(hasRole(BLACK_LIST_ROLE, _msgSender()), "Must have black list role to unblock");
        blacklist[addr] = false;
        emit UnblockAddress(addr, block.timestamp);
    }

    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "Must have pauser role to pause");
        _pause();
    }

    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "Must have pauser role to unpause");
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override(ERC20, ERC20Pausable)
    {
        require(!blacklist[from], "Address is in blacklist");
        // require(
        //     hasRole(TRANSFER_ROLE, _msgSender()) ||
        //         block.timestamp > timeUnlockTransfer,
        //     "Must have transfer role or after timeUnlockTransfer to transfer"
        // );
        super._beforeTokenTransfer(from, to, amount);
    }

    function updateTimeUnlockTransfer(uint256 _timeUnlockTransfer) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Must have admin role to timeUnlockTransfer");
        timeUnlockTransfer = _timeUnlockTransfer;
        emit UpdateTimeUnlockTransfer(_timeUnlockTransfer, block.timestamp);
    }
}
