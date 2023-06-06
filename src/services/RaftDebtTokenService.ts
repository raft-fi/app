import { JsonRpcProvider } from 'ethers';
import { Decimal } from '@tempusfinance/decimal';
import { getConfigManager } from '../config';
import { ChainConfig } from '../interfaces';
import { ERC20Indexable, ERC20Indexable__factory } from './typechain';

class RaftDebtTokenService {
  private provider: JsonRpcProvider;
  private raftDebtTokenContract: ERC20Indexable;
  private config: ChainConfig;

  constructor(provider: JsonRpcProvider) {
    this.provider = provider;

    this.config = getConfigManager().getConfig();

    this.raftDebtTokenContract = ERC20Indexable__factory.connect(this.config.raftDebtToken, this.provider);
  }

  async balanceOf(walletAddress: string): Promise<Decimal> {
    const balance: bigint = await this.raftDebtTokenContract.balanceOf(walletAddress);

    return new Decimal(balance, 18);
  }
}
export default RaftDebtTokenService;
