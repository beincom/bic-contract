// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {IMarketplace} from "../../marketplace/interfaces/IMarketplace.sol";
import {IHandles} from "../interfaces/IHandles.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HandlesController
 * @dev Manages operations related to handle auctions and direct handle requests, including minting and claim payouts.
 * Uses ECDSA for signature verification and integrates with a marketplace for auction functionalities.
 */
contract HandlesController is ReentrancyGuard {
    /**
     * @notice Represents a request for an auction, including the ability to claim the handle, the beneficiaries, and their respective shares of the proceeds.
     * @dev Represents a request for an auction, including the ability to claim the handle, the beneficiaries, and their respective shares of the proceeds.
     */
    struct AuctionRequest {
        bool canClaim;            // Indicates if the auction's proceeds can be claimed.
        address[] beneficiaries;  // List of addresses
        uint256[] collects;       // Corresponding shares of the proceeds for each beneficiary.
    }

    /**
     * @dev Represents a request to create a handle, either through direct sale or auction.
     */
    struct HandleRequest {
        address receiver;         // Address to receive the handle.
        address handle;           // Contract address of the handle.
        string name;              // Name of the handle.
        uint256 price;            // Price to be paid for the handle.
        address[] beneficiaries;  // Beneficiaries for the handle's payment.
        uint256[] collects;       // Shares of the proceeds for each beneficiary.
        uint256 commitDuration;   // Duration for which the handle creation can be committed (reserved).
        bool isAuction;           // Indicates if the handle request is for an auction.
    }

    /// @dev The address of the verifier authorized to validate signatures.
    address public verifier;
    /// @dev The BIC token contract address.
    IERC20 public bic;
    /// @dev The permissions contract used to manage operator roles.
    IBicPermissions public immutable _bicPermissions;
    /// @dev Mapping of commitments to their respective expiration timestamps. Used to manage the timing of commitments and auctions.
    mapping(bytes32 => uint256) public commitments;
    /// @dev The marketplace contract used for handling auctions.
    IMarketplace public marketplace;
    /// @dev The denominator used for calculating beneficiary shares.
    uint256 public collectsDenominator = 10000;
    /// @dev The address of the collector, who receives any residual funds not distributed to beneficiaries.
    address public collector;
    /// @dev Mapping from handle names to their corresponding auction requests, managing the state and distribution of auctioned handles.
    mapping(string => AuctionRequest) public nameToAuctionRequest;
    /// @dev Emitted when a handle is minted, providing details of the transaction including the handle address, recipient, name, and price.
    event MintHandle(address indexed handle, address indexed to, string name, uint256 price);
    /// @dev Emitted when a commitment is made, providing details of the commitment and its expiration timestamp.
    event Commitment(bytes32 indexed commitment, uint256 endTimestamp);
    /// @dev Emitted when the verifier address is updated.
    event SetVerifier(address indexed verifier);
    /// @dev Emitted when the marketplace address is updated.
    event SetMarketplace(address indexed marketplace);
    /// @dev Emitted when an auction is created, providing details of the auction ID.
    event CreateAuction(uint256 auctionId);

    /**
     * @notice Initializes the HandlesController contract with the given permissions contract and BIC token.
     */
    constructor(IBicPermissions _bp, IERC20 _bic) {
        _bicPermissions = _bp;
        bic = _bic;
    }

    /**
     * @notice Ensures that the function is called only by the operator.
     */
    modifier onlyOperator() {
        require(
            _bicPermissions.hasRole(
                _bicPermissions.OPERATOR_ROLE(),
                msg.sender
            ),
            "HandlesController: caller is not an operator"
        );
        _;
    }

    /**
     * @notice Sets a new verifier address authorized to validate signatures.
     * @dev Can only be set by an operator. Emits a SetVerifier event upon success.
     * @param _verifier The new verifier address.
     */
    function setVerifier(address _verifier) external onlyOperator {
        verifier = _verifier;
        emit SetVerifier(_verifier);
    }

    /**
     * @notice Sets the marketplace contract address used for handling auctions.
     * @dev Can only be set by an operator. Emits a SetMarketplace event upon success.
     * @param _marketplace The address of the Thirdweb Marketplace contract.
     */
    function setMarketplace(address _marketplace) external onlyOperator {
        marketplace = IMarketplace(_marketplace);
        emit SetMarketplace(_marketplace);
    }

    /**
     * @notice Updates the denominator used for calculating beneficiary shares.
     * @dev Can only be performed by an operator. This is used to adjust the precision of distributions.
     * @param _collectsDenominator The new denominator value for share calculations.
     */
    function updateCollectsDenominator(
        uint256 _collectsDenominator
    ) external onlyOperator {
        collectsDenominator = _collectsDenominator;
    }

    /**
     * @notice Sets the address of the collector, who receives any residual funds not distributed to beneficiaries.
     * @dev Can only be performed by an operator. This address acts as a fallback for undistributed funds.
     * @param _collector The address of the collector.
     */
    function setCollector(address _collector) external onlyOperator {
        collector = _collector;
    }

    /**
     * @notice Processes handle requests, supports direct minting or auctions.
     * @dev Validates the request verifier's signature, mints handles, or initializes auctions.
     * Handles are minted directly or auctioned based on the request parameters.
     * @param rq The handle request details including receiver, price, and auction settings.
     * @param validUntil The timestamp until when the request is valid.
     * @param validAfter The timestamp after which the request is valid.
     * @param signature The cryptographic signature to validate the request's authenticity.
     */
    function requestHandle(
        HandleRequest calldata rq,
        uint256 validUntil,
        uint256 validAfter,
        bytes calldata signature
    ) external nonReentrant {
        bytes32 dataHash = getRequestHandleOp(rq, validUntil, validAfter);
        require(
            _verifySignature(dataHash, signature),
            "HandlesController: invalid signature"
        );

        if (rq.commitDuration == 0) {
            // directly mint from handle
            _mintHandle(
                rq.handle,
                rq.receiver,
                rq.name,
                rq.price,
                rq.beneficiaries,
                rq.collects
            );
        } else {
            // auction or commit
            if (rq.isAuction) {
                // auction
                _mintHandle(
                    rq.handle,
                    address(this),
                    rq.name,
                    rq.price,
                    rq.beneficiaries,
                    rq.collects
                );
                IHandles(rq.handle).approve(
                    address(marketplace),
                    IHandles(rq.handle).getTokenId(rq.name)
                );

                IMarketplace.AuctionParameters memory auctionParams;
                auctionParams.assetContract = rq.handle;
                auctionParams.currency = address(bic);
                auctionParams.minimumBidAmount = rq.price;
                auctionParams.buyoutBidAmount = 0;
                auctionParams.startTimestamp = uint64(block.timestamp);
                auctionParams.endTimestamp = uint64(
                    block.timestamp + rq.commitDuration
                );
                auctionParams.timeBufferInSeconds = 900;
                auctionParams.bidBufferBps = 500;
                auctionParams.tokenId = IHandles(rq.handle).getTokenId(rq.name);
                auctionParams.quantity = 1;
                uint256 auctionId = marketplace.createAuction(auctionParams);
                nameToAuctionRequest[rq.name] = AuctionRequest(
                    true,
                    rq.beneficiaries,
                    rq.collects
                );
                emit CreateAuction(auctionId);
            } else {
                // commit
                bool isCommitted = _isCommitted(dataHash, rq.commitDuration);
                if (!isCommitted) {
                    _mintHandle(
                        rq.handle,
                        rq.receiver,
                        rq.name,
                        rq.price,
                        rq.beneficiaries,
                        rq.collects
                    );
                }
            }
        }
    }

    /**
     * @notice Collects the auction payouts after an auction concludes in the Thirdweb Marketplace. [LINK]: https://github.com/thirdweb-dev/contracts/tree/main/contracts/prebuilts/marketplace/english-auctions
     * @dev This function is called after a successful auction on the Thirdweb Marketplace to distribute the auction proceeds.
     *      The process involves two main steps:
     *
     *      1. The winning bidder claims the auction amount through the Thirdweb Marketplace contract, which transfers the funds to this HandleController contract.
     *
     *      2. This function is then called to distribute these funds among the predefined beneficiaries according to the specified shares.
     *
     *      This function ensures that only valid, unclaimed auctions can be processed and verifies the operation via signature.
     *
     *      It checks that the auction was marked as claimable, verifies the provided signature to ensure it comes from a valid source, and then performs the payout.
     *
     *      Once the payout is completed, it marks the auction as claimed to prevent re-claiming.
     *
     * @param name The name of the handle associated with the auction.
     * @param amount The total amount of Ether or tokens to be distributed to the beneficiaries.
     * @param signature The signature from the authorized verifier to validate the claim operation.
     *
     * @notice The function will revert if:
     *
     *      - The auction associated with the handle is not marked as canClaim.
     *      - The provided signature does not validate against the expected payload signed by the authorized signer.
     */
    function collectAuctionPayout(
        string calldata name,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant {
        require(
            nameToAuctionRequest[name].canClaim,
            "HandlesController: not an auction"
        );
        bytes32 dataHash = getCollectAuctionPayoutOp(name, amount);
        require(
            _verifySignature(dataHash, signature),
            "HandlesController: invalid signature"
        );
        _payout(
            amount,
            nameToAuctionRequest[name].beneficiaries,
            nameToAuctionRequest[name].collects
        );
        nameToAuctionRequest[name].canClaim = false;
    }

    /**
     * @notice Verifies the signature of a transaction.
     * @dev Internal function to verify the signature of a transaction.
     */
    function _verifySignature(
        bytes32 dataHash,
        bytes calldata signature
    ) private view returns (bool) {
        bytes32 dataHashSign = ECDSA.toEthSignedMessageHash(dataHash);
        address signer = ECDSA.recover(dataHashSign, signature);
        return signer == verifier;
    }

    /**
     * @notice Handles commitments for minting handles with a delay.
     * @dev Internal function to handle commitments for minting handles with a delay.
     * @param commitment The hash of the commitment.
     * @param commitDuration The duration of the commitment.
     */
    function _isCommitted(
        bytes32 commitment,
        uint256 commitDuration
    ) private returns (bool) {
        if (commitments[commitment] != 0) {
            if (commitments[commitment] < block.timestamp) {
                return false;
            }
        } else {
            commitments[commitment] = block.timestamp + commitDuration;
            emit Commitment(commitment, block.timestamp + commitDuration);
        }
        return true;
    }

    /**
     * @notice Mints handles directly or assigns them to the contract for auction.
     * @dev Internal function to mint handles directly or assign to the contract for auction.
     * @param handle The address of the handle contract.
     * @param to The address of the receiver of the handle.
     * @param name The name of the handle.
     * @param price The price of the handle.
     * @param beneficiaries The addresses of the beneficiaries.
     * @param collects The percentage of the price to be distributed to each beneficiary.
     */
    function _mintHandle(
        address handle,
        address to,
        string calldata name,
        uint256 price,
        address[] calldata beneficiaries,
        uint256[] calldata collects
    ) private {
        if (to != address(this)) {
            IERC20(bic).transferFrom(msg.sender, address(this), price);
            _payout(price, beneficiaries, collects);
        }
        IHandles(handle).mintHandle(to, name);
        emit MintHandle(handle, to, name, price);
    }

    /**
     * @notice Distributes funds to beneficiaries and a collector.
     * @dev Internal function to distribute funds to beneficiaries and collector.
     * @param amount The total amount to be distributed.
     * @param beneficiaries The addresses of the beneficiaries.
     * @param collects The percentage of the amount to be distributed to each beneficiary.
     */
    function _payout(
        uint256 amount,
        address[] memory beneficiaries,
        uint256[] memory collects
    ) private {
        uint256 totalCollects = 0;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 collect = (amount * collects[i]) / collectsDenominator;
            IERC20(bic).transfer(beneficiaries[i], collect);
            totalCollects += collect;
        }
        if (totalCollects < amount) {
            IERC20(bic).transfer(collector, amount - totalCollects);
        }
    }

    /**
     * @notice Allows withdrawal of funds or tokens from the contract.
     * @param token The address of the token to withdraw, or address(0) for native Ether.
     * @param to The recipient of the funds or tokens.
     * @param amount The amount to withdraw.
     */
    function withdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOperator {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    /**
     * @notice Allows the operator to claim tokens sent to the contract by mistake.
     * @dev Generates a unique hash for a handle request operation based on multiple parameters.
     * @param rq The handle request details including receiver, price, and auction settings.
     * @param validUntil The timestamp until when the request is valid.
     * @param validAfter The timestamp after when the request is valid.
     * @return The unique hash for the handle request operation.
     */
    function getRequestHandleOp(
        HandleRequest calldata rq,
        uint256 validUntil,
        uint256 validAfter
    ) public view returns (bytes32) {
        {
            require(
                block.timestamp <= validUntil,
                "HandlesController: invalid validUntil"
            );
            require(
                block.timestamp > validAfter,
                "HandlesController: invalid validAfter"
            );
            require(
                rq.beneficiaries.length == rq.collects.length,
                "HandlesController: invalid beneficiaries and collects"
            );
            uint256 totalCollects = 0;
            for (uint256 i = 0; i < rq.collects.length; i++) {
                totalCollects += rq.collects[i];
            }
            require(
                totalCollects <= collectsDenominator,
                "HandlesController: invalid collects"
            );
            require(
                (rq.isAuction && rq.commitDuration > 0) || !rq.isAuction,
                "HandlesController: invalid isAuction and commitDuration"
            );
        }
        if (rq.commitDuration > 0 && !rq.isAuction) {
            return
                keccak256(
                    abi.encode(
                        rq.receiver,
                        rq.handle,
                        rq.name,
                        rq.price,
                        rq.beneficiaries,
                        rq.collects,
                        rq.commitDuration,
                        rq.isAuction,
                        block.chainid
                    )
                );
        }
        return
            keccak256(
                abi.encode(
                    rq.receiver,
                    rq.handle,
                    rq.name,
                    rq.price,
                    rq.beneficiaries,
                    rq.collects,
                    block.chainid,
                    validUntil,
                    validAfter
                )
            );
    }

    /**
     * @notice Generates a unique hash for a collect auction payout operation.
     * @dev Generates a unique hash for a collect auction payout operation.
     */
    function getCollectAuctionPayoutOp(
        string calldata name,
        uint256 amount
    ) public view returns (bytes32) {
        return keccak256(abi.encode(name, amount, block.chainid));
    }
}
