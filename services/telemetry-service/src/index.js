import app from './app.js';
import { startDeviceCreatedConsumer } from './consumers/deviceCreatedConsumer.js';
import { startFacilityCreatedConsumer } from './consumers/facilityCreatedConsumer.js';
import { startTelemetrySimulator } from './cron/telemetrySimulator.js';
import { startReconciliationJob } from './cron/reconciliationJob.js';

const port = process.env.PORT || 3003;

app.listen(port, () => {
  console.log(`telemetry-service listening on port ${port}`);
});

startDeviceCreatedConsumer();
startFacilityCreatedConsumer();
startTelemetrySimulator();
startReconciliationJob();
