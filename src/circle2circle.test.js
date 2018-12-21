
const test = require('tape');

const Circle = require('./Circle');
const circle2circle = require('./circle2circle');
const collision = require('./collision');
const config = require('./config');

const handleCollision = circle2circle.handleCollision;
const testCollision = circle2circle.testCollision;

const initialFreeIndexesLength = collision.freeIndexes.length;

test('circle2circle - Did collision happen', t => {
  const a1 = new Circle(0, 0, 50);
  const b1 = new Circle(1000, 0, 50);
  t.equal(testCollision(a1, b1, 0), undefined, 'Collision does not happen');

  const a2 = new Circle(0, 0, 50);
  const b2 = new Circle(100, 0, 50);
  t.equal(testCollision(a2, b2, 0), undefined, 'Collision is nearly happening - and not');

  const a22 = new Circle(0, 0, 50, true);
  const b22 = new Circle(50, 0, 50, true);
  t.equal(testCollision(a22, b22, 0), undefined, 'Two sensors do not collide');

  const a33 = new Circle(0, 0, 50);
  const b33 = new Circle(100, 0, 50, true);
  a33.vx = 100;
  a33.vy = 0;
  b33.vx = 0;
  b33.vy = 0;
  const colA33 = collision.create(a33, b33, 0);
  colA33.t = 0.51;
  const colA33poolIndex = colA33.poolIndex;
  const colB33 = testCollision(a33, b33, 0);
  t.notEqual(colB33.poolIndex, colA33.poolIndex, 'pool index does not match');
  colA33.poolIndex = colB33.poolIndex;
  t.deepEqual(colB33, colA33, 'Sensor collides when the other center is in the sensor');
  colA33.poolIndex = colA33poolIndex;
  collision.remove(colA33);
  collision.remove(colB33);

  const a3 = new Circle(0, 0, 50);
  const b3 = new Circle(0, 0, 50);
  const colA3 = collision.create(a3, b3, 0);
  const colA3poolIndex = colA3.poolIndex;
  const colB3 = testCollision(a3, b3, 0);
  colA3.poolIndex = colB3.poolIndex;
  t.deepEqual(colB3, colA3, 'perfect overlapping of still objects');
  colA3.poolIndex = colA3poolIndex;
  collision.remove(colA3);
  collision.remove(colB3);

  const a4 = new Circle(0, 0, 50);
  const b4 = new Circle(150, 0, 50);
  a4.vx = 100;
  a4.vy = 0;
  b4.vx = 0;
  b4.vy = 0;
  const colA4 = collision.create(a4, b4, 0);
  colA4.t = 0.5;
  const colA4poolIndex = colA4.poolIndex;
  const colB4 = testCollision(a4, b4, 0);
  colA4.poolIndex = colB4.poolIndex;
  t.deepEqual(colB4, colA4, 'collision of one object is moving');
  colA4.poolIndex = colA4poolIndex;
  collision.remove(colA4);
  collision.remove(colB4);

  const a5 = new Circle(0, 0, 50);
  const b5 = new Circle(200, 0, 50);
  a5.vx = 100;
  a5.vy = 0;
  b5.vx = -100;
  b5.vy = 0;
  const colA5 = collision.create(a5, b5, 0);
  colA5.t = 0.5;
  const colA5poolIndex = colA5.poolIndex;
  const colB5 = testCollision(a5, b5, 0);
  colA5.poolIndex = colB5.poolIndex;
  t.deepEqual(colB5, colA5, 'collision of both objects are moving');
  colA5.poolIndex = colA5poolIndex;
  collision.remove(colA5);
  collision.remove(colB5);

  const a6 = new Circle(0, 0, 50);
  const b6 = new Circle(100, 100, 50);
  a6.vx = 100;
  a6.vy = 100;
  b6.vx = -100;
  b6.vy = -100;
  const colA6 = collision.create(a6, b6, 0);
  colA6.t = (Math.sqrt(20000) / 2 - 50) / Math.sqrt(20000);
  const colA6poolIndex = colA6.poolIndex;
  const colB6 = testCollision(a6, b6, 0);
  colA6.poolIndex = colB6.poolIndex;
  t.deepEqual(colB6, colA6, 'collision of both objects are moving fast');
  colA6.poolIndex = colA6poolIndex;
  collision.remove(colA6);
  collision.remove(colB6);

  t.equal(collision.freeIndexes.length, initialFreeIndexesLength, 'collision has as many free indexes as in the begging');
  t.end();
});

test('circle2circle - Handle collision', t => {
  const a1 = new Circle(0, 0, 50);
  const b1 = new Circle(0, 0, 50);
  const col1 = circle2circle.testCollision(a1, b1);
  handleCollision(col1)
  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  t.equal(Math.round(Math.sqrt(dx*dx + dy*dy)), 100, 'Overlapping objects are pushed apart');
  collision.remove(col1);

  const a2 = new Circle(0, 0, 50);
  const b2 = new Circle(150, 0, 50);
  a2.vx = 100;
  const col2 = circle2circle.testCollision(a2, b2);
  handleCollision(col2);
  t.equal(a2.vx, 100 - config.IMPACT_MIN, 'Minimum collision impact is correct for x1');
  t.equal(a2.vy, 0, 'Minimum collision impact is correct for y1');
  t.equal(b2.vx, config.IMPACT_MIN, 'Minimum collision impact is correct for x2');
  t.equal(b2.vy, 0, 'Minimum collision impact is correct for y2');
  collision.remove(col2);

  const a3 = new Circle(0, 0, 50);
  const b3 = new Circle(150, 0, 50);
  a3.vx = 200;
  b3.vx = -200;
  const col3 = circle2circle.testCollision(a3, b3);
  handleCollision(col3);
  t.equal(a3.vx, -200, 'Collision impact is correct for x1');
  t.equal(a3.vy, 0, 'Collision impact is correct for y1');
  t.equal(b3.vx, 200, 'Collision impact is correct for x2');
  t.equal(b3.vy, 0, 'Collision impact is correct for y2');
  collision.remove(col3);

  const a4 = new Circle(0, 0, 50);
  const b4 = new Circle(150, 150, 50);
  a4.vx = 200;
  a4.vy = 200;
  b4.vx = -200;
  b4.vy = -200;
  const col4 = circle2circle.testCollision(a4, b4);
  handleCollision(col4);
  t.equal(Math.round(a4.vx), -200, 'Compled collision impact is correct for x1');
  t.equal(Math.round(a4.vy), -200, 'Complex collision impact is correct for y1');
  t.equal(Math.round(b4.vx), 200, 'Complex collision impact is correct for x2');
  t.equal(Math.round(b4.vy), 200, 'Complex collision impact is correct for y2');
  collision.remove(col4);

  t.equal(collision.freeIndexes.length, initialFreeIndexesLength, 'collision has as many free indexes as in the begging');
  t.end();
});
