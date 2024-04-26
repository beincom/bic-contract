# Solidity API

## BicPermissions

a contract that manages permissions for the BIC system.

_the contract uses the AccessControlEnumerable contract from OpenZeppelin._

### RECOVERY_ROLE

```solidity
bytes32 RECOVERY_ROLE
```

the role that can recover the contract.Using this on BicAccount

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

the role that can operate the contract. Using this role on HandlesController, HandlesTokenURI and BicAccount

### constructor

```solidity
constructor() public
```

