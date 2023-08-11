import express from 'express';
const router = express.Router();
import { ApplicationController } from '../controller';
import { authentication } from '../middleware';

/* GET users listing. */
router.get('/', ApplicationController.index);
router.get('/list', authentication.isUser, ApplicationController.list);
router.get('/query', authentication.isUser, ApplicationController.query);

router.post('/register', authentication.isUser, authentication.isManager, ApplicationController.register);
router.put('/update', authentication.isUser, authentication.isManager, ApplicationController.update);
router.delete('/remove', authentication.isUser, authentication.isManager, ApplicationController.remove);

export default router;
