import express from 'express';
const router = express.Router();
import { UserController } from '../controller';
import { authentication } from '../middleware';

/* GET users listing. */
router.get('/', UserController.index);

router.post('/register', UserController.register);

router.post('/login', UserController.login, UserController.profile);

router.get('/getst', authentication.isUser, UserController.getST);

router.get('/profile', authentication.isUser, UserController.profile);

router.post('/update', authentication.isUser, UserController.update, UserController.profile);

router.get('/query', authentication.isManager, UserController.query);

router.delete('/logout', authentication.isUser, UserController.logout);

export default router;
