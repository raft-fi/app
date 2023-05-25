export function shortenAddress(account: string, head = 6, tail = 4) {
  return `${account.substring(0, head)}...${account.substring(account.length - tail, account.length)}`;
}
