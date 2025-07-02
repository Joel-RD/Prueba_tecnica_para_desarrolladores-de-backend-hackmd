import { loging, createUser } from '../controller/auth.js'
import { validationToken } from '../utils/validation.js'
import { Router } from 'express';

const router = Router();

router.post('/api/v1/users/login', loging);
router.post('/api/v1/users/signup', validationToken ,createUser);

export default router;
