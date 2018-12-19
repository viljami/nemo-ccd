
const ObjectPool = require('./lib/objectPool');

function Collision (a, b, t) {
  this.a = a;
  this.b = b;
  this.t = t;
  this.poolIndex = -1;
}

Collision.prototype.update = function(a, b, t, poolIndex) {
  this.a = a;
  this.b = b;
  this.t = t;
  this.poolIndex = poolIndex;
}

Collision.prototype.equal = function(o) {
  if (this.isSensor || o.isSensor) return this.a === o.a && this.b === o.b;
  return this.a === o.a && this.b === o.b && this.t === o.t;
};

const objectPool = new ObjectPool(Collision, 1000);

objectPool.create = function(a, b, t) {
  if (!this.freeIndexes.length) {
    throw new Error('No more free space');
  }
  const poolIndex = this.freeIndexes.pop();
  const next = this.pool[poolIndex];
  next.update(a, b, t, poolIndex);
  return next;
};

module.exports = objectPool;
