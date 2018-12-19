
const collision = require('./collision');

const FRICTION = 0.85;

const dist2 = (dx, dy) => dx*dx + dy*dy;
const dist = (dx, dy) => Math.sqrt(dist2(dx, dy));

function Circle (x, y, radius, angle, isSensor, onCollision) {
  this.x = x || 0;
  this.y = y || 0;
  this.vx = 0;
  this.vy = 0;
  this.ax = 0;
  this.ay = 0;
  this.mass = 1;
  this.radius = radius || 10;
  this.angle = angle || 0;
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

function Circle2Circle () {

};

Circle2Circle.prototype.createCircle = function(x, y, radius, angle, onCollision) {
  return new Circle(x, y, radius, angle, onCollision);
};

const getPosition1D = (p, v, a, t) => 0.5*a*t*t + v*t + p;
const getCollisionTime = (o1, o2) => {
  const x = o2.x - o1.x;
  const y = o2.y - o1.y;
  const vx = o2.vx - o1.vx;
  const vy = o2.vy - o1.vy;
  const a = vx*vx + vy*vy;
  if (a === 0) return 2.0; // going the same way, return somewhere in future
  const b = vx*x + vy*y;
  const c = x*x + y*y;
  const r = o2.radius + o1.radius;
  const inside = b*b - 4*a*(c - r);
  if (inside < 0) return 2.0; // imaginary number -> no collision
  const square = Math.sqrt(inside);
  const fractionA2 = 1 / 2*a;
  const t1 = -((square + b) * fractionA2);
  const t2 = ((square - b) * fractionA2);
  if (t1 < 0 || t2 < 0) return t1 < t2 ? t2 : t1;
  return t1 < t2 ? t1 : t2;
};

const testSensorCollision = (a, b) => {
  if (a.isSensor && b.isSensor) return;
  const sensor = a.isSensor ? a : b;
  const other = a.isSensor ? b : a;
  const dt = getCollisionTime(sensor, other);
  if (dt < 0.0 || dt > 1.0) return;
  return collision.create(a, b, dt);
};

Circle2Circle.prototype.testCollision = function(a, b, t) {
  if (a.isSensor || b.isSensor) {
    return testSensorCollision(a, b);
  }

  const r = a.radius + b.radius;
  const r2 = r * r;

  const x = (b.x - a.x) || 5;
  const y = (b.y - a.y || 5);
  const d2 = dist2(x, y);
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
  if (dt < 0 || t + dt > 1.0) return;
  return collision.create(a, b, dt)
};

Circle2Circle.prototype.handleCollision = function(col) {
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
  if (impact < 12.0) impact = 12.0;
  // if (impact < 120.0) impact = 120.0;

  a.vx -= nx * mb * impact;
  a.vy -= ny * mb * impact;
  b.vx += nx * ma * impact;
  b.vy += ny * ma * impact;
};

module.exports = new Circle2Circle();
