// Fixed Figma reference prices. All balances and executions are local simulations.
export const COINS = [
  { symbol: 'BTC', name: 'Bitcoin', mark: '₿', price: 67428.51, change: 2.84, color: '#f59e0b' },
  { symbol: 'ETH', name: 'Ethereum', mark: 'Ξ', price: 3486.20, change: 1.16, color: '#2b6de5' },
  { symbol: 'BNB', name: 'BNB', mark: 'B', price: 642.18, change: -0.42, color: '#aa7a00' },
  { symbol: 'SOL', name: 'Solana', mark: 'S', price: 148.32, change: 3.21, color: '#7452cc' },
];
export const money = n => new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(n);
export const quantity = n => new Intl.NumberFormat('en-US', {maximumFractionDigits: 8}).format(n);
export function createAccount() { return { cash: 12400, holdings: {BTC: .12, ETH: 1.2, BNB: 0, SOL: 0}, orders: [] }; }
export function quote(account, symbol, side, raw) {
  const coin = COINS.find(c => c.symbol === symbol);
  const amount = Number(raw);
  const fee = Math.round(amount * .001 * 100) / 100;
  const total = Math.round((amount + (side === 'buy' ? fee : -fee)) * 100) / 100;
  const units = amount / coin.price;
  let error = '';
  if (!/^\d+(\.\d{0,2})?$/.test(String(raw)) || !Number.isFinite(amount)) error = 'Enter a valid USDT amount with up to 2 decimals.';
  else if (amount < 10) error = 'Minimum order is 10.00 USDT.';
  else if (side === 'buy' && total > account.cash) error = 'Amount plus fee exceeds your available USDT.';
  else if (side === 'sell' && units > account.holdings[symbol] + 1e-12) error = `Not enough ${symbol} in your demo wallet.`;
  return {symbol, side, amount, fee, total, units, price:coin.price, error};
}
export function maxAmount(account, symbol, side) {
  return Math.floor((side === 'buy' ? account.cash / 1.001 : account.holdings[symbol] * COINS.find(c=>c.symbol === symbol).price) * 100) / 100;
}
export function execute(account, order) {
  if (account.orders.some(o=>o.id === order.id)) return false;
  const checked = quote(account, order.symbol, order.side, String(order.amount));
  if (checked.error) return false;
  account.cash = Math.round((account.cash + (order.side === 'buy' ? -order.total : order.total)) * 100) / 100;
  account.holdings[order.symbol] += order.side === 'buy' ? order.units : -order.units;
  account.orders.unshift({...order, status:'Completed'});
  return true;
}
export const totalBalance = account => account.cash + COINS.reduce((sum,c)=>sum+account.holdings[c.symbol]*c.price,0);
