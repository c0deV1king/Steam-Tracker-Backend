import { expect } from "chai";
import { describe, it, before, afterEach } from "mocha";
import sinon from "sinon";
import axios from "axios";
import { ProfileService } from "../services/profile.service.js";
import Profile from "../models/profile.model.js";
import dotenv from "dotenv";
dotenv.config();

describe("Profile Service", () => {
  let profileService: ProfileService;
  let axiosGetStub: sinon.SinonStub;
  let profileFindOneStub: sinon.SinonStub;
  let profileCreateStub: sinon.SinonStub;
  let profileUpdateStub: sinon.SinonStub;
  let profileFindAllStub: sinon.SinonStub;

  before(() => {
    profileService = new ProfileService();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should fetch and update an existing profile", async () => {
    const mockSteamId = "123456789";
    const mockApiResponse = {
      data: {
        response: {
          players: [
            {
              steamid: mockSteamId,
              personaname: "TestUser",
              profileurl: "http://example.com",
              avatarfull: "http://example.com/avatar.jpg",
              loccountrycode: "US",
              timecreated: 1620000000,
            },
          ],
        },
      },
    };

    const mockExistingProfile = Profile.build({
      steamId: mockSteamId,
      personaName: "OldUser",
      profileUrl: "http://example.com",
      avatarFull: "http://example.com/avatar.jpg",
      locCountryCode: "US",
      timeCreated: 1610000000,
    });

    sinon.stub(mockExistingProfile, "update").resolves(mockExistingProfile);

    axiosGetStub = sinon.stub(axios, "get").resolves(mockApiResponse);
    profileFindOneStub = sinon
      .stub(Profile, "findOne")
      .resolves(mockExistingProfile);

    const result = await profileService.updateProfile(mockSteamId);

    // Assertions
    expect(axiosGetStub.calledOnce).to.be.true; // Ensure axios.get is called
    expect(profileFindOneStub.calledOnce).to.be.true; // Ensure Profile.findOne is called
    expect(result?.personaName).to.equal("TestUser"); // Ensure the profile is updated correctly
  });

  it("should fetch and create a new profile if it does not exist", async () => {
    const mockSteamId = "987654321";
    const mockApiResponse = {
      data: {
        response: {
          players: [
            {
              steamid: mockSteamId,
              personaname: "NewUser",
              profileurl: "http://example.com",
              avatarfull: "http://example.com/avatar.jpg",
              loccountrycode: "CA",
              timecreated: 1620000000,
            },
          ],
        },
      },
    };

    const mockNewProfile = Profile.build({
      steamId: mockSteamId,
      personaName: "NewUser",
      profileUrl: "http://example.com",
      avatarFull: "http://example.com/avatar.jpg",
      locCountryCode: "CA",
      timeCreated: 1620000000,
    });

    axiosGetStub = sinon.stub(axios, "get").resolves(mockApiResponse);
    profileFindOneStub = sinon.stub(Profile, "findOne").resolves(null);
    profileCreateStub = sinon.stub(Profile, "create").resolves(mockNewProfile);

    const result = await profileService.updateProfile(mockSteamId);

    expect(axiosGetStub.calledOnce).to.be.true;
    expect(profileFindOneStub.calledOnce).to.be.true;
    expect(profileCreateStub.calledOnce).to.be.true;
    expect(result?.personaName).to.equal("NewUser");
  });

  it("should throw an error if the Steam API request fails", async () => {
    const mockSteamId = "123456789";
    axiosGetStub = sinon.stub(axios, "get").rejects(new Error("API Error"));

    try {
      await profileService.updateProfile(mockSteamId);
    } catch (error) {
      const typedError = error as Error;
      expect(axiosGetStub.calledOnce).to.be.true;
      expect(typedError.message).to.equal("API Error");
    }
  });

  it("should retrieve all profiles from the database", async () => {
    const mockProfiles = [
      Profile.build({
        steamId: "123",
        personaName: "User1",
        profileUrl: "http://example.com/user1",
        avatarFull: "http://example.com/avatar1.jpg",
        locCountryCode: "US",
        timeCreated: 1610000000,
      }),
      Profile.build({
        steamId: "456",
        personaName: "User2",
        profileUrl: "http://example.com/user2",
        avatarFull: "http://example.com/avatar2.jpg",
        locCountryCode: "CA",
        timeCreated: 1620000000,
      }),
    ];

    profileFindAllStub = sinon.stub(Profile, "findAll").resolves(mockProfiles);

    const result = await profileService.getProfiles();

    expect(profileFindAllStub.calledOnce).to.be.true;
    expect(result).to.deep.equal(mockProfiles);
  });
});
