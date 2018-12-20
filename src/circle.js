
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
