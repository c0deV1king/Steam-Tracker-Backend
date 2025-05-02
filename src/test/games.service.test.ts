import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import { GamesService } from "../services/games.service.js";
import Game from "../models/games.model.js";
import sequelize from "../db/db.js";

describe("GamesService", () => {
  let service: GamesService;
  let axiosGetStub: sinon.SinonStub;
  let sequelizeSyncStub: sinon.SinonStub;
  let gameUpsertStub: sinon.SinonStub;
  let gameFindAllStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  const mockGames = [
    {
      appid: 123,
      name: "Test Game",
      playtime_forever: 100,
    },
    {
      appid: 456,
      name: "Another Game",
      playtime_forever: 200,
    },
  ];

  const mockGameModels = mockGames.map((game) => ({
    appid: game.appid,
    gameName: game.name,
    playtime_forever: game.playtime_forever,
    headerImage: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
  }));

  beforeEach(() => {
    // Set up environment variables for tests
    process.env.steamApiKey = "test-api-key";
    process.env.steamId = "test-steam-id";

    // Set up stubs
    axiosGetStub = sinon.stub(axios, "get");
    sequelizeSyncStub = sinon.stub(sequelize, "sync");
    gameUpsertStub = sinon.stub(Game, "upsert");
    gameFindAllStub = sinon.stub(Game, "findAll");
    consoleLogStub = sinon.stub(console, "log");
    consoleErrorStub = sinon.stub(console, "error");

    // Create service instance
    service = new GamesService();

    // Override rateLimitDelay to make tests faster
    service.rateLimitDelay = () => Promise.resolve();
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.steamApiKey;
    delete process.env.steamId;
  });

  describe("constructor", () => {
    it("should throw error if steamApiKey is missing", () => {
      delete process.env.steamApiKey;
      expect(() => new GamesService()).to.throw(
        "Steam API key or Steam ID not found in environment variables"
      );
    });

    it("should throw error if steamId is missing", () => {
      delete process.env.steamId;
      expect(() => new GamesService()).to.throw(
        "Steam API key or Steam ID not found in environment variables"
      );
    });
  });

  describe("fetchGames", () => {
    it("should fetch games successfully", async () => {
      axiosGetStub.resolves({
        data: {
          response: {
            game_count: 2,
            games: mockGames,
          },
        },
      });
      gameUpsertStub.resolves([{}, true]);
      gameFindAllStub.resolves(mockGameModels);

      const result = await service.fetchGames("test-user-id");

      expect(axiosGetStub.calledOnce).to.be.true;
      expect(sequelizeSyncStub.calledOnce).to.be.true;
      expect(gameUpsertStub.callCount).to.equal(2);
      expect(gameFindAllStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockGameModels);
    });

    it("should return null when no games are found", async () => {
      axiosGetStub.resolves({
        data: {
          response: {
            game_count: 0,
            games: [],
          },
        },
      });

      const result = await service.fetchGames("test-user-id");

      expect(result).to.be.null;
      expect(gameUpsertStub.called).to.be.false;
    });

    it("should throw error when API call fails", async () => {
      const error = new Error("API error");
      axiosGetStub.rejects(error);

      try {
        await service.fetchGames("test-user-id");
        expect.fail("should have thrown error");
      } catch (err) {
        expect(err).to.equal(error);
        expect(consoleErrorStub.calledOnce).to.be.true;
      }
    });
  });

  describe("getGames", () => {
    it("should get all games from the database", async () => {
      gameFindAllStub.resolves(mockGameModels);

      const result = await service.getGames();

      expect(sequelizeSyncStub.calledOnce).to.be.true;
      expect(sequelizeSyncStub.firstCall.args[0]).to.deep.equal({
        force: false,
      });
      expect(gameFindAllStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockGameModels);
    });

    it("should throw error when database query fails", async () => {
      const error = new Error("Database error");
      sequelizeSyncStub.rejects(error);

      try {
        await service.getGames();
        expect.fail("should have thrown error");
      } catch (err) {
        expect(err).to.equal(error);
        expect(consoleErrorStub.calledOnce).to.be.true;
      }
    });
  });
});
