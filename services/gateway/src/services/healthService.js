const HEALTH_CHECK_TIMEOUT_MS = 3000;

async function checkServiceHealth(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const res = await fetch(new URL('/health', baseUrl), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`unhealthy response: ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDependencies() {
  const [auth, facility, telemetry] = await Promise.allSettled([
    checkServiceHealth(process.env.AUTH_SERVICE_URL),
    checkServiceHealth(process.env.FACILITY_SERVICE_URL),
    checkServiceHealth(process.env.TELEMETRY_SERVICE_URL),
  ]);

  return {
    auth: auth.status === 'fulfilled' ? 'ok' : 'error',
    facility: facility.status === 'fulfilled' ? 'ok' : 'error',
    telemetry: telemetry.status === 'fulfilled' ? 'ok' : 'error',
  };
}

export { checkDependencies };
