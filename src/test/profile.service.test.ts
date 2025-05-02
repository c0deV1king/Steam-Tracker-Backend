import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import Profile from "../models/profile.model.js";
import { ProfileService } from "../services/profile.service.js";

describe("ProfileService", () => {
  let profileService: ProfileService;
  let axiosGetStub: sinon.SinonStub;
  let profileFindOneStub: sinon.SinonStub;
  let profileCreateStub: sinon.SinonStub;
  let profileUpdateStub: sinon.SinonStub;

  beforeEach(() => {
    // Mock environment variables
    process.env.steamApiKey = "test-api-key";
    process.env.steamId = "test-steam-id";

    profileService = new ProfileService();

    // Stub the axios.get method
    axiosGetStub = sinon.stub(axios, "get");

    // Stub the Profile model methods
    profileFindOneStub = sinon.stub(Profile, "findOne");
    profileCreateStub = sinon.stub(Profile, "create");
    profileUpdateStub = sinon.stub(Profile, "update");
  });

  afterEach(() => {
    // Restore all stubs after each test
    sinon.restore();
  });

  describe("updateProfile", () => {
    it("should fetch and update an existing profile", async () => {
      const steamId = "123456789";
      const mockProfileData = {
        response: {
          players: [
            {
              steamid: steamId,
              personaname: "TestUser",
              profileurl: "http://example.com",
              avatarfull: "http://example.com/avatar.jpg",
              loccountrycode: "US",
              timecreated: 1620000000,
            },
          ],
        },
      };

      const existingProfile = {
        steamId,
        personaName: "OldUser",
        profileUrl: "http://oldexample.com",
        avatarFull: "http://oldexample.com/avatar.jpg",
        locCountryCode: "CA",
        timeCreated: 1610000000,
      };

      const updatedProfileData = {
        steamId,
        personaName: "TestUser",
        profileUrl: "http://example.com",
        avatarFull: "http://example.com/avatar.jpg",
        locCountryCode: "US",
        timeCreated: 1620000000,
      };

      // Setup stubs with appropriate return values
      // The axios response should match what your service expects
      axiosGetStub.resolves({
        data: mockProfileData,
      });

      // First findOne call returns the existing profile
      profileFindOneStub.onFirstCall().resolves(existingProfile);
      // Second findOne call after update returns the updated profile
      profileFindOneStub.onSecondCall().resolves(updatedProfileData);

      // Update stub just needs to resolve (the value isn't used)
      profileUpdateStub.resolves([1]);

      const result = await profileService.updateProfile(steamId);

      // Verify axios.get was called once with the right parameters
      expect(axiosGetStub.calledOnce).to.be.true;
      expect(axiosGetStub.firstCall.args[0]).to.equal(
        "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/"
      );
      expect(axiosGetStub.firstCall.args[1].params).to.have.property(
        "steamids",
        steamId
      );

      // Verify findOne was called twice (once before update, once after)
      expect(profileFindOneStub.calledTwice).to.be.true;

      // Verify first findOne call had right where clause
      expect(profileFindOneStub.firstCall.args[0]).to.deep.include({
        where: { steamId },
      });

      // Verify update was called with right parameters
      expect(profileUpdateStub.calledOnce).to.be.true;

      // Check update arguments - matching your service's actual parameters
      const updateArgs = profileUpdateStub.firstCall.args[0];
      expect(updateArgs).to.deep.include({
        personaName: "TestUser",
        profileUrl: "http://example.com",
        avatarFull: "http://example.com/avatar.jpg",
        locCountryCode: "US",
        timeCreated: 1620000000,
      });

      // Check where clause - note it uses steamid from the profile, not the function parameter
      expect(profileUpdateStub.firstCall.args[1]).to.deep.equal({
        where: { steamId },
      });

      // Verify result matches what we expect
      expect(result).to.deep.equal(updatedProfileData);
    });

    it("should fetch and create a new profile if it does not exist", async () => {
      const steamId = "123456789";
      const mockProfileData = {
        response: {
          players: [
            {
              steamid: steamId,
              personaname: "TestUser",
              profileurl: "http://example.com",
              avatarfull: "http://example.com/avatar.jpg",
              loccountrycode: "US",
              timecreated: 1620000000,
            },
          ],
        },
      };

      const createdProfile = {
        steamId,
        personaName: "TestUser",
        profileUrl: "http://example.com",
        avatarFull: "http://example.com/avatar.jpg",
        locCountryCode: "US",
        timeCreated: 1620000000,
      };

      // Setup stubs for the "create" case
      axiosGetStub.resolves({ data: mockProfileData });

      // First findOne returns null (no existing profile)
      profileFindOneStub.onFirstCall().resolves(null);
      // Second findOne after create returns the new profile
      profileFindOneStub.onSecondCall().resolves(createdProfile);

      // Create stub just needs to resolve (the value isn't used)
      profileCreateStub.resolves({});

      const result = await profileService.updateProfile(steamId);

      // Verify axios.get was called with correct parameters
      expect(axiosGetStub.calledOnce).to.be.true;

      // Verify findOne was called twice (once before create, once after)
      expect(profileFindOneStub.calledTwice).to.be.true;

      // Verify create was called with correct parameters
      expect(profileCreateStub.calledOnce).to.be.true;

      // Check create arguments - matching your service's actual parameters
      const createArgs = profileCreateStub.firstCall.args[0];
      expect(createArgs).to.deep.equal({
        steamId,
        personaName: "TestUser",
        profileUrl: "http://example.com",
        avatarFull: "http://example.com/avatar.jpg",
        locCountryCode: "US",
        timeCreated: 1620000000,
      });

      // Verify result matches expected
      expect(result).to.deep.equal(createdProfile);
    });

    it("should throw an error if the API call fails", async () => {
      const steamId = "123456789";
      axiosGetStub.rejects(new Error("API Error"));

      try {
        await profileService.updateProfile(steamId);
        // If we get here, the test should fail
        expect.fail("Expected an error to be thrown");
      } catch (error) {
        expect((error as Error).message).to.equal("API Error");
      }

      expect(axiosGetStub.calledOnce).to.be.true;
    });
  });
});
