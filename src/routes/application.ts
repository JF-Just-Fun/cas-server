import express from 'express';
const router = express.Router();
import { ApplicationController } from '../controller';
import { authentication } from '../middleware';

/* GET users listing. */
router.get('/', ApplicationController.index);
router.get('/list', authentication.isManager, ApplicationController.list);
router.get('/query', authentication.isManager, ApplicationController.query);

router.post('/register', authentication.isManager, ApplicationController.register);
router.put('/update', authentication.isManager, ApplicationController.update);
router.delete('/remove', authentication.isManager, ApplicationController.remove);

export default router;
