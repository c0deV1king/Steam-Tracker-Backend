import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { profileService } from "../services/profile.service.js";
import dotenv from "dotenv";
dotenv.config();

// Arrange, Act, Assert

describe("Profile Service", () => {
  let service: profileService;
  // Test case
  beforeEach(() => {
    process.env.steamApiKey = process.env.steamApiKey || "";

    service = new profileService();
  });

  it("should return a Profile object", async function () {
    // Act
    const profile = await service.updateProfile("76561198119786249", {});
    // Assert
    expect(profile).to.not.be.null;
  });
});
