require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks:{
    hardhat:{
      chainId:31337,
      allowUnlimitedContractSize: true,
    },
    localhost:{
      chainId:31337,
      allowUnlimitedContractSize: true,

    },
},
settings: {
  optimizer: {
    enabled: true,
    runs: 2000,
  },
}
};
