import { ERC20PermitSignatureStruct } from '@raft-fi/sdk';
import { Nullable } from '../interfaces';

export const isSignatureValid = (signature: Nullable<ERC20PermitSignatureStruct>): boolean => {
  if (!signature) {
    return false;
  }

  const now = Date.now();
  const expiry = (signature.deadline as number) * 1000;

  return now <= expiry;
};
