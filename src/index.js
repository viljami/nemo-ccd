
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
