import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import sinon from "sinon";
import axios from "axios";
import { ProfileService } from "../services/profile.service.js";
import dotenv from "dotenv";
dotenv.config();

// Arrange, Act, Assert

describe("Profile Service", () => {
  // group related tests
  let profileService: ProfileService;
  let updateProfile: sinon.SinonStub;
  let mockProfile: any;
  beforeEach(() => {
    // runs before each test
    profileService = new ProfileService();
    // mock data should be defined before each test
    const now = new Date("2025-02-27T00:00:00Z");
    mockProfile = {
      id: 1,
      steamid: "666",
      personaName: "Egghead",
      profileUrl: "https://steamcommunity.com/id/egghead",
      avatarFull: "avatar url",
      locCountryCode: "CA",
      timeCreated: 1234567890,
      createdAt: now,
      updatedAt: now,
    };

    // "stub" axios to prevent actual API calls
    updateProfile = sinon
      .stub(axios, "post")
      .resolves({ data: { ...mockProfile } });
    console.log("mockProfile in BeforeEach", mockProfile);
  });

  afterEach(() => {
    // run after each test
    // restore axios to its original state
    updateProfile.restore();
  });

  it("should return mock profile", async () => {
    console.log(mockProfile);
    // individual test case
    const profile = await profileService.updateProfile("666", {});

    expect(profile).to.deep.equal(mockProfile);
    expect(updateProfile.calledOnce).to.be.true;
  });
});
