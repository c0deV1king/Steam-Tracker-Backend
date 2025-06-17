import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("RecentGamesService", () => {
  let service: any;
  let axiosGetStub: sinon.SinonStub;
  let recentGameBulkCreateStub: sinon.SinonStub;
  let recentGameFindAllStub: sinon.SinonStub;
  let rateLimitDelayStub: sinon.SinonStub;
  let RecentGamesService: any;

  beforeEach(async () => {
    process.env.steamApiKey = "test-api-key";

    axiosGetStub = sinon.stub();
    recentGameBulkCreateStub = sinon.stub();
    recentGameFindAllStub = sinon.stub();
    rateLimitDelayStub = sinon.stub();

    const module = await esmock("../services/recent.games.service.js", {
      axios: {
        default: { get: axiosGetStub },
        get: axiosGetStub,
      },
      "../models/recent.games.model.js": {
        default: {
          bulkCreate: recentGameBulkCreateStub,
          findAll: recentGameFindAllStub,
        },
      },
      "../utils.js": {
        rateLimitDelay: rateLimitDelayStub,
      },
    });

    RecentGamesService = module.RecentGamesService;
    service = new RecentGamesService();
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
        expect(() => new RecentGamesService()).to.throw(
          "Steam API key not found in environment variables"
        );
      } finally {
        // Restore the original API key
        if (originalApiKey) {
          process.env.steamApiKey = originalApiKey;
        }
      }
    });

    it("should initialize with Steam API key from environment", () => {
      expect(() => new RecentGamesService()).to.not.throw();
    });
  });

  describe("fetchGameScreenshots", () => {
    it("should return screenshots when API call is successful", async () => {
      const mockScreenshots = [
        { id: 1, path_thumbnail: "thumb1.jpg", path_full: "full1.jpg" },
        { id: 2, path_thumbnail: "thumb2.jpg", path_full: "full2.jpg" },
      ];

      axiosGetStub.resolves({
        data: {
          "12345": {
            success: true,
            data: {
              screenshots: mockScreenshots,
            },
          },
        },
      });

      const result = await service.fetchGameScreenshots(12345);
      expect(result).to.deep.equal(mockScreenshots);
    });

    it("should return null when API call fails", async () => {
      axiosGetStub.rejects(new Error("API Error"));

      const result = await service.fetchGameScreenshots(12345);
      expect(result).to.be.null;
    });

    it("should return null when success is false", async () => {
      axiosGetStub.resolves({
        data: {
          "12345": {
            success: false,
          },
        },
      });

      const result = await service.fetchGameScreenshots(12345);
      expect(result).to.be.null;
    });
  });

  describe("fetchRecentGames", () => {
    const mockSteamId = "76561198000000000";

    it("should fetch and store recent games successfully", async () => {
      const mockGamesResponse = {
        response: {
          game_count: 2,
          games: [
            {
              appid: 730,
              name: "Counter-Strike 2",
              playtime_2weeks: 120,
              playtime_forever: 1500,
            },
            {
              appid: 570,
              name: "Dota 2",
              playtime_2weeks: 80,
              playtime_forever: 2000,
            },
          ],
        },
      };

      const mockScreenshots = [
        { id: 1, path_thumbnail: "thumb1.jpg", path_full: "full1.jpg" },
      ];

      const mockStoredGames = [
        {
          steamId: mockSteamId,
          appid: 730,
          name: "Counter-Strike 2",
          playtime_2weeks: 120,
          playtime_forever: 1500,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
          screenshots: mockScreenshots,
        },
      ];

      // Mock API calls
      axiosGetStub.onFirstCall().resolves({ data: mockGamesResponse });
      axiosGetStub.onSecondCall().resolves({
        data: {
          "730": { success: true, data: { screenshots: mockScreenshots } },
        },
      });
      axiosGetStub.onThirdCall().resolves({
        data: {
          "570": { success: true, data: { screenshots: mockScreenshots } },
        },
      });

      recentGameBulkCreateStub.resolves();
      recentGameFindAllStub.resolves(mockStoredGames);
      rateLimitDelayStub.resolves();

      const result = await service.fetchRecentGames(mockSteamId);

      expect(axiosGetStub.callCount).to.equal(3);
      expect(recentGameBulkCreateStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockStoredGames);
    });

    it("should return null when no recent games found", async () => {
      axiosGetStub.resolves({
        data: {
          response: {
            game_count: 0,
            games: [],
          },
        },
      });

      const result = await service.fetchRecentGames(mockSteamId);
      expect(result).to.be.null;
    });

    it("should handle API errors and throw", async () => {
      axiosGetStub.rejects(new Error("Steam API Error"));

      try {
        await service.fetchRecentGames(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("should handle missing game data gracefully", async () => {
      const mockGamesResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 730,
              // name is missing
              // playtime_2weeks is missing
              // playtime_forever is missing
            },
          ],
        },
      };

      axiosGetStub.onFirstCall().resolves({ data: mockGamesResponse });
      axiosGetStub.onSecondCall().resolves({
        data: {
          "730": { success: false },
        },
      });

      recentGameBulkCreateStub.resolves();
      recentGameFindAllStub.resolves([]);
      rateLimitDelayStub.resolves();

      const result = await service.fetchRecentGames(mockSteamId);

      expect(recentGameBulkCreateStub.calledOnce).to.be.true;
      const bulkCreateArgs = recentGameBulkCreateStub.firstCall.args[0];
      expect(bulkCreateArgs[0].name).to.equal("Unknown Game");
      expect(bulkCreateArgs[0].playtime_2weeks).to.equal(0);
      expect(bulkCreateArgs[0].playtime_forever).to.equal(0);
    });
  });

  describe("getRecentGames", () => {
    const mockSteamId = "76561198000000000";

    it("should retrieve recent games from database", async () => {
      const mockGames = [
        {
          steamId: mockSteamId,
          appid: 730,
          name: "Counter-Strike 2",
          playtime_2weeks: 120,
          playtime_forever: 1500,
          headerImage: "header.jpg",
          screenshots: [],
        },
      ];

      recentGameFindAllStub.resolves(mockGames);

      const result = await service.getRecentGames(mockSteamId);

      expect(recentGameFindAllStub.calledOnce).to.be.true;
      expect(
        recentGameFindAllStub.calledWith({ where: { steamId: mockSteamId } })
      ).to.be.true;
      expect(result).to.deep.equal(mockGames);
    });

    it("should handle database errors and throw", async () => {
      recentGameFindAllStub.rejects(new Error("Database Error"));

      try {
        await service.getRecentGames(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });
});
