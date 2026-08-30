import { Injectable, Logger } from '@nestjs/common';
import { Client, Connection, WorkflowExecutionAlreadyStartedError } from '@temporalio/client';

import { SYNC_WORKFLOW_TYPE, TEMPORAL_ADDRESS, TEMPORAL_TASK_QUEUE } from '../config/app';
import type { OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class TemporalService implements OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name);
  private connection: Connection | null = null;
  private client: Client | null = null;

  private async connect(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    this.connection = await Connection.connect({ address: TEMPORAL_ADDRESS });
    this.client = new Client({ connection: this.connection });

    return this.client;
  }

  async startSync(consentId: string): Promise<void> {
    const client = await this.connect();

    try {
      await client.workflow.start(SYNC_WORKFLOW_TYPE, {
        taskQueue: TEMPORAL_TASK_QUEUE,
        workflowId: `sync-${consentId}`,
        args: [{ consentId }],
      });
    } catch (error) {
      if (error instanceof WorkflowExecutionAlreadyStartedError) {
        this.logger.log(`sync-${consentId} is already running, leaving it alone`);

        return;
      }

      throw error;
    }
  }

  async stopSync(consentId: string): Promise<void> {
    const client = await this.connect();

    try {
      await client.workflow.getHandle(`sync-${consentId}`).terminate('the consent was revoked');
    } catch {
      this.logger.log(`sync-${consentId} was not running, nothing to terminate`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close();
  }
}
