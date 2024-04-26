import { ethers } from "hardhat";

const contractFixture = async () => {
  /**
   * deployer: The account use for deploying the contract
   * user1: EOA wallet for user1
   * user2: EOA wallet for user2
   * beneficiary: EOA wallet for all beneficiary
   */
  const [deploySigner, signer1, signer2, signer3, beneficiarySigner, operatorSigner] = await ethers.getSigners();

  /**
   * ERC20
   */
  const testERC20Contract = await ethers.deployContract("TestERC20");
  await testERC20Contract.waitForDeployment();

  /**
   * ERC721
   */
  const testERC721Contract = await ethers.deployContract("TestERC721");
  await testERC721Contract.waitForDeployment();

  /**
   * EntryPoint
   */
  const entryPointContract = await ethers.deployContract("EntryPoint");
  await entryPointContract.waitForDeployment();

  /**
   * BicPermissionsEnumerable
   */
  const bicPermissionsEnumerableContract = await ethers.deployContract("BicPermissions");
  await bicPermissionsEnumerableContract.waitForDeployment();

  /**
   * BicAccountFactory
   */
  const bicAccountFactoryContract = await ethers.deployContract("BicAccountFactory", [
    entryPointContract.target,
    bicPermissionsEnumerableContract.target,
  ]);
  await bicAccountFactoryContract.waitForDeployment();

  /**
   * Implementation V2
   */
  const bicAccountV2Contract = await ethers.deployContract("BicAccount2", [entryPointContract.target]);
  await bicAccountV2Contract.waitForDeployment();

  return {
    deploySigner,
    signer1,
    signer2,
    signer3,
    beneficiarySigner,
    operatorSigner,
    entryPointContract,
    bicPermissionsEnumerableContract,
    bicAccountFactoryContract,
    bicAccountV2Contract,
    testERC20Contract,
    testERC721Contract
  };
};

export { contractFixture };
