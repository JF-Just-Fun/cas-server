import express from 'express';
const router = express.Router();
import { ApplicationController } from '../controller';

/* GET users listing. */
router.post('/add', ApplicationController.register);
router.put('/update/:id', ApplicationController.update);

export default router;
