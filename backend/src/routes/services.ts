import { Router } from 'express';
import { z } from 'zod';
import { getTransportOptions } from '../services/transport.service.js';
import { getAmenities, type AmenityType } from '../services/sustainability.service.js';
import {
  getServices,
  requestAssistance,
  type AssistanceType,
} from '../services/accessibility.service.js';

export const servicesRouter = Router();

/* ---- Transport ---------------------------------------------------------- */
servicesRouter.get('/transport', (_req, res) => {
  res.status(200).json(getTransportOptions());
});

/* ---- Sustainability ----------------------------------------------------- */
const amenityTypes = ['water', 'recycling', 'compost', 'ev-charging'] as const;

servicesRouter.get('/sustainability/amenities', (req, res, next) => {
  try {
    const type = req.query.type
      ? z.enum(amenityTypes).parse(req.query.type)
      : undefined;
    res.status(200).json(getAmenities(type as AmenityType | undefined));
  } catch (err) {
    next(err);
  }
});

/* ---- Accessibility ------------------------------------------------------ */
servicesRouter.get('/accessibility/services', (_req, res) => {
  res.status(200).json(getServices());
});

const assistanceSchema = z.object({
  type: z.enum(['wheelchair', 'sensory', 'medical', 'guide']),
  zoneId: z.string().min(1).max(64),
  note: z.string().max(500).optional(),
});

servicesRouter.post('/accessibility/assistance', (req, res, next) => {
  try {
    const { type, zoneId, note } = assistanceSchema.parse(req.body);
    res
      .status(201)
      .json(requestAssistance(type as AssistanceType, zoneId, note));
  } catch (err) {
    next(err);
  }
});
