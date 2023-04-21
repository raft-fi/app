export function shortenAddress(account: string, head: number = 4, tail: number = 4) {
  return `${account.substring(0, head)}...${account.substring(account.length - tail, account.length)}`;
}
