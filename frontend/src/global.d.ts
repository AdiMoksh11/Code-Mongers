interface EthereumProvider {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: Array<any> }) => Promise<any>;
  on: (eventName: string, handler: (params?: any) => void) => void;
  removeListener: (eventName: string, handler: (params?: any) => void) => void;
  selectedAddress: string | undefined;
  chainId: string | undefined;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
