import { useState, useCallback } from 'react';
import {
  useStatus,
  useConnect,
  useDisconnect,
  useTransfer,
  useDeposit,
  useBalances,
} from '@megaeth-labs/wallet-sdk-react';
import { parseEther } from 'viem';

type Sheet = 'send' | 'recovery' | null;

export function WalletApp() {
  const { status, address, network, initialised } = useStatus();
  const { mutateAsync: connect, isPending: isConnecting } = useConnect();
  const { mutateAsync: disconnect } = useDisconnect();
  const { mutateAsync: transfer, isPending: isTransferring } = useTransfer();
  const { mutateAsync: deposit } = useDeposit();
  const { data: tokens, isLoading: isBalancesLoading } = useBalances();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [txnResult, setTxnResult] = useState<{
    type: 'success' | 'error';
    message: string;
    hash?: string;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      showToast('Copied');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address, showToast]);

  const handleSend = async () => {
    if (!sendTo || !sendAmount) return;
    setTxnResult(null);
    try {
      const result = await transfer({
        type: 'native',
        to: sendTo as `0x${string}`,
        amount: parseEther(sendAmount).toString(),
      });
      if (result.status === 'approved') {
        setTxnResult({
          type: 'success',
          message: 'Sent.',
          hash: result.receipt?.hash,
        });
        showToast('Sent');
      } else if (result.status === 'cancelled') {
        setTxnResult({ type: 'error', message: 'Cancelled.' });
      }
    } catch (err: any) {
      setTxnResult({ type: 'error', message: err?.message || 'Failed.' });
    }
  };

  if (!initialised) {
    return (
      <div className="app-shell">
        <div className="loading-state">
          <div className="spinner spinner-dark" />
          Loading…
        </div>
      </div>
    );
  }

  // --- Landing ---
  if (status === 'disconnected') {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-logo">
            <div className="app-logo-icon">M</div>
            MOSS
          </div>
          <span className="network-badge">{network || 'testnet'}</span>
        </header>

        <div className="landing-card">
          <div className="landing-icon">🔐</div>
          <h1 className="landing-title">One Wallet.<br />Every App.</h1>
          <p className="landing-subtitle">
            A passkey wallet that works everywhere. No seed phrase,
            no downloads — just tap and go.
          </p>

          <div className="landing-features">
            <div className="feature-item">
              <span className="feature-icon">·</span>
              <span>Secured by Face ID or fingerprint</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">·</span>
              <span>Works across every MegaETH app</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">·</span>
              <span>Recoverable — no seed phrase to lose</span>
            </div>
          </div>

          <div className="security-note">
            <h3>How your wallet stays safe</h3>
            <p>
              Your private key is created and stored <strong>on your device</strong> using
              passkey technology — the same thing that secures your Apple or Google account.
              It never leaves your phone or laptop. MOSS and MegaETH never see it, and
              nothing is stored on any server.
            </p>
            <p>
              If you lose your device, you can recover your wallet using a one-time
              Recovery Code that MOSS gives you during setup. Write it down, store it
              safely — it's the only way back in.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => connect()}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <><div className="spinner" /> Creating…</>
            ) : (
              'Create Wallet'
            )}
          </button>

          <p className="landing-note">
            Already have one?{' '}
            <a onClick={() => setSheet('recovery')}>Restore</a>
          </p>
        </div>

        {sheet === 'recovery' && (
          <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
            <div className="form-sheet">
              <h2>Restore your wallet</h2>
              <p className="form-description">
                You were given a Recovery Code when you created your wallet.
                MOSS will walk you through restoring it — just tap below.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setSheet(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => { setSheet(null); connect(); }}>
                  Restore
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="app-footer">
          <p>Built on <a href="https://megaeth.com" target="_blank">MegaETH</a> MOSS</p>
        </footer>
      </div>
    );
  }

  // --- Dashboard ---
  const ethBalance = tokens?.find(
    (t: any) => t.symbol === 'ETH' || t.type === 'native'
  );
  const balanceDisplay = ethBalance
    ? Number(ethBalance.balance) / 1e18
    : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">M</div>
          MOSS
        </div>
        <span className="network-badge">{network || 'testnet'}</span>
      </header>

      <div className="dashboard">
        <div className="balance-card">
          <div className="balance-label">Balance</div>
          <div className="balance-amount">
            {isBalancesLoading ? '…' : `${balanceDisplay.toFixed(4)} ETH`}
          </div>
          {balanceDisplay === 0 && !isBalancesLoading && (
            <p className="balance-hint">
              Testnet ETH —{' '}
              <a href="https://docs.megaeth.com/moss-docs/wallet/deposit-flows" target="_blank">
                get some from the faucet
              </a>
              . Then tap Deposit.
            </p>
          )}
        </div>

        <div className="address-card">
          <div className="address-label">Address</div>
          <div className="address-row">
            <span className="address-text">
              {address?.slice(0, 14)}…{address?.slice(-6)}
            </span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="action-grid">
          <button
            className="action-btn"
            onClick={() => { setSheet('send'); setTxnResult(null); setSendTo(''); setSendAmount(''); }}
          >
            <span className="action-btn-icon">↗</span>
            Send
          </button>
          <button className="action-btn" onClick={() => deposit()}>
            <span className="action-btn-icon">↓</span>
            Deposit
          </button>
          <button className="action-btn" onClick={handleCopy}>
            <span className="action-btn-icon">📋</span>
            Receive
          </button>
          <button className="action-btn" onClick={() => disconnect()}>
            <span className="action-btn-icon">↩</span>
            Disconnect
          </button>
        </div>

        {tokens && tokens.length > 0 && (
          <div className="token-list">
            {tokens.map((token: any, i: number) => (
              <div key={i} className="token-item">
                <div className="token-info">
                  <div className="token-icon">
                    {token.symbol === 'ETH' ? '◆' : '●'}
                  </div>
                  <div>
                    <div className="token-name">{token.symbol || token.name || 'Token'}</div>
                    <div className="token-amount">
                      {Number(token.balance || 0).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p><a href="https://joinmoss.megaeth.com" target="_blank">MOSS</a> on MegaETH</p>
      </footer>

      {/* Send Sheet */}
      {sheet === 'send' && (
        <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className="form-sheet">
            <h2>Send ETH</h2>

            <div className="form-group">
              <label>To</label>
              <input
                type="text"
                placeholder="0x…"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.01 ETH"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>

            {txnResult && (
              <div className={`txn-result txn-${txnResult.type}`}>
                {txnResult.message}
                {txnResult.hash && (
                  <div className="txn-hash">{txnResult.hash}</div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setSheet(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={isTransferring || !sendTo || !sendAmount}
              >
                {isTransferring ? (
                  <><div className="spinner" /> Sending…</>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
