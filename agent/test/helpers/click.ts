import { Transaction } from "@mysten/sui/transactions";
import { executeTx, waitTx } from "@silvana-one/coordination";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getSuiAddress } from "@silvana-one/coordination";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

interface JobCreatedEvent {
  agent: string;
  agent_method: string;
  app: string;
  app_instance: string;
  app_instance_method: string;
  created_at: string;
  data: number[];
  description: string;
  developer: string;
  job_sequence: string;
  sequences: any;
  status: {
    variant: string;
    fields: any;
  };
}

interface ActionResult {
  jobCreatedEvent?: JobCreatedEvent;
}

// Interface for click parameters
export interface ClickParams {
  ruleId: number;
  targetMagnitude: number[]; // 21-element array representing which resource to click
  priceMagnitude: number[]; // 21-element array representing the price
  signature: string;
}

export async function click(params: {
  appID?: string;
  appInstanceID?: string;
  clickParams: ClickParams;
}): Promise<ActionResult> {
  const {
    appID = process.env.APP_OBJECT_ID,
    appInstanceID = process.env.APP_INSTANCE_ID,
    clickParams,
  } = params;
  const suiSecretKey: string = process.env.SUI_SECRET_KEY!;

  if (!suiSecretKey) {
    throw new Error("Missing environment variable SUI_SECRET_KEY");
  }

  const packageID = process.env.APP_PACKAGE_ID;
  if (!packageID) {
    throw new Error("PACKAGE_ID is not set");
  }

  if (!appID) {
    throw new Error("APP_OBJECT_ID is not set");
  }

  if (!appInstanceID) {
    throw new Error("APP_INSTANCE_ID is not set");
  }

  const keyPair = Ed25519Keypair.fromSecretKey(suiSecretKey);
  const address = await getSuiAddress({
    secretKey: suiSecretKey,
  });

  // Validate target magnitude length (should be 21 elements)
  if (clickParams.targetMagnitude.length !== 21) {
    throw new Error("Target magnitude must be exactly 21 elements");
  }

  // Validate price magnitude length (should be 21 elements)
  if (clickParams.priceMagnitude.length !== 21) {
    throw new Error("Price magnitude must be exactly 21 elements");
  }

  // Convert signature from base64 to bytes
  const signatureBytes = clickParams.signature
    .split(",")
    .map((byte: string) => +byte);

  const tx = new Transaction();

  /*
public fun click(
    app: &mut App,
    instance: &mut AppInstance,
    rule_id: u64,
    targetMagnitude: vector<u64>,
    priceMagnitude: vector<u64>,
    signature: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
  */
  const args = [
    tx.object(appID),
    tx.object(appInstanceID),
    tx.pure.u64(clickParams.ruleId), // Rule ID
    tx.pure.vector("u64", clickParams.targetMagnitude), // Target magnitude
    tx.pure.vector("u64", clickParams.priceMagnitude), // Price magnitude
    tx.pure.vector("u8", signatureBytes), // Signature
    tx.object(SUI_CLOCK_OBJECT_ID),
  ];

  tx.moveCall({
    package: packageID,
    module: "main",
    function: "click",
    arguments: args,
  });

  tx.setSender(address);
  tx.setGasBudget(200_000_000);

  const result = await executeTx({
    tx,
    keyPair,
  });
  if (!result) {
    throw new Error("Failed to create action");
  }
  const { digest } = result;
  const waitResult = await waitTx(digest);
  if (waitResult.errors) {
    console.log(`Errors for tx ${digest}:`, waitResult.errors);
    throw new Error("Transaction failed");
  }

  // waitResult contains the full transaction with events
  const events = waitResult.events;
  if (!events) {
    throw new Error("No events found");
  }
  //console.log("Events:", events);

  let actionResult: ActionResult | null = null;
  let jobCreatedEvent: JobCreatedEvent | null = null;

  for (const event of events) {
    if (event.type.endsWith("::main::ClickEvent")) {
      const json = event.parsedJson as any;

      actionResult = {
        jobCreatedEvent: undefined,
      };
    } else if (event.type.endsWith("::jobs::JobCreatedEvent")) {
      jobCreatedEvent = event.parsedJson as JobCreatedEvent;
    }
  }

  if (!actionResult) {
    throw new Error("No ValueAddedEvent or ValueMultipliedEvent found");
  }

  // Add JobCreatedEvent to the result if found
  if (jobCreatedEvent) {
    actionResult.jobCreatedEvent = jobCreatedEvent;
  }

  return actionResult;
}

// Helper function to create a simple click (click on first resource with no price)
export async function simpleClick(
  params: {
    appID?: string;
    appInstanceID?: string;
  } = {}
) {
  const {
    appID = process.env.APP_OBJECT_ID,
    appInstanceID = process.env.APP_INSTANCE_ID,
  } = params;
  // Create a target magnitude array with 1 for the first resource (wood) and 0 for others
  const targetMagnitude = [
    1000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  // Create a price magnitude array with all zeros (no cost)
  const priceMagnitude = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  // For testing purposes, you might need to generate a proper signature
  // This is a placeholder - in production you'd need the actual signature from the backend
  const signature =
    "221,164,38,185,112,49,0,58,60,31,169,106,78,218,103,171,142,165,102,7,197,45,199,104,108,248,195,165,242,191,252,217,167,173,117,209,133,29,73,187,78,246,139,33,23,216,246,87,99,38,113,146,124,111,32,217,202,200,251,200,218,23,19,13";

  return click({
    appID,
    appInstanceID,
    clickParams: {
      ruleId: 0,
      targetMagnitude,
      priceMagnitude,
      signature,
    },
  });
}
