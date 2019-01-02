
const collision = require('./collision');
const config = require('./config');

const testSensorCollision = (a, b) => {
  const sensor = a.isSensor ? a : b;
  const other = sensor === a ? b : a;

  const x = sensor.x - other.x || 1;
  const y = sensor.y - other.y || 1;
  const d2 = x*x + y*y;
  const r2 = sensor.radius * sensor.radius;

  if (d2 < r2) {
    return 0.0;
  }

  const dt = getCollisionTime(sensor, other, true);

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
  const d2 = x*x + y*y;
  const r = a.radius + b.radius;
  const r2 = r * r;

  if (d2 < r2) {
    // Move objects apart
    let d = Math.sqrt(d2) || 1;
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
