
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

// Example
// Should be optimized for each new ClassVar?
ObjectPool.prototype.create = function() {
  if (!this.freeIndexes.length) {
    throw new Error('No more free space');
  }
  // Let the function be optimized when not using arguments directly with spread.
  const args = new Array(arguments.length);
  for (let i = 0; args.length; i++) args[i] = arguments[i];
  const poolIndex = this.freeIndexes.pop();
  const next = this.pool[poolIndex];
  next.update(...args, poolIndex);
  return next;
};

ObjectPool.prototype.remove = function(o) {
  this.freeIndexes.push(o.poolIndex);
};

module.exports = ObjectPool;
