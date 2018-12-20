(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Physics = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

const config = require('./config');

const FRICTION = config.FRICTION;

function Circle (x, y, radius, isSensor, onCollision) {
  this.x = x || 0;
  this.y = y || 0;
  this.vx = 0;
  this.vy = 0;
  this.ax = 0;
  this.ay = 0;
  this.mass = 1;
  this.radius = radius || 10;
  this.isSensor = isSensor || false;
  if (onCollision) this.onCollision = onCollision;
}

Circle.prototype.onCollision = function () {
  return undefined;
};

Circle.prototype.start = function () {
  this.vx += this.ax;
  this.vy += this.ay;
};

Circle.prototype.move = function (t) {
  this.x += this.vx*t;
  this.y += this.vy*t;
};

Circle.prototype.end = function () {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  this.ax *= FRICTION;
  this.ay *= FRICTION;
  this.vx *= FRICTION;
  this.vy *= FRICTION;
  this.vx = Math.trunc(this.vx);
  this.vy = Math.trunc(this.vy);
};

module.exports = Circle;

},{"./config":4}],2:[function(require,module,exports){

const collision = require('./collision');
const config = require('./config');

const IMPACT_MIN = config.IMPACT_MIN;

const dist2 = (dx, dy) => dx*dx + dy*dy;

const testCollision = (a, b, t) => {
  if (a.isSensor || b.isSensor) {
    return testSensorCollision(a, b);
  }

  const x = (b.x - a.x) || 5;
  const y = (b.y - a.y || 5);
  const d2 = dist2(x, y);
  const r = a.radius + b.radius;
  const r2 = r * r;

  if (d2 < r2) {
    // Move objects apart
    const d = Math.sqrt(d2);
    const nx = x / d;
    const ny = y / d;
    const rHalf = Math.ceil((r - d) / 2);

    a.x -= nx * rHalf;
    a.y -= ny * rHalf;
    b.x += nx * rHalf;
    b.y += ny * rHalf;

    return collision.create(a, b, 0.0); // immidiate collision
  }

  const dt = getCollisionTime(a, b);
  if (dt < 0 || t + dt > 1.0) {
    // Collision happens this turn only if 0 <= t <= 1
    return;
  }

  return collision.create(a, b, dt)
};

const testSensorCollision = (a, b) => {
  if (a.isSensor && b.isSensor) {
    // Two sensor will never collide.
    return;
  }

  const sensor = a.isSensor ? a : b;
  const other = a.isSensor ? b : a;
  const dt = getCollisionTime(sensor, other);

  if (dt < 0.0 || dt > 1.0) {
    // Collision happens this turn only if 0 <= t <= 1
    return;
  }

  return collision.create(a, b, dt);
};

const getCollisionTime = (o1, o2) => {
  const x = o2.x - o1.x;
  const y = o2.y - o1.y;
  const vx = o2.vx - o1.vx;
  const vy = o2.vy - o1.vy;
  const a = vx*vx + vy*vy;

  if (a === 0) {
    // Going the same way. No collision.
    // Return time in future to skip collision this turn.
    return 2.0;
  }

  const b = vx*x + vy*y;
  const c = x*x + y*y;
  const r = o2.radius + o1.radius;
  const inside = b*b - 4*a*(c - r);

  if (inside < 0) {
    // results to imaginary number when squared
    // -> no collision this turn
    return 2.0;
  }

  const square = Math.sqrt(inside);
  const fractionA2 = 1 / 2*a;
  const t1 = -((square + b) * fractionA2);
  const t2 = ((square - b) * fractionA2);

  if (t1 < 0 || t2 < 0) {
    // Either one or both in past.
    // Return time closer to the current time.
    return t1 < t2 ? t2 : t1;
  }

  // Return time closer to the current time.
  return t1 < t2 ? t1 : t2;
};

const handleCollision = col => {
  const a = col.a;
  const b = col.b;
  const ma = a.mass;
  const mb = b.mass;
  const r = a.radius + b.radius;
  const x = b.x - a.x;
  const y = b.y - a.y;
  const nx = x / r;
  const ny = y / r;

  const vx = b.vx - a.vx;
  const vy = b.vy - a.vy;
  const dv2 = dist2(vx, vy);
  const dv = Math.sqrt(dv2);

  let impact = 2.0 * (nx*vx + ny+vy) / (ma + mb);
  if (impact < IMPACT_MIN) {
    impact = IMPACT_MIN;
  }

  a.vx -= nx * mb * impact;
  a.vy -= ny * mb * impact;
  b.vx += nx * ma * impact;
  b.vy += ny * ma * impact;
};

module.exports = {
  handleCollision,
  testCollision
};

},{"./collision":3,"./config":4}],3:[function(require,module,exports){

'use strict';

const ObjectPool = require('./objectPool');

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

module.exports = objectPool;

},{"./objectPool":6}],4:[function(require,module,exports){

module.exports = {
  FRICTION: 0.85,
  IMPACT_MIN: 0
};

},{}],5:[function(require,module,exports){

const Circle = require('./circle');
const circle2circle = require('./circle2circle');
const collision = require('./collision');

const equal = a => b => a.equal(b);
const end = a => a.end();
const move = t => a => a.move(t);
const remove = a => collision.remove(a);
const start = a => a.start();
const handleCircleCollision = t => col => circle2circle.handleCollision(col, t);

const onCollision = col => {
  col.a.onCollision(col);
  col.b.onCollision(col);
};

const getEarliestCollisions = (objects, prevCollisions, t) => {
  let col = null;
  let collisions = [];
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      col = circle2circle.testCollision(objects[i], objects[j], t);

      if (col) {
        if (!collisions.length) {
            collisions.push(col);
        } else if (col.t > collisions[0].t || prevCollisions.some(equal(col))) {
          remove(col);
        } else {
          if (col.t < collisions[0].t) {
            collisions.forEach(remove);
            collisions.length = 1;
            collisions[0] = col;
          } else {
            collisions.push(col);
          }
        }
      }
    }
  }

  return collisions;
};

const resolveCollisions = objects => {
  let resolved = [];
  let t = 0.0;
  while (t < 1.0) {
    const cols = getEarliestCollisions(objects, resolved, t);

    if (cols.length) {
      const dt = cols[0].t;
      t += dt;
      objects.forEach(move(dt));
      cols.forEach(handleCircleCollision(t));
      cols.forEach(onCollision);
      Array.prototype.push.apply(resolved, cols);
    } else {
      objects.forEach(move(1.0 - t));
      t = 1.0;
    }
  }

  objects.forEach(end);
  resolved.forEach(remove);
};

function Physics () {
  this.objects = [];
};

Physics.prototype.createCircle = function(x, y, radius, isSensor, onCollision) {
  const o = new Circle(x, y, radius, isSensor, onCollision);
  this.objects.push(o);
  return o;
};

Physics.prototype.step = function(t) {
  this.objects.forEach(start);
  resolveCollisions(this.objects);
};

module.exports = Physics;

},{"./circle":1,"./circle2circle":2,"./collision":3}],6:[function(require,module,exports){

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

},{}]},{},[5])(5)
});