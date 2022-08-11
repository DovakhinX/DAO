
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const hre = require("hardhat");


async function skipTime(amount){
  for(let i=0;i<amount;i++){
    await hre.network.provider.request({
      method:"evm_mine",
      params: [],
    });
  }
  console.log("I am speed...")
}

async function main() {
  const VoteToken = await hre.ethers.getContractFactory("VoteToken");
  const MyGovernor=await hre.ethers.getContractFactory("MyGovernor");
  const Treasury=await hre.ethers.getContractFactory("Treasury");
  const TimeLock=await hre.ethers.getContractFactory("TimeLock");

  //Token deployment
  const [executor,proposer,voterA,voterB,voterC,voterD,voterE]=await hre.ethers.getSigners();
  const supply=hre.ethers.utils.parseEther("1000");
  const amount=hre.ethers.utils.parseEther("100");
  
  const votetoken=await VoteToken.deploy(supply);
  console.log(`VoteToken deployed to ${votetoken.address}`);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
  const transferA=await votetoken.connect(executor).transfer(voterA.address,amount);
  const transferB=await votetoken.connect(executor).transfer(voterB.address,amount);
  const transferC=await votetoken.connect(executor).transfer(voterC.address,amount);
  const transferD=await votetoken.connect(executor).transfer(voterD.address,amount);
  const transferE=await votetoken.connect(executor).transfer(voterE.address,amount);
  
  console.log(`Token distributed for testing ${hre.ethers.utils.formatEther(amount)}`);

  //TimeLock deployment 
  const minDelay=1;

  const timelock=await TimeLock.deploy(minDelay,[proposer.address],[executor.address]);
  console.log(`TimeLock deployed to ${timelock.address}`);

  //Governance deployment
  const mygovernor=await MyGovernor.deploy(votetoken.address,timelock.address);
  console.log(`MyGovernor deployed to ${mygovernor.address}`); 

 //Treasury deployment 
 const fund=hre.ethers.utils.parseEther("100",'ether');

 const treasury=await Treasury.deploy(executor.address,{value:fund});
 console.log(`Treasury deployed to ${treasury.address}`);
 //Transfer treasury to TimeLock contract
 const transferOwner=await treasury.transferOwnership(timelock.address,{from:executor.address});
 console.log("TimeLock Owns Treasury....");
 //Role Assignment
 const proposerRole=await timelock.PROPOSER_ROLE();
 const executorRole=await timelock.EXECUTOR_ROLE();

 const grantRole=await timelock.connect(executor).grantRole(proposerRole,mygovernor.address);
 const grantRole2=await timelock.connect(executor).grantRole(executorRole,mygovernor.address); 
 console.log("Proposer and Executor role granted.")

 //Token delegation
const delegateA=await votetoken.connect(voterA).delegate(voterA.address);
const delegateB=await votetoken.connect(voterB).delegate(voterB.address);
const delegateC=await votetoken.connect(voterC).delegate(voterC.address);
const delegateD=await votetoken.connect(voterD).delegate(voterD.address);
const delegateE=await votetoken.connect(voterE).delegate(voterE.address);
console.log("Token being delegated to voters");

 //Treasury Check
let fundStatus=await treasury.isReleased();
console.log(`Fund Status: ${fundStatus}`);

//Treasury Fund
const provider = hre.ethers.getDefaultProvider();
let funds=await provider.getBalance(treasury.address);
console.log(`Treasury fund ${hre.ethers.utils.formatEther(funds)}`);

//Proposal function intiate
const encodedFunction=treasury.interface.encodeFunctionData('releaseFunds');
const description = "Fund Release from Treasury"
const proposetxn=await mygovernor.connect(proposer).propose([treasury.address],[0],[encodedFunction],description);
const tx = await proposetxn.wait(1);
const id =tx.events[0].args.proposalId;
console.log(`Created Proposal: ${id.toString()}\n`);

const proposalState = await mygovernor.state(id);
const proposalSnapShot = await mygovernor.proposalSnapshot(id);
const proposalDeadline = await mygovernor.proposalDeadline(id);
console.log(`Current state of proposal: ${proposalState.toString()} `);
console.log(`Proposal created on block ${proposalSnapShot.toString()}`);
console.log(`Proposal deadline on block ${proposalDeadline.toString()}\n`);

const blockNumber=await provider.getBlockNumber();
console.log(`Current block number :${blockNumber}`);




// Voting process

const voteA=await mygovernor.connect(voterA).castVote(id,1);
const voteB=await mygovernor.connect(voterB).castVote(id,1);
const voteC=await mygovernor.connect(voterC).castVote(id,1);
const voteD=await mygovernor.connect(voterD).castVote(id,1);
const voteE=await mygovernor.connect(voterE).castVote(id,0);
console.log("Voting done..")

const proposalState2 = await mygovernor.state(id);
console.log(`Current state of proposal: ${proposalState2.toString()} `);



const blockNumber2=await provider.getBlockNumber();
console.log(`Current block number :${blockNumber2}`);

//Vote count display
const { againstVotes, forVotes, abstainVotes } = await mygovernor.proposalVotes(id);
    console.log(`Votes For: ${forVotes.toString()}`)
    console.log(`Votes Against: ${againstVotes.toString()}`)
    console.log(`Votes Neutral: ${abstainVotes.toString()}`)

  
//Time skipper
await skipTime(14+1);
const proposalState3 = await mygovernor.state(id);
console.log(`Current state of proposal: ${proposalState3.toString()} `);
//queue process
const descriptionHash=hre.ethers.utils.id(("Fund Release from Treasury"));
const que=await mygovernor.connect(executor).queue([treasury.address],[0],[encodedFunction],descriptionHash);
console.log("Proposal is queued for execution");
//execute the proposal
const executing=await mygovernor.connect(executor).execute([treasury.address],[0],[encodedFunction],descriptionHash);
console.log("Proposal executed");
// Final check
const proposalState4 = await mygovernor.state(id);
console.log(`Current state of proposal: ${proposalState4.toString()} `);

let fundStatus2=await treasury.isReleased();
console.log(`Fund Status: ${fundStatus2}`);

let funds2=await provider.getBalance(treasury.address);
console.log(`Treasury fund ${hre.ethers.utils.formatEther(funds2)}`);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
