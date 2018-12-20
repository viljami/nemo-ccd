
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
