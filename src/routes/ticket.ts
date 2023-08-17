import express from 'express';
const router = express.Router();
import { Ticket } from '../controller';

/* GET users listing. */
router.post('/st', Ticket.checkST);

export default router;
