
const test = require('tape');
const Physics = require('./index');
const collision = require('./collision');

test('Physics', t => {
  const physics = new Physics();

  // Yes, same center point
  physics.createCircle(0, 0, 50);
  physics.createCircle(0, 0, 50);
  physics.createCircle(0, 0, 50);
  physics.createCircle(0, 0, 50);

  const a = physics.createCircle(500, 500, 50);
  a.ax = -100;
  a.ay = -100;
  const b = physics.createCircle(1000, 0, 50);
  b.ax = -500;
  const c = physics.createCircle(0, 1000, 50);
  c.ay = -500;
  const d = physics.createCircle(1000, 1000, 50);
  d.ax = -500;
  d.ay = -500;

  // Yes, same center point
  physics.createCircle(0, 0, 50, true);
  physics.createCircle(0, 0, 50, true);
  physics.createCircle(0, 0, 50, true);
  physics.createCircle(0, 0, 50, true);

  physics.createCircle(0, 0, 50, true);
  physics.createCircle(0, 200, 50, true);
  physics.createCircle(200, 400, 50, true);
  physics.createCircle(400, 400, 50, true);

  let counter = 0;
  const startTime = Date.now();
  while (Date.now() - startTime < 300) {
    physics.step();
    counter++;
  }

  t.equal(collision.freeIndexes.length, 1000, 'No memory leaks');
  console.log('Steps played:', counter);

  t.end();
});
