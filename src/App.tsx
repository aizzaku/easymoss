import { MegaProvider } from '@megaeth-labs/wallet-sdk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletApp } from './components/WalletApp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 10_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MegaProvider config={{ network: 'testnet', logging: 'info', debug: false }}>
        <WalletApp />
      </MegaProvider>
    </QueryClientProvider>
  );
}

export default App;
