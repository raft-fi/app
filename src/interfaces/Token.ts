import { CollateralToken, COLLATERAL_TOKENS } from './CollateralTokens';

export const RAFT_TOKEN = 'R';

export type RaftToken = typeof RAFT_TOKEN;
export type Token = CollateralToken | RaftToken;

export const TOKENS = [...COLLATERAL_TOKENS, RAFT_TOKEN] as const;
