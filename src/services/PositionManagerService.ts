import { Contract, ContractTransaction, JsonRpcSigner, ethers } from 'ethers';
import Decimal from 'decimal';
import erc20PermitAbi from './abi/ERC20PermitABI.json';
import positionManagerABI from './abi/PositionManagerABI.json';
import { getConfigManager } from '../config';
import { CollateralToken } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';

const PERMIT_DEADLINE_SHIFT = 30 * 60; // 30 minutes

class PositionManagerService {
  private signer: JsonRpcSigner;
  private collateralToken: CollateralToken;
  private collateralTokenContract: Contract;
  private positionManagerContract: Contract;
  private config: ChainConfig;

  constructor(signer: JsonRpcSigner, collateralToken: CollateralToken) {
    this.signer = signer;
    this.collateralToken = collateralToken;

    this.config = getConfigManager().getConfig();

    this.collateralTokenContract = new Contract(
      this.config.collateralTokens[collateralToken],
      erc20PermitAbi,
      this.signer,
    );

    this.positionManagerContract = new Contract(this.config.positionManager, positionManagerABI, this.signer);
  }

  private async manage(
    collateralChange: Decimal,
    debtChange: Decimal,
    maxFeePercentage: Decimal = Decimal.ONE,
  ): Promise<ContractTransaction> {
    if (collateralChange.gt(Decimal.ZERO)) {
      const allowance = await this.collateralTokenContract.allowance(this.signer.address, this.config.positionManager);

      if (new Decimal(allowance, 18).lt(collateralChange)) {
        const permitTx = await this.signCollateralTokenPermit(collateralChange);
        await permitTx.wait();
      }
    }

    return this.positionManagerContract.managePosition(
      this.config.collateralTokens[this.collateralToken],
      collateralChange.abs().value,
      collateralChange.gt(Decimal.ZERO),
      debtChange.abs().value,
      debtChange.gt(Decimal.ZERO),
      maxFeePercentage.value,
    );
  }

  async open(
    collateralAmount: Decimal,
    debtAmount: Decimal,
    maxFeePercentage: Decimal = Decimal.ONE,
  ): Promise<ContractTransaction> {
    return this.manage(collateralAmount, debtAmount, maxFeePercentage);
  }

  private async signCollateralTokenPermit(amount: Decimal) {
    const deadline = Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_SHIFT;
    const userAddress = this.signer.address;
    const nonce = await this.collateralTokenContract.nonces(userAddress);
    const domain = {
      name: await this.collateralTokenContract.name(),
      chainId: (await this.signer.provider.getNetwork()).chainId ?? 1,
      version: '1',
      verifyingContract: this.config.collateralTokens[this.collateralToken],
    };
    const values = {
      owner: userAddress,
      spender: this.config.positionManager,
      value: amount.value,
      nonce,
      deadline,
    };
    const types = {
      Permit: [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    };

    const signature = await this.signer.signTypedData(domain, types, values);
    const signatureComponents = ethers.Signature.from(signature);

    return await this.collateralTokenContract.permit(
      userAddress,
      this.config.positionManager,
      amount.value,
      deadline,
      signatureComponents.v,
      signatureComponents.r,
      signatureComponents.s,
    );
  }
}
export default PositionManagerService;
