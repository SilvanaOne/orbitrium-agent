import { describe, it } from "node:test";
import { updateAgent } from "./helpers/update.js";

describe("Update Agent Method", () => {
  it("should update agent method", async () => {
    await updateAgent();
  });
});
