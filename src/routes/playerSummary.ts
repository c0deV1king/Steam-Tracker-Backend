import express from 'express';
import { ProfileController } from '../controllers/profileController.js';

const router = express.Router();
// initiallizes the ProfileController
const profileController = new ProfileController();

// endpoint route to fetch and update profile data (linked to controllers/profileController.ts)
router.post('/update', profileController.updateProfile);
// endpoint route to get profile data from the database (linked to controllers/profileController.ts)
router.get('/', profileController.getProfiles);

export { router as playerSummaryRoutes };