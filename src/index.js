
const Circle = require('./circle');
const circle2circle = require('./circle2circle');
const collision = require('./collision');
const config = require('./config');

const end = a => a.end();
const equal = a => b => a.equal(b);
const handleCircleCollision = t => col => circle2circle.handleCollision(col, t);
const remove = collision.remove.bind(collision);

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

Physics.prototype.config = config;
Physics.prototype.Circle = Circle;

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
      for (let i = 0; i < actors.length; i++) {
        actors[i].move(dt);
      }
      for (let i = 0; i < cols.length; i++) {
        circle2circle.handleCollision(cols[i], t);
        cols[i].a.onCollision(cols[i]);
        cols[i].b.onCollision(cols[i]);
      }
      Array.prototype.push.apply(resolved, cols);
    } else {
      for (let i = 0; i < actors.length; i++) {
        actors[i].move(1.0 - t);
      }
      t = 1.0;
    }

    cols.length = 0;
  }

  actors.forEach(end);
  resolved.forEach(remove);
  resolved.length = 0;
};

module.exports = Physics;
