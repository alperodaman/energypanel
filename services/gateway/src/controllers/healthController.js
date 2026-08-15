import { checkDependencies } from '../services/healthService.js';

async function getHealth(req, res) {
  const dependencies = await checkDependencies();

  const isHealthy = Object.values(dependencies).every((status) => status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    dependencies,
  });
}

export { getHealth };
