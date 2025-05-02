import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import { RecentGamesService } from "../services/recent.games.service.js";
import RecentGame from "../models/recent.games.model.js";
import sequelize from "../db/db.js";

describe("RecentGamesService", () => {
  let service: RecentGamesService;
  let axiosGetStub: sinon.SinonStub;
  let sequelizeSyncStub: sinon.SinonStub;
  let recentGameFindAllStub: sinon.SinonStub;
  let recentGameUpsertStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    // Set environment variables for testing
    process.env.steamApiKey = "test-api-key";
    process.env.steamId = "test-steam-id";

    // Create stubs
    axiosGetStub = sinon.stub(axios, "get");
    sequelizeSyncStub = sinon.stub(sequelize, "sync").resolves();
    recentGameFindAllStub = sinon.stub(RecentGame, "findAll");

    // Fix the type issue by creating a proper mock instance
    const mockInstance = Object.create(RecentGame.prototype);
    recentGameUpsertStub = sinon
      .stub(RecentGame, "upsert")
      .resolves([mockInstance, true]);

    // Stub console methods to avoid test output noise
    consoleLogStub = sinon.stub(console, "log");
    consoleErrorStub = sinon.stub(console, "error");

    // Create service instance
    service = new RecentGamesService();
    // Replace actual delay with immediate resolution
    sinon.stub(service, "rateLimitDelay").resolves();
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.steamApiKey;
    delete process.env.steamId;
  });

  describe("constructor", () => {
    it("should throw an error if steamApiKey is not provided", () => {
      delete process.env.steamApiKey;
      expect(() => new RecentGamesService()).to.throw(
        "Steam API key or Steam ID not found in environment variables"
      );
    });

    it("should throw an error if steamId is not provided", () => {
      delete process.env.steamId;
      expect(() => new RecentGamesService()).to.throw(
        "Steam API key or Steam ID not found in environment variables"
      );
    });

    it("should create a service instance correctly with valid environment variables", () => {
      const service = new RecentGamesService();
      expect(service).to.be.an.instanceOf(RecentGamesService);
      expect((service as any).steamApiKey).to.equal("test-api-key");
      expect((service as any).steamId).to.equal("test-steam-id");
    });
  });

  describe("fetchRecentGames", () => {
    it("should fetch recent games from Steam API and store them in database", async () => {
      const mockSteamResponse = {
        response: {
          game_count: 2,
          games: [
            {
              appid: 123,
              name: "Game 1",
              playtime_2weeks: 120,
              playtime_forever: 1200,
            },
            {
              appid: 456,
              name: "Game 2",
              playtime_2weeks: 60,
              playtime_forever: 600,
            },
          ],
        },
      };

      const mockDbResponse = [
        {
          appid: 123,
          name: "Game 1",
          playtime_2weeks: 120,
          playtime_forever: 1200,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/123/header.jpg",
        },
        {
          appid: 456,
          name: "Game 2",
          playtime_2weeks: 60,
          playtime_forever: 600,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/456/header.jpg",
        },
      ];

      axiosGetStub.resolves({ data: mockSteamResponse });
      recentGameFindAllStub.resolves(mockDbResponse);

      const result = await service.fetchRecentGames("test-steam-id");

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(sequelizeSyncStub.calledOnce).to.be.true;
      expect(recentGameUpsertStub.callCount).to.equal(2);
      expect(recentGameFindAllStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockDbResponse);

      // Verify the correct parameters are passed to axios.get
      expect(axiosGetStub.firstCall.args[0]).to.equal(
        "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/"
      );
      expect(axiosGetStub.firstCall.args[1].params).to.deep.equal({
        key: "test-api-key",
        steamid: "test-steam-id",
      });

      // Verify the correct parameters are passed to upsert
      expect(recentGameUpsertStub.firstCall.args[0]).to.deep.equal({
        appid: 123,
        name: "Game 1",
        playtime_2weeks: 120,
        playtime_forever: 1200,
        headerImage:
          "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/123/header.jpg",
      });
    });

    it("should return null when no games are found", async () => {
      const mockSteamResponse = {
        response: {
          game_count: 0,
          games: [],
        },
      };

      axiosGetStub.resolves({ data: mockSteamResponse });

      const result = await service.fetchRecentGames("test-steam-id");

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(sequelizeSyncStub.calledOnce).to.be.true;
      expect(recentGameUpsertStub.notCalled).to.be.true;
      expect(result).to.be.null;
    });

    it("should handle API errors correctly", async () => {
      const errorMessage = "API Error";
      axiosGetStub.rejects(new Error(errorMessage));

      try {
        await service.fetchRecentGames("test-steam-id");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error).to.be.an("Error");
        expect(error.message).to.equal(errorMessage);
        expect(consoleErrorStub.calledOnce).to.be.true;
        expect(consoleErrorStub.firstCall.args[0]).to.equal(
          "Error fetching recent games:"
        );
      }
    });

    it("should handle missing game name by using 'Unknown Game'", async () => {
      const mockSteamResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 123,
              // Name is missing
              playtime_2weeks: 120,
              playtime_forever: 1200,
            },
          ],
        },
      };

      const mockDbResponse = [
        {
          appid: 123,
          name: "Unknown Game",
          playtime_2weeks: 120,
          playtime_forever: 1200,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/123/header.jpg",
        },
      ];

      axiosGetStub.resolves({ data: mockSteamResponse });
      recentGameFindAllStub.resolves(mockDbResponse);

      const result = await service.fetchRecentGames("test-steam-id");

      expect(result).to.deep.equal(mockDbResponse);
      expect(recentGameUpsertStub.firstCall.args[0].name).to.equal(
        "Unknown Game"
      );
    });

    it("should handle missing playtime values by using 0", async () => {
      const mockSteamResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 123,
              name: "Game 1",
              // playtime values missing
            },
          ],
        },
      };

      axiosGetStub.resolves({ data: mockSteamResponse });
      recentGameFindAllStub.resolves([]);

      await service.fetchRecentGames("test-steam-id");

      expect(recentGameUpsertStub.firstCall.args[0].playtime_2weeks).to.equal(
        0
      );
      expect(recentGameUpsertStub.firstCall.args[0].playtime_forever).to.equal(
        0
      );
    });
  });

  describe("getRecentGames", () => {
    it("should return all recent games from database", async () => {
      const mockGames = [
        {
          appid: 123,
          name: "Game 1",
          playtime_2weeks: 120,
          playtime_forever: 1200,
        },
        {
          appid: 456,
          name: "Game 2",
          playtime_2weeks: 60,
          playtime_forever: 600,
        },
      ];

      recentGameFindAllStub.resolves(mockGames);

      const result = await service.getRecentGames();

      expect(sequelizeSyncStub.calledOnce).to.be.true;
      expect(recentGameFindAllStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockGames);
      expect(sequelizeSyncStub.firstCall.args[0]).to.deep.equal({
        force: false,
      });
    });

    it("should handle database errors correctly", async () => {
      const errorMessage = "Database Error";
      recentGameFindAllStub.rejects(new Error(errorMessage));

      try {
        await service.getRecentGames();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error).to.be.an("Error");
        expect(error.message).to.equal(errorMessage);
        expect(consoleErrorStub.calledOnce).to.be.true;
        expect(consoleErrorStub.firstCall.args[0]).to.equal(
          "Error retrieving recent games:"
        );
      }
    });
  });

  describe("rateLimitDelay", () => {
    it("should delay execution within the specified range", async () => {
      // Restore the stub so we can test the actual implementation
      sinon.restore();
      service = new RecentGamesService();

      const startTime = Date.now();
      await service.rateLimitDelay(100, 300);
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(elapsed).to.be.at.least(100);
      expect(elapsed).to.be.at.most(350); // Added some buffer for test execution
    });
  });
});
