import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccount, quote, execute, maxAmount, totalBalance} from '../src/cryproy-model.js';

test('rejects invalid, non-finite, below-minimum and fee-inclusive overdraw amounts',()=>{
  const a=createAccount();
  for(const raw of ['', '-50', 'Infinity', '1e3', '12.345', '<img>', '5', '12400'])assert.ok(quote(a,'BTC','buy',raw).error,raw);
  assert.equal(quote(a,'BTC','buy','10').error,'');
  assert.equal(quote(a,'BTC','buy',String(maxAmount(a,'BTC','buy'))).error,'');
});
test('ETH purchase changes ETH and cash once, not BTC, and loses only the fee',()=>{
  const a=createAccount(), before=totalBalance(a), btc=a.holdings.BTC;
  const o={...quote(a,'ETH','buy','500'),id:'test-1'};
  assert.equal(o.total,500.5);assert.equal(o.units,500/3486.2);
  assert.equal(execute(a,o),true);assert.equal(execute(a,o),false);
  assert.equal(a.cash,11899.5);assert.equal(a.holdings.BTC,btc);
  assert.equal(a.orders.length,1);assert.ok(Math.abs(totalBalance(a)-(before-.5))<1e-8);
});
test('sell credits proceeds minus fee and rejects unowned coins',()=>{
  const a=createAccount();assert.ok(quote(a,'SOL','sell','500').error);
  const before=a.holdings.BTC,o={...quote(a,'BTC','sell','500'),id:'sell-1'};
  execute(a,o);assert.equal(a.cash,12899.5);assert.ok(a.holdings.BTC<before);
});
test('MAX remains affordable after purchases and sells cannot exceed holdings',()=>{
  const a=createAccount();execute(a,{...quote(a,'BTC','buy','500'),id:'a'});
  assert.equal(quote(a,'BTC','buy',String(maxAmount(a,'BTC','buy'))).error,'');
  assert.equal(quote(a,'BTC','sell',String(maxAmount(a,'BTC','sell'))).error,'');
  assert.ok(quote(a,'BTC','sell',String(maxAmount(a,'BTC','sell')+1)).error);
});
