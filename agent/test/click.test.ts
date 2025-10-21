import { describe, it } from "node:test";
import assert from "node:assert";
import { simpleClick } from "./helpers/click.js";

describe("Click", async () => {
  it("should click", async () => {
    await simpleClick();
  });
});
