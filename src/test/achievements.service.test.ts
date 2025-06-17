import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("AchievementsService", () => {
  let service: any;
  let axiosGetStub: sinon.SinonStub;
  let achievementBulkCreateStub: sinon.SinonStub;
  let achievementFindAllStub: sinon.SinonStub;
  let gameFindAllStub: sinon.SinonStub;
  let rateLimitDelayStub: sinon.SinonStub;
  let AchievementsService: any;

  beforeEach(async () => {
    process.env.steamApiKey = "test-api-key";

    axiosGetStub = sinon.stub();
    achievementBulkCreateStub = sinon.stub();
    achievementFindAllStub = sinon.stub();
    gameFindAllStub = sinon.stub();
    rateLimitDelayStub = sinon.stub();

    const module = await esmock("../services/achievements.service.js", {
      axios: {
        default: { get: axiosGetStub },
        get: axiosGetStub,
      },
      "../models/achievements.model.js": {
        default: {
          bulkCreate: achievementBulkCreateStub,
          findAll: achievementFindAllStub,
        },
      },
      "../models/games.model.js": {
        default: {
          findAll: gameFindAllStub,
        },
      },
      "../utils.js": {
        rateLimitDelay: rateLimitDelayStub,
      },
    });

    AchievementsService = module.AchievementsService;
    service = new AchievementsService();
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
        expect(() => new AchievementsService()).to.throw(
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
      expect(() => new AchievementsService()).to.not.throw();
    });
  });

  describe("processAppId", () => {
    const mockAppId = 730;
    const mockSteamId = "76561198000000000";

    it("should process app ID and return combined achievements", async () => {
      const mockGameSchemaResponse = {
        game: {
          availableGameStats: {
            achievements: [
              {
                name: "achievement1",
                displayName: "First Achievement",
                description: "Test achievement 1",
                icon: "icon1.jpg",
                icongray: "icon1_gray.jpg",
                hidden: 0,
              },
              {
                name: "achievement2",
                displayName: "Second Achievement",
                description: "Test achievement 2",
                icon: "icon2.jpg",
                icongray: "icon2_gray.jpg",
                hidden: 1,
              },
            ],
          },
        },
      };

      const mockPlayerAchievementsResponse = {
        playerstats: {
          gameName: "Counter-Strike 2",
          achievements: [
            {
              apiname: "achievement1",
              achieved: 1,
              unlocktime: 1234567890,
            },
            {
              apiname: "achievement2",
              achieved: 0,
              unlocktime: 0,
            },
          ],
        },
      };

      const mockGlobalPercentagesResponse = {
        achievementpercentages: {
          achievements: [
            {
              name: "achievement1",
              percent: 75.5,
            },
            {
              name: "achievement2",
              percent: 25.2,
            },
          ],
        },
      };

      axiosGetStub.onFirstCall().resolves({ data: mockGameSchemaResponse });
      axiosGetStub
        .onSecondCall()
        .resolves({ data: mockPlayerAchievementsResponse });
      axiosGetStub
        .onThirdCall()
        .resolves({ data: mockGlobalPercentagesResponse });

      const result = await service.processAppId(mockAppId, mockSteamId);

      expect(axiosGetStub.callCount).to.equal(3);

      // Verify game schema API call
      expect(axiosGetStub.firstCall.args[0]).to.equal(
        "http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/"
      );
      expect(axiosGetStub.firstCall.args[1].params).to.deep.equal({
        key: "test-api-key",
        appid: mockAppId,
      });

      // Verify player achievements API call
      expect(axiosGetStub.secondCall.args[0]).to.equal(
        "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/"
      );
      expect(axiosGetStub.secondCall.args[1].params).to.deep.equal({
        key: "test-api-key",
        steamid: mockSteamId,
        appid: mockAppId,
      });

      // Verify global percentages API call
      expect(axiosGetStub.thirdCall.args[0]).to.equal(
        "https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/"
      );
      expect(axiosGetStub.thirdCall.args[1].params).to.deep.equal({
        key: "test-api-key",
        gameid: mockAppId,
      });

      expect(result).to.have.length(2);
      expect(result[0]).to.deep.include({
        appid: mockAppId,
        gameName: "Counter-Strike 2",
        name: "achievement1",
        apiname: "achievement1",
        displayName: "First Achievement",
        description: "Test achievement 1",
        icon: "icon1.jpg",
        iconGray: "icon1_gray.jpg",
        hidden: 0,
        achieved: 1,
        unlockTime: 1234567890,
        percent: 75.5,
      });
    });

    it("should return empty array when no achievements available", async () => {
      const mockGameSchemaResponse = {
        game: {
          // No availableGameStats or empty achievements
        },
      };

      axiosGetStub.resolves({ data: mockGameSchemaResponse });

      const result = await service.processAppId(mockAppId, mockSteamId);

      expect(result).to.deep.equal([]);
      expect(axiosGetStub.calledOnce).to.be.true;
    });

    it("should handle missing player achievements data", async () => {
      const mockGameSchemaResponse = {
        game: {
          availableGameStats: {
            achievements: [
              {
                name: "achievement1",
                displayName: "First Achievement",
                description: "Test achievement 1",
                icon: "icon1.jpg",
                icongray: "icon1_gray.jpg",
                hidden: 0,
              },
            ],
          },
        },
      };

      const mockPlayerAchievementsResponse = {
        playerstats: {
          gameName: "Counter-Strike 2",
          achievements: [], // Empty achievements array instead of missing
        },
      };

      const mockGlobalPercentagesResponse = {
        achievementpercentages: {
          achievements: [],
        },
      };

      axiosGetStub.onFirstCall().resolves({ data: mockGameSchemaResponse });
      axiosGetStub
        .onSecondCall()
        .resolves({ data: mockPlayerAchievementsResponse });
      axiosGetStub
        .onThirdCall()
        .resolves({ data: mockGlobalPercentagesResponse });

      const result = await service.processAppId(mockAppId, mockSteamId);

      expect(result).to.have.length(1);
      expect(result[0]).to.deep.include({
        achieved: 0,
        unlockTime: 0,
        percent: 0,
      });
    });

    it("should handle completely missing player stats", async () => {
      const mockGameSchemaResponse = {
        game: {
          availableGameStats: {
            achievements: [
              {
                name: "achievement1",
                displayName: "First Achievement",
                description: "Test achievement 1",
                icon: "icon1.jpg",
                icongray: "icon1_gray.jpg",
                hidden: 0,
              },
            ],
          },
        },
      };

      const mockPlayerAchievementsResponse = {
        playerstats: {
          gameName: "Counter-Strike 2",
          // No achievements property at all
        },
      };

      const mockGlobalPercentagesResponse = {
        achievementpercentages: {
          achievements: [],
        },
      };

      axiosGetStub.onFirstCall().resolves({ data: mockGameSchemaResponse });
      axiosGetStub
        .onSecondCall()
        .resolves({ data: mockPlayerAchievementsResponse });
      axiosGetStub
        .onThirdCall()
        .resolves({ data: mockGlobalPercentagesResponse });

      try {
        await service.processAppId(mockAppId, mockSteamId);
        expect.fail(
          "Should have thrown an error due to missing achievements property"
        );
      } catch (error) {
        expect(error).to.be.instanceOf(TypeError);
      }
    });

    it("should handle missing global percentages data", async () => {
      const mockGameSchemaResponse = {
        game: {
          availableGameStats: {
            achievements: [
              {
                name: "achievement1",
                displayName: "First Achievement",
                description: "Test achievement 1",
                icon: "icon1.jpg",
                icongray: "icon1_gray.jpg",
                hidden: 0,
              },
            ],
          },
        },
      };

      const mockPlayerAchievementsResponse = {
        playerstats: {
          gameName: "Counter-Strike 2",
          achievements: [
            {
              apiname: "achievement1",
              achieved: 1,
              unlocktime: 1234567890,
            },
          ],
        },
      };

      const mockGlobalPercentagesResponse = {
        achievementpercentages: {
          // No achievements array
        },
      };

      axiosGetStub.onFirstCall().resolves({ data: mockGameSchemaResponse });
      axiosGetStub
        .onSecondCall()
        .resolves({ data: mockPlayerAchievementsResponse });
      axiosGetStub
        .onThirdCall()
        .resolves({ data: mockGlobalPercentagesResponse });

      const result = await service.processAppId(mockAppId, mockSteamId);

      expect(result).to.have.length(1);
      expect(result[0].percent).to.equal(0);
    });
  });

  describe("fetchAchievements", () => {
    const mockSteamId = "76561198000000000";

    it("should fetch and store achievements for all games", async () => {
      const mockGames = [{ appid: 730 }, { appid: 570 }];

      const mockAchievements = [
        {
          appid: 730,
          gameName: "Counter-Strike 2",
          name: "achievement1",
          apiname: "achievement1",
          displayName: "First Achievement",
          description: "Test achievement",
          icon: "icon1.jpg",
          iconGray: "icon1_gray.jpg",
          hidden: 0,
          achieved: 1,
          unlockTime: 1234567890,
          percent: 75.5,
        },
      ];

      gameFindAllStub.resolves(mockGames);
      rateLimitDelayStub.resolves();
      achievementBulkCreateStub.resolves();

      const processAppIdStub = sinon.stub(service, "processAppId");
      processAppIdStub.onFirstCall().resolves(mockAchievements);
      processAppIdStub.onSecondCall().resolves([]); // No achievements for second game

      await service.fetchAchievements(mockSteamId);

      expect(gameFindAllStub.calledOnce).to.be.true;
      expect(
        gameFindAllStub.calledWith({
          where: { steamId: mockSteamId },
          attributes: ["appid"],
        })
      ).to.be.true;

      expect(processAppIdStub.calledTwice).to.be.true;
      expect(processAppIdStub.firstCall.calledWith(730, mockSteamId)).to.be
        .true;
      expect(processAppIdStub.secondCall.calledWith(570, mockSteamId)).to.be
        .true;

      expect(rateLimitDelayStub.calledTwice).to.be.true;
      expect(achievementBulkCreateStub.calledOnce).to.be.true;

      const bulkCreateArgs = achievementBulkCreateStub.firstCall.args[0];
      expect(bulkCreateArgs).to.have.length(1);
      expect(bulkCreateArgs[0]).to.deep.include({
        steamId: mockSteamId,
        appid: 730,
        gameName: "Counter-Strike 2",
        name: "achievement1",
        apiname: "achievement1",
        achieved: 1,
        unlocktime: 1234567890,
        displayName: "First Achievement",
        hidden: 0,
        description: "Test achievement",
        icon: "icon1.jpg",
        icongray: "icon1_gray.jpg",
        percent: 75.5,
      });
    });

    it("should skip games with undefined or null appid", async () => {
      const mockGames = [{ appid: null }, { appid: undefined }, { appid: 730 }];

      gameFindAllStub.resolves(mockGames);
      rateLimitDelayStub.resolves();

      const processAppIdStub = sinon.stub(service, "processAppId");
      processAppIdStub.resolves([]);

      await service.fetchAchievements(mockSteamId);

      expect(processAppIdStub.calledOnce).to.be.true;
      expect(processAppIdStub.firstCall.calledWith(730, mockSteamId)).to.be
        .true;
    });

    it("should handle 403 Forbidden errors gracefully", async () => {
      const mockGames = [{ appid: 730 }];

      gameFindAllStub.resolves(mockGames);
      rateLimitDelayStub.resolves();

      const processAppIdStub = sinon.stub(service, "processAppId");
      const error403 = new Error("Forbidden");
      (error403 as any).response = { status: 403 };
      processAppIdStub.rejects(error403);

      await service.fetchAchievements(mockSteamId);

      expect(processAppIdStub.calledOnce).to.be.true;
      // Should not call bulkCreate due to error
      expect(achievementBulkCreateStub.called).to.be.false;
    });

    it("should handle other errors and continue processing", async () => {
      const mockGames = [{ appid: 730 }, { appid: 570 }];

      gameFindAllStub.resolves(mockGames);
      rateLimitDelayStub.resolves();

      const processAppIdStub = sinon.stub(service, "processAppId");
      processAppIdStub.onFirstCall().rejects(new Error("API Error"));
      processAppIdStub.onSecondCall().resolves([]);

      await service.fetchAchievements(mockSteamId);

      expect(processAppIdStub.calledTwice).to.be.true;
    });

    it("should handle database errors and throw", async () => {
      gameFindAllStub.rejects(new Error("Database Error"));

      try {
        await service.fetchAchievements(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Error");
      }
    });

    it("should handle bulk create errors and continue", async () => {
      const mockGames = [{ appid: 730 }];
      const mockAchievements = [
        {
          appid: 730,
          gameName: "Counter-Strike 2",
          name: "achievement1",
          apiname: "achievement1",
          displayName: "First Achievement",
          achieved: 1,
          unlockTime: 1234567890,
        },
      ];

      gameFindAllStub.resolves(mockGames);
      rateLimitDelayStub.resolves();
      achievementBulkCreateStub.rejects(new Error("Bulk Create Error"));

      const processAppIdStub = sinon.stub(service, "processAppId");
      processAppIdStub.resolves(mockAchievements);

      // Should not throw, but should handle error gracefully
      await service.fetchAchievements(mockSteamId);

      expect(processAppIdStub.calledOnce).to.be.true;
    });
  });

  describe("getAchievements", () => {
    const mockSteamId = "76561198000000000";

    it("should retrieve achievements from database", async () => {
      const mockAchievements = [
        {
          steamId: mockSteamId,
          appid: 730,
          gameName: "Counter-Strike 2",
          name: "achievement1",
          apiname: "achievement1",
          achieved: 1,
          unlocktime: 1234567890,
          displayName: "First Achievement",
          hidden: 0,
          description: "Test achievement",
          icon: "icon1.jpg",
          icongray: "icon1_gray.jpg",
          percent: "75.5",
        },
      ];

      achievementFindAllStub.resolves(mockAchievements);

      const result = await service.getAchievements(mockSteamId);

      expect(achievementFindAllStub.calledOnce).to.be.true;
      expect(
        achievementFindAllStub.calledWith({ where: { steamId: mockSteamId } })
      ).to.be.true;
      expect(result).to.deep.equal(mockAchievements);
    });

    it("should return empty array when no achievements found", async () => {
      achievementFindAllStub.resolves([]);

      const result = await service.getAchievements(mockSteamId);

      expect(result).to.deep.equal([]);
    });

    it("should handle database errors and throw", async () => {
      achievementFindAllStub.rejects(new Error("Database Error"));

      try {
        await service.getAchievements(mockSteamId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("Database Error");
      }
    });
  });
});
