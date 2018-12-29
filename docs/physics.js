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

const dist2 = (x, y) => x*x + y*y;

const getSensorCollisionTime = (a, b) => {
  const sensor = a.isSensor ? a : b;
  const other = sensor === a ? b : a;

  const x = sensor.x - other.x || 1;
  const y = sensor.y - other.y || 1;
  const d2 = dist2(x, y);
  const r2 = sensor.radius * sensor.radius;

  if (d2 < r2) {
    return 0.0;
  }

  return getCollisionTime(sensor, other, true);
};

const testSensorCollision = (a, b) => {
  const dt = getSensorCollisionTime(a, b);
  if (dt < 0.0 || dt > 1.0) {
    // Collision happens this turn only if 0 <= t <= 1
    return;
  }

  return collision.create(a, b, dt);
};

const testCollision = (a, b, t) => {
  if (a.isSensor || b.isSensor) {
    return testSensorCollision(a, b);
  }

  const x = b.x - a.x || 1;
  const y = b.y - a.y || 1;
  const d2 = dist2(x, y);
  const r = a.radius + b.radius;
  const r2 = r * r;

  if (d2 < r2) {
    // Move objects apart
    let d = Math.sqrt(d2);
    if (d === 0) {
      d = 1;
    }
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

// Formula
// a * t^2 + 2 * b * t + d = 0
// Where
// a = dot product of (o1.velocity - o2.velocity) with it self
// b = dot product of (o1.velocity - o2.velocity) with (o2.position - o1.position)
// c = dot product of (o1.position - o2.position) with it self
// r = power of two of combined radiuses of the circles
// d = c - r
// Solved for t
// https://www.wolframalpha.com/input/?i=solve+t:+a+*+t%5E2+%2B+b+*+t+%2B+d
const getCollisionTime = (o1, o2, isSensor) => {
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
  const r = isSensor ?
    (o1.radius - 1)*(o1.radius - 1) :
    (o2.radius + o1.radius)*(o2.radius + o1.radius);
  const inside = b*b - a*(c - r);

  if (inside < 0) {
    // results to imaginary number when squared
    // -> no collision this turn
    return -2.0;
  }

  const square = Math.sqrt(inside);
  const fractionA2 = 1 / a;
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
  if (a.isSensor || b.isSensor) {
    return;
  }

  const ma = a.mass;
  const mb = b.mass;
  const x = b.x - a.x;
  const y = b.y - a.y;
  const d = Math.sqrt(x*x + y*y) || 1;
  const nx = x / d;
  const ny = y / d;

  const vx = b.vx - a.vx;
  const vy = b.vy - a.vy;

  // http://www.euclideanspace.com/physics/dynamics/collision/twod/index.htm#code
  let impact = Math.abs(2.0 * (nx*vx + ny*vy) * (ma * mb) / (ma + mb));
  if (impact < config.IMPACT_MIN) {
    impact = config.IMPACT_MIN;
  }

  a.vx -= nx * impact / ma;
  a.vy -= ny * impact / ma;
  b.vx += nx * impact / mb;
  b.vy += ny * impact / mb;
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

const end = a => a.end();
const equal = a => b => a.equal(b);
const handleCircleCollision = t => col => circle2circle.handleCollision(col, t);
const move = t => a => a.move(t);
const remove = a => collision.remove(a);
const start = a => a.start();

const onCollision = col => {
  col.a.onCollision(col);
  col.b.onCollision(col);
};


function Physics () {
  this.actors = [];
  this.sensors = [];
  this.cols = [];
  this.resolved = [];
};

Physics.prototype.createCircle = function(x, y, radius, isSensor, onCollision) {
  const o = new Circle(x, y, radius, isSensor, onCollision);
  if (isSensor) {
    this.sensors.push(o);
  } else {
    this.actors.push(o);
  }
  return o;
};

Physics.prototype.getActorCollisions = function(prevCollisions, t) {
  const actors = this.actors;
  let col = null;
  let collisions = [];
  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      if (i !== j) {
        col = circle2circle.testCollision(actors[i], actors[j], t);
        if (col) {
          if (prevCollisions.some(equal(col))) {
            remove(col);
          } else {
            collisions.push(col);
          }
        }
      }
    }
  }

  return collisions;
};

Physics.prototype.getSensorCollisions = function(prevCollisions, t) {
  const actors = this.actors;
  const sensors = this.sensors;
  let col = null;
  let collisions = [];
  for (let i = 0; i < actors.length; i++) {
    for (let j = 0; j < sensors.length; j++) {
      col = circle2circle.testCollision(sensors[j], actors[i], t);
      if (col) {
        if (prevCollisions.some(equal(col))) {
          remove(col);
        } else {
          collisions.push(col);
        }
      }
    }
  }

  return collisions;
};

Physics.prototype.step = function() {
  const actors = this.actors;
  const sensors = this.sensors;
  this.actors.forEach(start);

  let cols1 = null;
  let cols2 = null;
  const cols = this.cols;
  let resolved = this.resolved;
  let t = 0.0;
  while (t < 1.0) {
    cols1 = this.getActorCollisions(resolved, t);
    cols2 = this.getSensorCollisions(resolved, t);

    let earliest = cols1[0] || cols2[0];
    if (earliest) {
      for (let i = 0; i < cols1.length; i++) {
        if (cols1[i].t < earliest.t) {
          earliest = cols1[i];
        }
      }

      for (let i = 0; i < cols2.length; i++) {
        if (cols2[i].t < earliest.t) {
          earliest = cols2[i];
        }
      }

      for (let i = 0; i < cols1.length; i++) {
        if (cols1[i].t > earliest.t) {
          remove(cols1[i]);
        } else {
          cols.push(cols1[i]);
        }
      }

      for (let i = 0; i < cols2.length; i++) {
        if (cols2[i].t > earliest.t) {
          remove(cols2[i]);
        } else {
          cols.push(cols2[i]);
        }
      }
    }

    if (cols.length) {
      const dt = cols[0].t;
      t += dt;
      actors.forEach(move(dt));
      cols.forEach(handleCircleCollision(t));
      cols.forEach(onCollision);
      Array.prototype.push.apply(resolved, cols);
    } else {
      actors.forEach(move(1.0 - t));
      t = 1.0;
    }

    cols.length = 0;
  }

  actors.forEach(end);
  resolved.forEach(remove);
  resolved.length = 0;
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
