import { Router } from 'express';
import damageReportsRouter from './damageReports.routes.js';

const router = Router();

router.use('/reports', damageReportsRouter);

export default router;
