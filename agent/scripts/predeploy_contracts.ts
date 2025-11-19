import dotenv from "dotenv";
dotenv.config();
import { deployGameContract } from "src/deploy.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

for (let i = 0; i < 10; i++) {
  let { contractAddress, adminAddress, txHash, contractPrivateKey } =
    await deployGameContract();

  await prisma.gameContractData.create({
    data: {
      userMinaAddress: "",
      userSuiAddress: "",
      suiContractAddress: "",
      minaContractAddress: contractAddress,
      minaContractPrivateKey: contractPrivateKey,
      adminAddress: adminAddress,
      txHash: txHash,
    },
  });
}
