
'use strict';

/*
  ObjectPool

  Requires ClassVar to implement an interface.

  update : Function
    updates initial parameters
  poolIndex : Integer
    the last argument of the update function must be stored in member variable with same name.
*/
function ObjectPool(ClassVar, size, initialParams) {
  this.pool = [];
  this.freeIndexes = [];
  this.ClassVar = ClassVar;

  const params = initialParams || [];
  for (let i = 0; i < size; i++) {
    this.freeIndexes.push(i);
    this.pool.push(new ClassVar(...params));
  }
}

ObjectPool.prototype.create = function(a, b, t) {
  const poolIndex = this.freeIndexes.pop();
  const next = this.pool[poolIndex];
  next.update(a, b, t, poolIndex);
  return next;
};

ObjectPool.prototype.remove = function(o) {
  this.freeIndexes.push(o.poolIndex);
};

module.exports = ObjectPool;
