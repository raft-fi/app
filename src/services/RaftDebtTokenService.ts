import { JsonRpcSigner } from 'ethers';
import Decimal from 'decimal';
import { getConfigManager } from '../config';
import { ChainConfig } from '../interfaces';
import { ERC20Indexable, ERC20Indexable__factory } from './typechain';

class RaftDebtTokenService {
  private signer: JsonRpcSigner;
  private raftDebtTokenContract: ERC20Indexable;
  private config: ChainConfig;

  constructor(signer: JsonRpcSigner) {
    this.signer = signer;

    this.config = getConfigManager().getConfig();

    this.raftDebtTokenContract = ERC20Indexable__factory.connect(this.config.raftDebtToken, this.signer);
  }

  async balance(): Promise<Decimal> {
    const balance: bigint = await this.raftDebtTokenContract.balanceOf(this.signer.address);

    return new Decimal(balance, 18);
  }
}
export default RaftDebtTokenService;
