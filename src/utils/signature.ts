import { ERC20PermitSignatureStruct } from '@raft-fi/sdk';
import { Nullable } from '../interfaces';

export const getValidSignature = (
  signature: Nullable<ERC20PermitSignatureStruct>,
): Nullable<ERC20PermitSignatureStruct> => {
  if (!signature) {
    return null;
  }

  const now = Date.now();
  const expiry = (signature.deadline as number) * 1000;

  return now <= expiry ? signature : null;
};
