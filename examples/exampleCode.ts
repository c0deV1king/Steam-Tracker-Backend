// testing
// describe("tests all endpoints of the profile controller", async () => {
//     beforeAll(async () => {
//       // create a mock database
//       new SequelizeMemoryServer();
//       await connectDb();
//       createTable(profile);
//     });
  
//     beforeEach(async () => {
//       await clearDatabase();
//     });
  
//     afterEach(async () => {
//       // do whatever
//     });
  
//     afterAll(async () => {
//       await closeDb();
//     });
  
//     it("should create a new profile", async () => {
//       // create a new profile
//       // check if the profile was created
//       const mockProfile = {
//         steamid: "123456",
//         personaname: "test",
//         profileurl: "test",
//         avatarfull: "test",
//         loccountrycode: "test",
//         timecreated: "test",
//       };
//       const { body, status } = await request(server)
//         .post("/profile")
//         .send(mockProfile);
//       const { data } = body;
//       expect(status).toBe(200);
//       expect(data).toBe.length(1);
//       expect(data[0]).toMatchObject(mockProfile);
//     });
  
//     it("should not create a new profile", async () => {
//       // create a new profile
//       // check if the profile was created
//       const mockProfile = {
//         personaname: "test",
//         profileurl: "test",
//         avatarfull: "test",
//         loccountrycode: "test",
//         timecreated: "test",
//       };
//       const { body, status } = await request(server)
//         .post("/profile")
//         .send(mockProfile);
//       const { data } = body;
//       expect(status).toBe(500);
//       expect(status.message).toBe("Failed to create profile");
//       expect(data[0]).notEqual(mockProfile);
//     });

// merging code
// // updateProfile function, calls another function to fetch and store/update a profile
//     // connected to getPlayerSummary.ts in services
//     this.route.patch(
//       "/update/:id",
//       // authCheck,
//       // all middlware goes here
//       async (req: Request, res: Response) => {
//         console.log("Update profile called");
//         try {
//           console.log("Updating profile");
//           const { id } = req.params;
//           const { body } = req;
//           const updatedProfile = await this.profileService.updateProfile(
//             id,
//             body
//           );
//           res.status(200).json({
//             message: `Profile updated successfully: ${updatedProfile}`,
//           });
//         } catch (error) {
//           res.status(500).json({ error: "Failed to update profile" });
//         }
//       }
//     );