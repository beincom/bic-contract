// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;


import {HandlesEvents} from '../constants/HandlesEvents.sol';
import {HandlesErrors} from '../constants/HandlesErrors.sol';
import {IHandleTokenURI} from '../interfaces/IHandleTokenURI.sol';
import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import {IERC165Upgradeable} from '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import {ERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import {IHandles} from "../interfaces/IHandles.sol";

/**
 * A handle is defined as a local name inside a namespace context. A handle is represented as the local name with its
 * namespace applied as a prefix, using the slash symbol as separator.
 *
 *      handle = namespace /@ localName
 *
 * Handle and local name can be used interchangeably once you are in a context of a namespace, as it became redundant.
 *
 *      handle === ${localName} ; inside some namespace.
 *
 * @custom:upgradeable Transparent upgradeable proxy without initializer.
 */
contract Handles is ERC721Upgradeable, IHandles {
    using Address for address;
    address public CONTROLLER;
    address public OPERATOR;
    string private _namespace;

    // We used 31 to fit the handle in a single slot, with `.name` that restricted localName to use 26 characters.
    // Can be extended later if needed.
    uint256 private _totalSupply;


    mapping(uint256 tokenId => string localName) internal _localNames;

    address internal _handleTokenURIContract;

    modifier onlyOperator() {
        if (msg.sender != OPERATOR) {
            revert HandlesErrors.NotController();
        }
        _;
    }

    modifier onlyController() {
        if (msg.sender != CONTROLLER) {
            revert HandlesErrors.NotController();
        }
        _;
    }

    constructor() {}

    function initialize(
        string memory namespace,
        string memory name,
        string memory symbol,
        address operator
    ) public initializer {
        __ERC721_init(name, symbol);
        _namespace = namespace;
        CONTROLLER = msg.sender;
        OPERATOR = operator;
    }

    function totalSupply() external view virtual override returns (uint256) {
        return _totalSupply;
    }

    function setController(address controller) external onlyOperator {
        CONTROLLER = controller;
    }

    function setOperator(address operator) external onlyOperator {
        OPERATOR = operator;
    }

    function setHandleTokenURIContract(address handleTokenURIContract) external override onlyOperator {
        _handleTokenURIContract = handleTokenURIContract;
        emit HandlesEvents.BatchMetadataUpdate({fromTokenId: 0, toTokenId: type(uint256).max});
    }

    function getHandleTokenURIContract() external view override returns (address) {
        return _handleTokenURIContract;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        return IHandleTokenURI(_handleTokenURIContract).getTokenURI(tokenId, _localNames[tokenId], _namespace);
    }

    function mintHandle(
        address to,
        string calldata localName
    ) external onlyController returns (uint256) {
        return _mintHandle(to, localName);
    }

    function burn(uint256 tokenId) external {
        if (msg.sender != ownerOf(tokenId)) {
            revert HandlesErrors.NotOwner();
        }
        --_totalSupply;
        _burn(tokenId);
        delete _localNames[tokenId];
    }

    function exists(uint256 tokenId) external view override returns (bool) {
        return _exists(tokenId);
    }

    function getNamespace() public view virtual returns (string memory) {
        return _namespace;
    }

    function getNamespaceHash() external view returns (bytes32) {
        return keccak256(bytes(_namespace));
    }

    function getLocalName(uint256 tokenId) public view returns (string memory) {
        string memory localName = _localNames[tokenId];
        if (bytes(localName).length == 0) {
            revert HandlesErrors.DoesNotExist();
        }
        return _localNames[tokenId];
    }

    function getHandle(uint256 tokenId) public view returns (string memory) {
        string memory localName = getLocalName(tokenId);
        return string.concat(_namespace, '/@', localName);
    }

    function getTokenId(string memory localName) public pure returns (uint256) {
        return uint256(keccak256(bytes(localName)));
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Upgradeable, IERC165Upgradeable) returns (bool) {
        return (ERC721Upgradeable.supportsInterface(interfaceId));
    }

    //////////////////////////////////////
    ///        INTERNAL FUNCTIONS      ///
    //////////////////////////////////////

    function _mintHandle(address to, string calldata localName) internal returns (uint256) {
        uint256 tokenId = getTokenId(localName);
        ++_totalSupply;
        _mint(to, tokenId);
        _localNames[tokenId] = localName;
        emit HandlesEvents.HandleMinted(localName, _namespace, tokenId, to, block.timestamp);
        return tokenId;
    }
}
