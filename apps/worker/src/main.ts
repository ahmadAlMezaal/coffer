import './config/env';

import { NativeConnection, Worker } from '@temporalio/worker';

import * as activities from './activities';
import { MAX_PLAID_CALLS_PER_SECOND, TEMPORAL_ADDRESS, TEMPORAL_TASK_QUEUE } from './config/app';

const run = async () => {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  const worker = await Worker.create({
    connection,
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflowsPath: require.resolve('./workflows'),
    activities,
    maxActivitiesPerSecond: MAX_PLAID_CALLS_PER_SECOND,
  });

  console.warn(`Coffer worker listening on ${TEMPORAL_TASK_QUEUE} at ${TEMPORAL_ADDRESS}`);

  await worker.run();
  await connection.close();
};

void run();
