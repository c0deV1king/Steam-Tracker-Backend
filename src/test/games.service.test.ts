import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("GamesService", () => {
  let service: any;
  let axiosGetStub: sinon.SinonStub;
  let gameBulkCreateStub: sinon.SinonStub;
  let gameUpdateStub: sinon.SinonStub;
  let gameFindAllStub: sinon.SinonStub;
  let GamesService: any;

  beforeEach(async () => {
    process.env.steamApiKey = "test-api-key";

    axiosGetStub = sinon.stub();
    gameBulkCreateStub = sinon.stub();
    gameUpdateStub = sinon.stub();
    gameFindAllStub = sinon.stub();

    const module = await esmock("../services/games.service.js", {
      axios: {
        default: { get: axiosGetStub },
        get: axiosGetStub,
      },
      "../models/games.model.js": {
        default: {
          bulkCreate: gameBulkCreateStub,
          update: gameUpdateStub,
          findAll: gameFindAllStub,
        },
      },
    });

    GamesService = module.GamesService;
    service = new GamesService();
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
        expect(() => new GamesService()).to.throw(
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
      expect(() => new GamesService()).to.not.throw();
    });
  });

  describe("fetchGames", () => {
    const mockSteamId = "76561198000000000";

    it("should fetch and store games successfully", async () => {
      const mockGamesResponse = {
        response: {
          game_count: 2,
          games: [
            {
              appid: 730,
              name: "Counter-Strike 2",
              playtime_forever: 1500,
              genres: [{ description: "Action" }],
              developers: ["Valve"],
              publishers: ["Valve"],
            },
            {
              appid: 570,
              name: "Dota 2",
              playtime_forever: 2000,
              genres: [{ description: "MOBA" }],
              developers: ["Valve"],
              publishers: ["Valve"],
            },
          ],
        },
      };

      const mockStoredGames = [
        {
          steamId: mockSteamId,
          appid: 730,
          gameName: "Counter-Strike 2",
          playtime_forever: 1500,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
          genres: [{ description: "Action" }],
          developers: "Valve",
          publishers: "Valve",
        },
        {
          steamId: mockSteamId,
          appid: 570,
          gameName: "Dota 2",
          playtime_forever: 2000,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/570/header.jpg",
          genres: [{ description: "MOBA" }],
          developers: "Valve",
          publishers: "Valve",
        },
      ];

      axiosGetStub.resolves({ data: mockGamesResponse });
      gameBulkCreateStub.resolves(mockStoredGames);

      const result = await service.fetchGames(mockSteamId);

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(
        axiosGetStub.calledWith(
          "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/",
          {
            params: {
              key: "test-api-key",
              steamid: mockSteamId,
              include_appinfo: true,
              include_played_free_games: true,
            },
          }
        )
      ).to.be.true;

      expect(gameBulkCreateStub.calledOnce).to.be.true;
      const bulkCreateArgs = gameBulkCreateStub.firstCall.args[0];
      expect(bulkCreateArgs).to.have.length(2);
      expect(bulkCreateArgs[0]).to.deep.include({
        steamId: mockSteamId,
        appid: 730,
        gameName: "Counter-Strike 2",
        playtime_forever: 1500,
        headerImage:
          "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
        developers: "Valve",
        publishers: "Valve",
      });

      expect(result).to.deep.equal(mockStoredGames);
    });

    it("should return null when no games found", async () => {
      axiosGetStub.resolves({
        data: {
          response: {
            game_count: 0,
            games: [],
          },
        },
      });

      const result = await service.fetchGames(mockSteamId);
      expect(result).to.be.null;
    });

    it("should handle missing game data gracefully", async () => {
      const mockGamesResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 730,
              // name is missing
              // playtime_forever is missing
              // genres is missing
              // developers is missing
              // publishers is missing
            },
          ],
        },
      };

      const mockStoredGames = [
        {
          steamId: mockSteamId,
          appid: 730,
          gameName: "Unknown Game",
          playtime_forever: 0,
          headerImage:
            "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
          genres: [],
          developers: undefined,
          publishers: undefined,
        },
      ];

      axiosGetStub.resolves({ data: mockGamesResponse });
      gameBulkCreateStub.resolves(mockStoredGames);

      const result = await service.fetchGames(mockSteamId);

      expect(gameBulkCreateStub.calledOnce).to.be.true;
      const bulkCreateArgs = gameBulkCreateStub.firstCall.args[0];
      expect(bulkCreateArgs[0].gameName).to.equal("Unknown Game");
      expect(bulkCreateArgs[0].playtime_forever).to.equal(0);
      expect(bulkCreateArgs[0].genres).to.deep.equal([]);
    });

    it("should handle API errors and throw", async () => {
      axiosGetStub.rejects(new Error("Steam API Error"));

      try {
        await service.fetchGames(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Steam API Error");
      }
    });

    it("should handle database errors and throw", async () => {
      const mockGamesResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 730,
              name: "Counter-Strike 2",
              playtime_forever: 1500,
            },
          ],
        },
      };

      axiosGetStub.resolves({ data: mockGamesResponse });
      gameBulkCreateStub.rejects(new Error("Database Error"));

      try {
        await service.fetchGames(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Error");
      }
    });

    it("should handle array developers and publishers", async () => {
      const mockGamesResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 123,
              name: "Test Game",
              playtime_forever: 100,
              developers: ["Dev1", "Dev2"],
              publishers: ["Pub1", "Pub2"],
            },
          ],
        },
      };

      axiosGetStub.resolves({ data: mockGamesResponse });
      gameBulkCreateStub.resolves([]);

      await service.fetchGames(mockSteamId);

      const bulkCreateArgs = gameBulkCreateStub.firstCall.args[0];
      expect(bulkCreateArgs[0].developers).to.equal("Dev1, Dev2");
      expect(bulkCreateArgs[0].publishers).to.equal("Pub1, Pub2");
    });
  });

  describe("fetchExtraGameDetails", () => {
    const mockAppId = "730";
    const mockSteamId = "76561198000000000";

    it("should fetch and update extra game details successfully", async () => {
      const mockAppDetailsResponse = {
        "730": {
          success: true,
          data: {
            developers: ["Valve Corporation"],
            publishers: ["Valve"],
            genres: [
              { description: "Action" },
              { description: "Free to Play" },
            ],
            categories: [
              { description: "Multi-player" },
              { description: "Online PvP" },
            ],
          },
        },
      };

      axiosGetStub.resolves({ data: mockAppDetailsResponse });
      gameUpdateStub.resolves([1]); // 1 row updated

      await service.fetchExtraGameDetails(mockAppId, mockSteamId);

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(
        axiosGetStub.calledWith(
          "https://store.steampowered.com/api/appdetails",
          {
            params: {
              appids: mockAppId,
            },
          }
        )
      ).to.be.true;

      expect(gameUpdateStub.calledOnce).to.be.true;
      const updateArgs = gameUpdateStub.firstCall.args;
      expect(updateArgs[0]).to.deep.include({
        developers: "Valve Corporation",
        publishers: "Valve",
      });
      expect(updateArgs[0].genres).to.have.length(2);
      expect(updateArgs[0].categories).to.have.length(2);
      expect(updateArgs[1]).to.deep.equal({
        where: {
          appid: mockAppId,
          steamId: mockSteamId,
        },
      });
    });

    it("should handle missing app details gracefully", async () => {
      const mockAppDetailsResponse = {
        "730": {
          success: false,
        },
      };

      axiosGetStub.resolves({ data: mockAppDetailsResponse });

      await service.fetchExtraGameDetails(mockAppId, mockSteamId);

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(gameUpdateStub.called).to.be.false;
    });

    it("should handle missing data in successful response", async () => {
      const mockAppDetailsResponse = {
        "730": {
          success: true,
          // data is missing
        },
      };

      axiosGetStub.resolves({ data: mockAppDetailsResponse });

      await service.fetchExtraGameDetails(mockAppId, mockSteamId);

      expect(gameUpdateStub.called).to.be.false;
    });

    it("should handle partial data in app details", async () => {
      const mockAppDetailsResponse = {
        "730": {
          success: true,
          data: {
            developers: ["Valve Corporation"],
            // publishers, genres, and categories are missing
          },
        },
      };

      axiosGetStub.resolves({ data: mockAppDetailsResponse });
      gameUpdateStub.resolves([1]);

      await service.fetchExtraGameDetails(mockAppId, mockSteamId);

      const updateArgs = gameUpdateStub.firstCall.args[0];
      expect(updateArgs.developers).to.equal("Valve Corporation");
      expect(updateArgs.publishers).to.be.undefined;
      expect(updateArgs.genres).to.be.undefined;
      expect(updateArgs.categories).to.be.undefined;
    });

    it("should handle API errors and throw", async () => {
      axiosGetStub.rejects(new Error("Steam Store API Error"));

      try {
        await service.fetchExtraGameDetails(mockAppId, mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Steam Store API Error");
      }
    });

    it("should handle database update errors and throw", async () => {
      const mockAppDetailsResponse = {
        "730": {
          success: true,
          data: {
            developers: ["Valve Corporation"],
          },
        },
      };

      axiosGetStub.resolves({ data: mockAppDetailsResponse });
      gameUpdateStub.rejects(new Error("Database Update Error"));

      try {
        await service.fetchExtraGameDetails(mockAppId, mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Update Error");
      }
    });

    it("should handle no rows updated", async () => {
      const mockAppDetailsResponse = {
        "730": {
          success: true,
          data: {
            developers: ["Valve Corporation"],
          },
        },
      };

      axiosGetStub.resolves({ data: mockAppDetailsResponse });
      gameUpdateStub.resolves([0]); // 0 rows updated

      // Should not throw an error
      await service.fetchExtraGameDetails(mockAppId, mockSteamId);

      expect(gameUpdateStub.calledOnce).to.be.true;
    });
  });

  describe("getGames", () => {
    const mockSteamId = "76561198000000000";

    it("should retrieve games from database", async () => {
      const mockGames = [
        {
          steamId: mockSteamId,
          appid: 730,
          gameName: "Counter-Strike 2",
          playtime_forever: 1500,
          headerImage: "header.jpg",
          genres: [{ description: "Action" }],
          developers: "Valve",
          publishers: "Valve",
        },
        {
          steamId: mockSteamId,
          appid: 570,
          gameName: "Dota 2",
          playtime_forever: 2000,
          headerImage: "header2.jpg",
          genres: [{ description: "MOBA" }],
          developers: "Valve",
          publishers: "Valve",
        },
      ];

      gameFindAllStub.resolves(mockGames);

      const result = await service.getGames(mockSteamId);

      expect(gameFindAllStub.calledOnce).to.be.true;
      expect(gameFindAllStub.calledWith({ where: { steamId: mockSteamId } })).to
        .be.true;
      expect(result).to.deep.equal(mockGames);
    });

    it("should return empty array when no games found", async () => {
      gameFindAllStub.resolves([]);

      const result = await service.getGames(mockSteamId);

      expect(result).to.deep.equal([]);
    });

    it("should handle database errors and throw", async () => {
      gameFindAllStub.rejects(new Error("Database Error"));

      try {
        await service.getGames(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Error");
      }
    });
  });
});
