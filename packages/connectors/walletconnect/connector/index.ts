import EthereumProvider, { QrModalOptions } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider"
import { Chain, Injected, Provider, getW3, setW3, _KEY_WALLET as KEY_WALLET, _catchError as catchError } from 'w3-evm'
import { setWC } from "../store"

type WalletConnectOptions = {
  showQrModal?: boolean,
  qrModalOptions?: QrModalOptions,
  icon?: any,
  projectId: string,
  chains?: number[],
  optionalChains?: number[]
}

export class WalletConnect extends Injected {
  readonly id: string
  readonly name: string
  readonly icon?: any
  private provider?: Provider
  private options: WalletConnectOptions
  getProvider:()=>Promise<Provider> | Provider | undefined

  constructor(options: WalletConnectOptions){
    const getProvider = ()=>{
      return this.provider
    }

    super()

    this.id = "walletConnect"
    this.name = 'WalletConnect'
    this.icon = options?.icon
    this.options = options
    this.getProvider = getProvider
  }

  async init(){
    const { EthereumProvider } = await import("@walletconnect/ethereum-provider")

    const { showQrModal, qrModalOptions, projectId, chains, optionalChains } = this.options
  
    if(projectId === 'YOUR_PROJECT_ID') throw new Error('Invalid Project Id')

    if(chains?.length === 0 && optionalChains?.length === 0) catchError(new Error('WalletConnect chains must not be empty'))
    
    //@ts-ignore - strict type on chains vs optionalChains
    const provider = await EthereumProvider.init({
      projectId,
      chains,
      optionalChains,
      showQrModal:showQrModal ?? false,
      qrModalOptions,
    }).catch(catchError)
  
    if(!provider) throw new Error('Failed to initialize WalletConnect - Error not caught')

    this.provider = provider as Provider
    
    provider.on("disconnect", () => {
      if(localStorage.getItem(KEY_WALLET) === this.id) localStorage.removeItem(KEY_WALLET)
      setW3.address(undefined), setW3.chainId(undefined), setW3.walletProvider(undefined)
    });

    provider.on('display_uri', setWC.uri)
  
    if(provider.session){    
      const connected = await this.setAccountAndChainId(provider as Provider)
      if(connected) {
        console.log("hello", connected)
        if(localStorage.getItem(KEY_WALLET) !== this.id) localStorage.setItem(KEY_WALLET, this.id)
        setW3.walletProvider(provider as Provider), setW3.wait(undefined)
      return
      }
    }
    window?.dispatchEvent(new Event('WalletConnect#ready', {bubbles: true}))
  }

  async connect({ chain: _chain }:{chain?: Chain | number} = {}){
    
    const provider = await this.getProvider()

    if(!provider){
      function c(this: InstanceType<typeof WalletConnect>){
        this.connect({chain: _chain})
      }
      window.addEventListener('WalletConnect#ready',c.bind(this) , { once: true })
      return
    }
    
    setW3.wait('Connecting')
    let chain: number | undefined;
    let chains: number[] | undefined;

    if(_chain){
      chains = getW3.chains().map(chain => {
        if(typeof chain === 'number') return chain 
        return Number(chain.chainId)
      })
  
      chain = chains.find(c => {
        if(typeof _chain === 'number'){
          return c === _chain
        }else{
          return c === Number(_chain?.chainId)
        }
      })
    }

    await (provider as EthereumProvider).connect?.({
      chains: chain ? [chain] : undefined,
      optionalChains: chains,
    })
    .catch(catchError)
    
    const connected = await this.setAccountAndChainId(this.provider)
    if(connected) {
      setW3.walletProvider(provider as Provider)
      localStorage.setItem(KEY_WALLET,this.id)
    }

    setW3.wait(undefined)
  }

  async disconnect() {
    setW3.wait('Disconnecting')
    const provider = await this.getProvider()
    console.log(provider)
    await provider?.disconnect?.()
    localStorage.removeItem(KEY_WALLET)
    setW3.address(undefined), setW3.chainId(undefined)
    setW3.walletProvider(undefined), setW3.wait(undefined)
  }
}