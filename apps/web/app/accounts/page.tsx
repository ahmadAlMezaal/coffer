import { BankMark } from '@/components/bank-mark';
import { ConnectBank } from '@/components/connect-bank';
import { ConnectingBanner } from '@/components/connecting-banner';
import { ConsentStatusPill } from '@/components/consent-status';
import { DisconnectBank } from '@/components/disconnect-bank';
import { SyncWatcher } from '@/components/sync-watcher';
import { preciseMoney, relativeTime, shortDate } from '@/lib/format';
import { readLinkedBanks } from '@/lib/services/dashboard.service';
import type { ConsentSummary } from '@coffer/contracts';

export const dynamic = 'force-dynamic';

const consentFor = (consents: ConsentSummary[], consentId: string): ConsentSummary | undefined =>
  consents.find((consent) => consent.id === consentId);

const AccountsPage = async () => {
  const { state, consents, accounts, apiError } = await readLinkedBanks();
  const connecting = consents.some((consent) => consent.status === 'processing');

  return (
    <main className="mx-auto flex max-w-[76rem] flex-col gap-6 px-6 py-8 lg:px-10">
      {connecting ? <SyncWatcher /> : null}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-2xl font-extrabold tracking-tight">Accounts</h1>
          <p className="text-ink-muted mt-1.5 text-sm">
            Every bank you have connected, what it holds, and when its access expires.
          </p>
        </div>
        <ConnectBank label={consents.length === 0 ? 'Connect a bank' : 'Add a bank'} />
      </header>

      <ConnectingBanner consents={consents} />

      {apiError === null ? null : (
        <p className="text-outflow border-outflow/20 bg-outflow/5 rounded-lg border px-3 py-2 text-sm">
          {state === 'unreachable'
            ? `Coffer cannot reach its own API on port 3001. Run make dev. The connection failed with: ${apiError}.`
            : `The API turned the request down: ${apiError}.`}
        </p>
      )}

      {apiError === null && consents.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-ink text-lg font-bold">No banks connected</p>
          <p className="text-ink-muted max-w-sm text-sm">
            Connect your first bank to see your balances, spending and runway in one place.
          </p>
        </div>
      ) : null}

      {accounts.groups.map((group) => {
        const consent = consentFor(consents, group.consentId);
        const balance = group.accounts.reduce(
          (running, account) => running + Number(account.currentBalance),
          0,
        );

        return (
          <section key={group.consentId} className="card overflow-hidden">
            <div className="border-hairline flex flex-wrap items-center justify-between gap-4 border-b p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <BankMark institution={group.institution} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-ink truncate text-lg font-bold">
                      {group.institution.name ?? 'Linked bank'}
                    </h2>
                    <ConsentStatusPill status={group.status} />
                  </div>
                  <p className="text-ink-muted mt-0.5 text-xs">
                    {group.accounts.length} account{group.accounts.length === 1 ? '' : 's'} holding{' '}
                    {preciseMoney(
                      balance.toFixed(2),
                      group.accounts[0]?.currency ?? accounts.currency,
                    )}
                  </p>
                </div>
              </div>

              <DisconnectBank
                consentId={group.consentId}
                institutionName={group.institution.name ?? 'this bank'}
              />
            </div>

            <dl className="border-hairline sm:divide-hairline grid border-b sm:grid-cols-3 sm:divide-x">
              <div className="p-5">
                <dt className="eyebrow">Consented</dt>
                <dd className="text-ink mt-1.5 text-sm font-medium">
                  {consent === undefined ? 'Unknown' : shortDate(consent.consentedAt)}
                </dd>
              </div>
              <div className="p-5">
                <dt className="eyebrow">Access expires</dt>
                <dd className="text-ink mt-1.5 text-sm font-medium">
                  {group.expiresAt === null
                    ? 'No expiry set by the bank'
                    : shortDate(group.expiresAt)}
                </dd>
              </div>
              <div className="p-5">
                <dt className="eyebrow">Last synced</dt>
                <dd className="text-ink mt-1.5 text-sm font-medium">
                  {group.lastSyncedAt === null
                    ? 'Waiting for the first update'
                    : relativeTime(group.lastSyncedAt)}
                </dd>
              </div>
            </dl>

            {consent?.lastSyncError == null ? null : (
              <p className="text-caution border-hairline bg-caution/5 border-b px-5 py-3 text-sm">
                We could not reach this bank on the last try. We will keep trying in the background.
              </p>
            )}

            <ul>
              {group.accounts.map((account) => (
                <li
                  key={account.id}
                  className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm font-semibold">{account.name}</p>
                    <p className="text-ink-faint mt-0.5 text-xs">
                      {account.subtype ?? account.type}
                      {account.mask === null ? '' : ` ・ ••${account.mask}`}
                      {` ・ updated ${relativeTime(account.balanceAsOf)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="figure text-ink text-lg font-bold">
                      {preciseMoney(account.currentBalance, account.currency)}
                    </p>
                    {account.availableBalance === null ? null : (
                      <p className="text-ink-faint text-xs">
                        {preciseMoney(account.availableBalance, account.currency)} available
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
};

export default AccountsPage;
