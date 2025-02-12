import express from 'express';
import { ProfileController } from '../controllers/profileController.js';

const router = express.Router();
const profileController = new ProfileController();

router.post('/update', profileController.updateProfile);
router.get('/', profileController.getProfiles);

export { router as playerSummaryRoutes };