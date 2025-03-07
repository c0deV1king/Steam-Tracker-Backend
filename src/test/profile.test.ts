import { expect } from "chai";
import { describe, it, before } from "mocha";
import sinon from "sinon";
import axios from "axios";
import { ProfileService } from "../services/profile.service.js";
import dotenv from "dotenv";
dotenv.config();

// Arrange, Act, Assert

describe("Profile Service", () => {
  // group related tests

  before(() => {
    // runs before all tests

    afterEach(() => {
      // run after each test
    });

    it("should return mock profile", async () => {
      // individual test case
    });
  });
});
