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
      showToast('Address copied!');
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
          message: 'Transaction sent!',
          hash: result.receipt?.hash,
        });
        showToast('Sent successfully!');
      } else if (result.status === 'cancelled') {
        setTxnResult({ type: 'error', message: 'Transaction cancelled' });
      }
    } catch (err: any) {
      setTxnResult({ type: 'error', message: err?.message || 'Transaction failed' });
    }
  };

  // Loading state
  if (!initialised) {
    return (
      <div className="app-shell">
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading wallet...</span>
        </div>
      </div>
    );
  }

  // Disconnected — show landing
  if (status === 'disconnected') {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-logo">
            <div className="app-logo-icon">⚡</div>
            MEGA Wallet
          </div>
          <span className="network-badge">{network || 'testnet'}</span>
        </header>

        <div className="landing-card">
          <div className="landing-icon">🔐</div>
          <h1 className="landing-title">Your Wallet, Instantly</h1>
          <p className="landing-subtitle">
            One tap to create a secure MegaETH wallet. Protected by your device's
            passkey — no passwords, no seed phrases, no downloads.
          </p>

          <div className="landing-features">
            <div className="feature-item">
              <span className="feature-icon">🔑</span>
              <span>Secured by Face ID / fingerprint</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>MegaETH testnet — instant & free</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <span>Recoverable with a recovery code</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => connect()}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <><div className="spinner" /> Opening wallet...</>
            ) : (
              'Create New Wallet'
            )}
          </button>

          <p className="landing-note">
            Already have a wallet?{' '}
            <a onClick={() => setSheet('recovery')}>Restore it here</a>
          </p>
        </div>

        {/* Recovery Info Sheet */}
        {sheet === 'recovery' && (
          <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
            <div className="form-sheet">
              <h2>Restore Your Wallet</h2>
              <p className="form-description">
                When you created your wallet, MOSS gave you a <strong>Recovery Code</strong>.
                This is a MOSS-specific code — not a standard seed phrase, so it won't work in
                other wallets.
              </p>
              <p className="form-description">
                Tap the button below, and MOSS will guide you through restoring your account
                using your recovery code.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setSheet(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => { setSheet(null); connect(); }}>
                  Open Restore Flow
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="app-footer">
          <p>Powered by <a href="https://megaeth.com" target="_blank">MegaETH</a> MOSS</p>
        </footer>
      </div>
    );
  }

  // Connected — show dashboard
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
          <div className="app-logo-icon">⚡</div>
          MEGA Wallet
        </div>
        <span className="network-badge">{network || 'testnet'}</span>
      </header>

      <div className="dashboard">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-label">Balance</div>
          <div className="balance-amount">
            {isBalancesLoading ? '...' : `${balanceDisplay.toFixed(4)} ETH`}
          </div>
          {balanceDisplay === 0 && !isBalancesLoading && (
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              This is testnet ETH — you can get some from the{' '}
              <a href="https://docs.megaeth.com/moss-docs/wallet/deposit-flows" target="_blank" style={{ color: 'var(--accent)' }}>MegaETH faucet</a>
              . Tap Deposit to add funds.
            </p>
          )}
        </div>

        <div className="address-card">
          <div className="address-label">Your Address</div>
          <div className="address-row">
            <span className="address-text">
              {address?.slice(0, 12)}...{address?.slice(-8)}
            </span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
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
            <span className="action-btn-icon">🚪</span>
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
        <p>MegaETH MOSS Wallet · <a href="https://docs.megaeth.com" target="_blank">Docs</a></p>
      </footer>

      {/* Send Sheet */}
      {sheet === 'send' && (
        <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className="form-sheet">
            <h2>Send ETH</h2>

            <div className="form-group">
              <label>To Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.01"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>

            {txnResult && (
              <div className={`txn-result txn-${txnResult.type}`}>
                {txnResult.message}
                {txnResult.hash && (
                  <div className="txn-hash">TX: {txnResult.hash}</div>
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
                  <><div className="spinner" /> Sending...</>
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
