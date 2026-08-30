import { Client, Connection, WorkflowExecutionAlreadyStartedError } from '@temporalio/client';

import { TEMPORAL_ADDRESS, TEMPORAL_TASK_QUEUE } from '../config/app';

export const withTemporalClient = async (
  work: (client: Client) => Promise<void>,
): Promise<void> => {
  const connection = await Connection.connect({ address: TEMPORAL_ADDRESS });
  const client = new Client({ connection });

  try {
    await work(client);
  } finally {
    await connection.close();
  }
};

export const startSync = async (client: Client, consentId: string): Promise<void> => {
  try {
    await client.workflow.start('syncConsentWorkflow', {
      taskQueue: TEMPORAL_TASK_QUEUE,
      workflowId: `sync-${consentId}`,
      args: [{ consentId }],
    });

    console.warn(`Started sync-${consentId}`);
  } catch (error) {
    if (!(error instanceof WorkflowExecutionAlreadyStartedError)) {
      throw error;
    }

    await client.workflow.getHandle(`sync-${consentId}`).signal('syncNow');

    console.warn(`sync-${consentId} was already running, signalled it to sync now`);
  }
};
