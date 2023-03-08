import express from 'express';
const router = express.Router();
import { UserController } from '../controller';
// import { authenticate } from '../middleware';

/* GET users listing. */
router.get('/', UserController.index);

router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.post('/cas_login', UserController.checkST);

router.get('/profile', UserController.profile);

router.delete('/logout', UserController.logout);

export default router;
