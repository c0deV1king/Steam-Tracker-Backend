import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import { AchievementsService } from "../services/achievements.service.js";
import Achievement from "../models/achievements.model.js";
import Game from "../models/games.model.js";
import sequelize from "../db/db.js";

describe("AchievementsService", () => {
  let achievementsService: AchievementsService;
  let axiosGetStub: sinon.SinonStub;
  let sequelizeSyncStub: sinon.SinonStub;
  let gamesFindAllStub: sinon.SinonStub;
  let achievementUpsertStub: sinon.SinonStub;
  let achievementFindAllStub: sinon.SinonStub;
  let rateLimitDelayStub: sinon.SinonStub;

  beforeEach(() => {
    // Set environment variable for testing
    process.env.steamApiKey = "test-api-key";

    // Create stubs
    axiosGetStub = sinon.stub(axios, "get");
    sequelizeSyncStub = sinon.stub(sequelize, "sync").resolves();
    gamesFindAllStub = sinon.stub(Game, "findAll");
    achievementUpsertStub = sinon.stub(Achievement, "upsert").resolves();
    achievementFindAllStub = sinon.stub(Achievement, "findAll");

    // Create service instance
    achievementsService = new AchievementsService();

    // Stub the rate limit delay to make tests faster
    rateLimitDelayStub = sinon
      .stub(achievementsService, "rateLimitDelay")
      .resolves();
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.steamApiKey;
  });

  describe("constructor", () => {
    it("should throw error if Steam API key is not found", () => {
      delete process.env.steamApiKey;
      expect(() => new AchievementsService()).to.throw(
        "Steam API key not found in environment variables"
      );
    });
  });

  describe("processAppId", () => {
    it("should process app ID and return combined achievements", async () => {
      // Mock response data
      const gameSchemaResponse = {
        game: {
          availableGameStats: {
            achievements: [
              {
                name: "achievement1",
                displayName: "Achievement 1",
                hidden: 0,
                description: "Achievement 1 description",
                icon: "icon1.jpg",
                icongray: "icongray1.jpg",
              },
            ],
          },
        },
      };

      const playerAchievementsResponse = {
        playerstats: {
          gameName: "Test Game",
          achievements: [
            {
              apiname: "achievement1",
              achieved: 1,
              unlocktime: 1622548800,
            },
          ],
        },
      };

      const globalAchievementPercentagesResponse = {
        achievementpercentages: {
          achievements: [
            {
              name: "achievement1",
              percent: 45.2,
            },
          ],
        },
      };

      // Set up stubs to return mock responses
      axiosGetStub.onCall(0).resolves({ data: gameSchemaResponse });
      axiosGetStub.onCall(1).resolves({ data: playerAchievementsResponse });
      axiosGetStub
        .onCall(2)
        .resolves({ data: globalAchievementPercentagesResponse });

      const result = await achievementsService.processAppId(12345, "steam123");

      expect(axiosGetStub.callCount).to.equal(3);
      expect(achievementUpsertStub.callCount).to.equal(1);
      expect(result).to.be.an("array").with.lengthOf(1);
      expect(result[0]).to.include({
        appid: 12345,
        gameName: "Test Game",
        name: "achievement1",
        apiname: "achievement1",
        displayName: "Achievement 1",
        hidden: 0,
        description: "Achievement 1 description",
        achieved: 1,
        unlockTime: 1622548800,
        percent: 45.2,
      });
    });

    it("should return empty array if no achievements found", async () => {
      axiosGetStub.onCall(0).resolves({
        data: {
          game: {
            availableGameStats: {
              achievements: [],
            },
          },
        },
      });

      const result = await achievementsService.processAppId(12345, "steam123");

      expect(axiosGetStub.callCount).to.equal(1);
      expect(result).to.be.an("array").with.lengthOf(0);
    });
  });

  describe("fetchAchievements", () => {
    it("should fetch achievements for all games", async () => {
      // Mock games
      gamesFindAllStub.resolves([{ appid: 1 }, { appid: 2 }]);

      // Mock processAppId responses
      const processAppIdStub = sinon.stub(achievementsService, "processAppId");
      processAppIdStub.onCall(0).resolves([
        {
          gameName: "Game 1",
          name: "achievement1",
          apiname: "achievement1",
          achieved: 1,
          unlockTime: 1622548800,
          displayName: "Achievement 1",
          hidden: 0,
          description: "Description",
          icon: "icon.jpg",
          iconGray: "icongray.jpg",
          percent: "50.0",
        },
      ]);
      processAppIdStub.onCall(1).resolves([]);

      await achievementsService.fetchAchievements("steam123");

      expect(gamesFindAllStub.calledOnce).to.be.true;
      expect(processAppIdStub.calledTwice).to.be.true;
      expect(achievementUpsertStub.calledOnce).to.be.true;
    });

    it("should handle errors when processing app IDs", async () => {
      gamesFindAllStub.resolves([{ appid: 1 }, { appid: 2 }]);

      const processAppIdStub = sinon.stub(achievementsService, "processAppId");
      processAppIdStub.onCall(0).throws({ response: { status: 403 } });
      processAppIdStub.onCall(1).resolves([]);

      await achievementsService.fetchAchievements("steam123");

      expect(gamesFindAllStub.calledOnce).to.be.true;
      expect(processAppIdStub.calledTwice).to.be.true;
    });

    it("should skip undefined app IDs", async () => {
      gamesFindAllStub.resolves([{ appid: null }, { appid: 2 }]);

      const processAppIdStub = sinon.stub(achievementsService, "processAppId");
      processAppIdStub.resolves([]);

      await achievementsService.fetchAchievements("steam123");

      expect(gamesFindAllStub.calledOnce).to.be.true;
      expect(processAppIdStub.calledOnce).to.be.true;
    });
  });

  describe("getAchievements", () => {
    it("should return all achievements", async () => {
      const mockAchievements = [
        {
          gameName: "Game 1",
          name: "achievement1",
          apiname: "achievement1",
          achieved: 1,
          unlocktime: 1622548800,
          displayName: "Achievement 1",
          hidden: 0,
          description: "Description",
          icon: "icon.jpg",
          icongray: "icongray.jpg",
          percent: "50.0",
        },
      ];

      achievementFindAllStub.resolves(mockAchievements);

      const result = await achievementsService.getAchievements();

      expect(sequelizeSyncStub.calledOnce).to.be.true;
      expect(achievementFindAllStub.calledOnce).to.be.true;
      expect(result).to.equal(mockAchievements);
    });

    it("should throw error if retrieving achievements fails", async () => {
      const error = new Error("Database error");
      achievementFindAllStub.rejects(error);

      try {
        await achievementsService.getAchievements();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
