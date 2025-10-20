import { describe, it } from "node:test";
import assert from "node:assert";
import { createApp } from "./helpers/create.js";

describe("Deploy App for Coordinator", async () => {
  it("should create app", async () => {
    console.log("\n🚀 Creating new app...");

    // Get package ID from environment
    const packageID = process.env.APP_PACKAGE_ID;
    assert.ok(packageID !== undefined, "APP_PACKAGE_ID is not set");
    console.log("📦 Package ID:", packageID);

    await createApp();
  });
});
