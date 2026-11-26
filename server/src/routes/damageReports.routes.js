import { Router } from 'express';
import * as controller from '../controllers/damageReports.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { uploadSingleImage } from '../middleware/uploadImage.js';
import {
  createReportSchema,
  idParamSchema,
  listReportsQuerySchema,
  updateStatusSchema
} from '../validators/damageReport.validator.js';

const router = Router();

router.get('/', validate(listReportsQuerySchema, 'query'), controller.list);
router.post('/', uploadSingleImage, validate(createReportSchema, 'body'), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  controller.updateStatus
);
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove);

export default router;
