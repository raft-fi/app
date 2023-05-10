import { JsonRpcProvider } from 'ethers';
import { Decimal } from '@tempusfinance/decimal';
import { getConfigManager } from '../config';
import { ChainConfig } from '../interfaces';
import { ERC20Indexable, ERC20Indexable__factory } from './typechain';

class RaftCollateralTokenService {
  private provider: JsonRpcProvider;
  private raftCollateralTokenContract: ERC20Indexable;
  private config: ChainConfig;

  constructor(provider: JsonRpcProvider) {
    this.provider = provider;

    this.config = getConfigManager().getConfig();

    this.raftCollateralTokenContract = ERC20Indexable__factory.connect(this.config.raftCollateralToken, this.provider);
  }

  async balanceOf(walletAddress: string): Promise<Decimal> {
    const balance: bigint = await this.raftCollateralTokenContract.balanceOf(walletAddress);

    return new Decimal(balance, 18);
  }
}
export default RaftCollateralTokenService;
