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
import {
  LockKey,
  Fingerprint,
  ArrowUpRight,
  ArrowDown,
  Copy,
  SignOut,
  Info,
  Globe,
  ShieldCheck,
  Key,
  CheckCircle,
  Plus,
  X,
} from '@phosphor-icons/react';

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
        setTxnResult({ type: 'success', message: 'Sent.', hash: result.receipt?.hash });
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
          Loading
        </div>
      </div>
    );
  }

  // ═══════════════ LANDING ═══════════════
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

        <div className="bento">
          {/* Row 1: two columns */}
          <div className="bento-row">
            <div className="bento-col">
              <div className="bento-card bento-hero">
                <div className="hero-icon"><LockKey size={28} weight="duotone" /></div>
                <h1>One Wallet.<br />Every App.</h1>
                <p>A passkey wallet that works everywhere. No seed phrase, no downloads.</p>
              </div>
              <div className="bento-card bento-features">
                <div className="bento-label">Why MOSS</div>
                <div className="pills">
                  <span className="pill"><Fingerprint size={16} weight="fill" /> Face ID &amp; fingerprint</span>
                  <span className="pill"><Globe size={16} weight="fill" /> Every MegaETH app</span>
                  <span className="pill"><Key size={16} weight="fill" /> Recoverable</span>
                  <span className="pill"><ShieldCheck size={16} weight="fill" /> Nothing stored online</span>
                </div>
              </div>
            </div>
            <div className="bento-col">
              <div className="bento-card bento-flow">
                <div className="bento-label">Setup in 30 seconds</div>
                <div className="flow-mini">
                  <div className="flow-row"><span className="flow-num">1</span> Tap Create Wallet</div>
                  <div className="flow-row"><span className="flow-num">2</span> Verify with Face ID</div>
                  <div className="flow-row"><span className="flow-num">3</span> Key created on device</div>
                  <div className="flow-row"><span className="flow-num">4</span> Save Recovery Code</div>
                  <div className="flow-row done"><CheckCircle size={14} weight="fill" /> Done.</div>
                </div>
              </div>
              <div className="bento-card bento-security">
                <div className="bento-label">
                  <Info size={14} weight="fill" /> How it's secure
                </div>
                <p>
                  Your private key lives <strong>only on your device</strong>, secured by the same
                  passkey tech that protects your iCloud and Google accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: full-width CTA */}
          <div className="bento-card bento-cta">
            <button
              className="btn btn-primary"
              onClick={() => connect()}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <><div className="spinner" /> Creating</>
              ) : (
                <><Plus size={18} weight="bold" /> Create Wallet</>
              )}
            </button>
            <p className="cta-sub">
              Already have one?{' '}
              <a onClick={() => setSheet('recovery')}>Restore</a>
            </p>
          </div>
        </div>

        {sheet === 'recovery' && (
          <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
            <div className="form-sheet">
              <div className="sheet-header">
                <h2>Restore your wallet</h2>
                <button className="sheet-close" onClick={() => setSheet(null)}>
                  <X size={20} weight="bold" />
                </button>
              </div>
              <p className="form-description">
                Use the Recovery Code you saved during setup. MOSS will walk you through it.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setSheet(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { setSheet(null); connect(); }}>Restore</button>
              </div>
            </div>
          </div>
        )}

        <footer className="app-footer">
          <span>Built on MegaETH MOSS</span>
        </footer>
      </div>
    );
  }

  // ═══════════════ DASHBOARD ═══════════════
  const ethBalance = tokens?.find(
    (t: any) => t.symbol === 'ETH' || t.type === 'native'
  );
  const balanceDisplay = ethBalance ? Number(ethBalance.balance) / 1e18 : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">M</div>
          MOSS
        </div>
        <span className="network-badge">{network || 'testnet'}</span>
      </header>

      <div className="bento">
        {/* Balance */}
        <div className="bento-card bento-balance">
          <div className="balance-label">Balance</div>
          <div className="balance-amount">
            {isBalancesLoading ? '…' : `${balanceDisplay.toFixed(4)} ETH`}
          </div>
          {balanceDisplay === 0 && !isBalancesLoading && (
            <p className="balance-hint">
              Testnet ETH. <a href="https://docs.megaeth.com/moss-docs/wallet/deposit-flows" target="_blank">Get from faucet</a>, then tap Deposit.
            </p>
          )}
        </div>

        {/* Address */}
        <div className="bento-card bento-address">
          <div className="address-label">Address</div>
          <div className="address-row">
            <span className="address-text">{address?.slice(0, 14)}…{address?.slice(-6)}</span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? 'Copied' : <><Copy size={12} weight="bold" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bento-card bento-actions">
          <button
            className="action-btn"
            onClick={() => { setSheet('send'); setTxnResult(null); setSendTo(''); setSendAmount(''); }}
          >
            <ArrowUpRight size={20} weight="bold" />
            Send
          </button>
          <button className="action-btn" onClick={() => deposit()}>
            <ArrowDown size={20} weight="bold" />
            Deposit
          </button>
          <button className="action-btn" onClick={handleCopy}>
            <Copy size={20} weight="bold" />
            Receive
          </button>
          <button className="action-btn" onClick={() => disconnect()}>
            <SignOut size={20} weight="bold" />
            Disconnect
          </button>
        </div>

        {/* Tokens */}
        {tokens && tokens.length > 0 && (
          <div className="bento-card bento-tokens">
            {tokens.map((token: any, i: number) => (
              <div key={i} className="token-item">
                <div className="token-info">
                  <div className="token-icon">{token.symbol === 'ETH' ? '◆' : '●'}</div>
                  <div>
                    <div className="token-name">{token.symbol || token.name || 'Token'}</div>
                    <div className="token-amount">{Number(token.balance || 0).toFixed(4)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="app-footer">
        <span>Built on MegaETH MOSS</span>
      </footer>

      {/* Send Sheet */}
      {sheet === 'send' && (
        <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className="form-sheet">
            <div className="sheet-header">
              <h2>Send ETH</h2>
              <button className="sheet-close" onClick={() => setSheet(null)}>
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="form-group">
              <label>To</label>
              <input type="text" placeholder="0x…" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" step="0.001" placeholder="0.01 ETH" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
            </div>

            {txnResult && (
              <div className={`txn-result txn-${txnResult.type}`}>
                {txnResult.message}
                {txnResult.hash && <div className="txn-hash">{txnResult.hash}</div>}
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setSheet(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSend} disabled={isTransferring || !sendTo || !sendAmount}>
                {isTransferring ? <><div className="spinner" /> Sending</> : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
