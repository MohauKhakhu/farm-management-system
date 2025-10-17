import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { router as authRouter } from './modules/auth/auth.routes';
import { router as animalsRouter } from './modules/animals/animals.routes';
import { router as vaccinationsRouter } from './modules/vaccinations/vaccinations.routes';
import { router as inventoryRouter } from './modules/inventory/inventory.routes';
import { router as biosecurityRouter } from './modules/biosecurity/biosecurity.routes';
import { router as reportingRouter } from './modules/reporting/reporting.routes';
import { router as iotRouter } from './modules/iot/iot.routes';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/animals', animalsRouter);
app.use('/api/vaccinations', vaccinationsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/biosecurity', biosecurityRouter);
app.use('/api/reporting', reportingRouter);
app.use('/api/iot', iotRouter);

export default app;
