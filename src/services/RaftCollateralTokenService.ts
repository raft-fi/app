import { Contract, JsonRpcSigner } from 'ethers';
import Decimal from 'decimal';
import { getConfigManager } from '../config';
import { ChainConfig } from '../interfaces';
import erc20IndexableABI from './abi/ERC20IndexableABI.json';

class RaftCollateralTokenService {
  private signer: JsonRpcSigner;
  private raftCollateralTokenContract: Contract;
  private config: ChainConfig;

  constructor(signer: JsonRpcSigner) {
    this.signer = signer;

    this.config = getConfigManager().getConfig();

    this.raftCollateralTokenContract = new Contract(this.config.raftCollateralToken, erc20IndexableABI, this.signer);
  }

  async balance(): Promise<Decimal> {
    const balance: bigint = await this.raftCollateralTokenContract.balanceOf(this.signer.address);

    return new Decimal(balance, 18);
  }
}
export default RaftCollateralTokenService;
