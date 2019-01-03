
const config = require('./config');

const FRICTION = config.FRICTION;

function Circle (x, y, radius, isSensor, onCollision) {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.mass = 1;
  this.radius = radius;
  this.isSensor = !!isSensor;
  this.onCollisionCallback = onCollision;

  this.nextCPIndex = 0;
  this.checked = 0;
  this.shield = 0;
  this.timeout = 100;
}

Circle.prototype.onCollision = function (col) {
  if (this.onCollisionCallback) {
    return this.onCollisionCallback(col)
  }
};

Circle.prototype.move = function (t) {
  this.x += this.vx*t;
  this.y += this.vy*t;
};

Circle.prototype.end = function () {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  this.vx *= FRICTION;
  this.vy *= FRICTION;
  this.vx = Math.trunc(this.vx);
  this.vy = Math.trunc(this.vy);
};

module.exports = Circle;
