import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/damageReports.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await service.listReports(req.query);
  res.status(200).json(data);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await service.getReport(req.params.id);
  res.status(200).json(data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createReport(req.body, req.file);
  res.status(201).json(data);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateReportStatus(req.params.id, req.body.status);
  res.status(200).json(data);
});

export const remove = asyncHandler(async (req, res) => {
  const data = await service.removeReport(req.params.id);
  res.status(200).json(data);
});
