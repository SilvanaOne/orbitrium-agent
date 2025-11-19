import dotenv from "dotenv";
dotenv.config();
import { createApp, createAppInstance } from "../test/helpers/create.js";

const contractAddress = process.env.GAME_CONTRACT_ADDRESS!;
const adminAddress = process.env.GAME_CONTRACT_ADMIN_ADDRESS!;
const chain = process.env.MINA_CHAIN!;

// await createAppInstance({
//   contractAddress: "0x",
//   adminAddress: "1",
//   chain: process.env.CHAIN!,
//   nonce: 1,
// });

createApp();
