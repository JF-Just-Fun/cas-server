import express from 'express';
const router = express.Router();
import { ApplicationController } from '../controller';

/* GET users listing. */
router.get('/', ApplicationController.index);
router.get('/list', ApplicationController.list);

router.post('/register', ApplicationController.register);
router.put('/update', ApplicationController.update);
router.delete('/remove', ApplicationController.remove);

export default router;
