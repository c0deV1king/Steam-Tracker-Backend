import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("ProfileService", () => {
  let service: any;
  let axiosGetStub: sinon.SinonStub;
  let profileUpsertStub: sinon.SinonStub;
  let profileFindAllStub: sinon.SinonStub;
  let ProfileService: any;

  beforeEach(async () => {
    process.env.steamApiKey = "test-api-key";

    axiosGetStub = sinon.stub();
    profileUpsertStub = sinon.stub();
    profileFindAllStub = sinon.stub();

    const module = await esmock("../services/profile.service.js", {
      axios: {
        default: { get: axiosGetStub },
        get: axiosGetStub,
      },
      "../models/profile.model.js": {
        default: {
          upsert: profileUpsertStub,
          findAll: profileFindAllStub,
        },
      },
    });

    ProfileService = module.ProfileService;
    service = new ProfileService();
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.steamApiKey;
  });

  describe("constructor", () => {
    it("should throw error when Steam API key is not provided", () => {
      // Temporarily store and remove the API key
      const originalApiKey = process.env.steamApiKey;
      delete process.env.steamApiKey;

      try {
        expect(() => new ProfileService()).to.throw(
          "Steam API key or Steam ID not found in environment variables"
        );
      } finally {
        // Restore the original API key
        if (originalApiKey) {
          process.env.steamApiKey = originalApiKey;
        }
      }
    });

    it("should initialize with Steam API key from environment", () => {
      expect(() => new ProfileService()).to.not.throw();
    });
  });

  describe("updateProfile", () => {
    const mockSteamId = "76561198000000000";

    it("should fetch and store profile successfully", async () => {
      const mockProfileResponse = {
        data: {
          response: {
            players: [
              {
                steamid: mockSteamId,
                personaname: "TestUser",
                profileurl: "https://steamcommunity.com/id/testuser/",
                avatarfull: "https://avatars.steamstatic.com/test_full.jpg",
                loccountrycode: "US",
                timecreated: 1234567890,
              },
            ],
          },
        },
      };

      const mockStoredProfile = {
        steamId: mockSteamId,
        personaName: "TestUser",
        profileUrl: "https://steamcommunity.com/id/testuser/",
        avatarFull: "https://avatars.steamstatic.com/test_full.jpg",
        locCountryCode: "US",
        timeCreated: 1234567890,
      };

      axiosGetStub.resolves(mockProfileResponse);
      profileUpsertStub.resolves([mockStoredProfile, true]); // true means created

      const result = await service.updateProfile(mockSteamId);

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(
        axiosGetStub.calledWith(
          "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
          {
            params: {
              key: "test-api-key",
              steamids: mockSteamId,
            },
          }
        )
      ).to.be.true;

      expect(profileUpsertStub.calledOnce).to.be.true;
      expect(
        profileUpsertStub.calledWith({
          steamId: mockSteamId,
          personaName: "TestUser",
          profileUrl: "https://steamcommunity.com/id/testuser/",
          avatarFull: "https://avatars.steamstatic.com/test_full.jpg",
          locCountryCode: "US",
          timeCreated: 1234567890,
        })
      ).to.be.true;

      expect(result).to.deep.equal(mockStoredProfile);
    });

    it("should update existing profile successfully", async () => {
      const mockProfileResponse = {
        data: {
          response: {
            players: [
              {
                steamid: mockSteamId,
                personaname: "UpdatedUser",
                profileurl: "https://steamcommunity.com/id/updateduser/",
                avatarfull: "https://avatars.steamstatic.com/updated_full.jpg",
                loccountrycode: "CA",
                timecreated: 1234567890,
              },
            ],
          },
        },
      };

      const mockStoredProfile = {
        steamId: mockSteamId,
        personaName: "UpdatedUser",
        profileUrl: "https://steamcommunity.com/id/updateduser/",
        avatarFull: "https://avatars.steamstatic.com/updated_full.jpg",
        locCountryCode: "CA",
        timeCreated: 1234567890,
      };

      axiosGetStub.resolves(mockProfileResponse);
      profileUpsertStub.resolves([mockStoredProfile, false]); // false means updated

      const result = await service.updateProfile(mockSteamId);

      expect(result).to.deep.equal(mockStoredProfile);
    });

    it("should handle missing optional fields", async () => {
      const mockProfileResponse = {
        data: {
          response: {
            players: [
              {
                steamid: mockSteamId,
                personaname: "MinimalUser",
                profileurl: "https://steamcommunity.com/id/minimaluser/",
                avatarfull: "https://avatars.steamstatic.com/minimal_full.jpg",
                // loccountrycode and timecreated are missing
              },
            ],
          },
        },
      };

      const mockStoredProfile = {
        steamId: mockSteamId,
        personaName: "MinimalUser",
        profileUrl: "https://steamcommunity.com/id/minimaluser/",
        avatarFull: "https://avatars.steamstatic.com/minimal_full.jpg",
        locCountryCode: undefined,
        timeCreated: undefined,
      };

      axiosGetStub.resolves(mockProfileResponse);
      profileUpsertStub.resolves([mockStoredProfile, true]);

      const result = await service.updateProfile(mockSteamId);

      expect(
        profileUpsertStub.calledWith({
          steamId: mockSteamId,
          personaName: "MinimalUser",
          profileUrl: "https://steamcommunity.com/id/minimaluser/",
          avatarFull: "https://avatars.steamstatic.com/minimal_full.jpg",
          locCountryCode: undefined,
          timeCreated: undefined,
        })
      ).to.be.true;

      expect(result).to.deep.equal(mockStoredProfile);
    });

    it("should handle API errors and throw", async () => {
      axiosGetStub.rejects(new Error("Steam API Error"));

      try {
        await service.updateProfile(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Steam API Error");
      }
    });

    it("should handle database errors and throw", async () => {
      const mockProfileResponse = {
        data: {
          response: {
            players: [
              {
                steamid: mockSteamId,
                personaname: "TestUser",
                profileurl: "https://steamcommunity.com/id/testuser/",
                avatarfull: "https://avatars.steamstatic.com/test_full.jpg",
              },
            ],
          },
        },
      };

      axiosGetStub.resolves(mockProfileResponse);
      profileUpsertStub.rejects(new Error("Database Error"));

      try {
        await service.updateProfile(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Error");
      }
    });

    it("should handle empty response from Steam API", async () => {
      const mockProfileResponse = {
        data: {
          response: {
            players: [],
          },
        },
      };

      axiosGetStub.resolves(mockProfileResponse);

      try {
        await service.updateProfile(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(TypeError);
      }
    });
  });

  describe("getProfiles", () => {
    const mockSteamId = "76561198000000000";

    it("should retrieve profiles from database", async () => {
      const mockProfiles = [
        {
          steamId: mockSteamId,
          personaName: "TestUser",
          profileUrl: "https://steamcommunity.com/id/testuser/",
          avatarFull: "https://avatars.steamstatic.com/test_full.jpg",
          locCountryCode: "US",
          timeCreated: 1234567890,
        },
      ];

      profileFindAllStub.resolves(mockProfiles);

      const result = await service.getProfiles(mockSteamId);

      expect(profileFindAllStub.calledOnce).to.be.true;
      expect(profileFindAllStub.calledWith({ where: { steamId: mockSteamId } }))
        .to.be.true;
      expect(result).to.deep.equal(mockProfiles);
    });

    it("should return empty array when no profiles found", async () => {
      profileFindAllStub.resolves([]);

      const result = await service.getProfiles(mockSteamId);

      expect(result).to.deep.equal([]);
    });

    it("should handle database errors and throw", async () => {
      profileFindAllStub.rejects(new Error("Database Error"));

      try {
        await service.getProfiles(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Error");
      }
    });
  });
});
