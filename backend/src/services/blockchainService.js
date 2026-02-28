// services/blockchainService.js
const { ethers } = require("ethers");
const dotenv = require("dotenv");
const { CONTRACT_ADDRESS, ABI } = require("../config/blockchain");

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;

if (!SEPOLIA_RPC_URL || !BACKEND_PRIVATE_KEY) {
  throw new Error("Missing required environment variables");
}

// --- CONNECTION SETUP ---
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);
const credexaContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

console.log("✅ Connected to Credexa contract at:", CONTRACT_ADDRESS);

// --- EXPORTED FUNCTIONS ---
async function anchorNewCredential(hash) {
  console.log(`Service: Anchoring hash ${hash}...`);
  const tx = await credexaContract.anchorCredential(hash);
  const receipt = await tx.wait();
  return receipt;
}

async function verifyCredential(hash) {
  console.log(`Service: Verifying hash ${hash}...`);
  const data = await credexaContract.getCredential(hash);

  if (data.timestamp === 0n) {
    return null;
  }
  return data;
}

module.exports = { anchorNewCredential, verifyCredential };
