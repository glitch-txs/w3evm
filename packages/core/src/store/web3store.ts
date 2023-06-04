import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'
import { Chain } from '../types'
import { Connector } from '../actions/connectors/base'

interface Web3Store {
  /*We need a time for the WC init to load
  also, some providers are injected after the app js runs meaning a little bit of delay is good for getting the wallet providers
  */
  isLoading: boolean
  /**
   * True if WalletConnect init failed or if the wallet provider lost the connection with the blockchain node
   */
  isProvider: boolean
  /**Open installation website if wallet provider is not found */
  onboard: boolean
  WCInitFailed: boolean
  userAccount: string
  chainId: number | null
  chains: Chain[]
  errorMessage: string
  connectors: Connector[]
  childProvider: any
}

export const web3Store = createStore(subscribeWithSelector<Web3Store>((set, get) => ({
  isLoading: true,
  isProvider: true,
  onboard: true,
  WCInitFailed: false,
  userAccount: '',
  chainId:null,
  errorMessage: '',
  chains: [],
  connectors: [],
  childProvider: null,
})))