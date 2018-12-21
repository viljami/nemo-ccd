
# NEMO CCD

Elastic Continuous Collision Detection without rotational inertia for circles written with JavaScript. No dependencies or external libraries.

The project [web site](https://viljami.github.io/nemo-ccd/) has a [demo](https://viljami.github.io/nemo-ccd/) running.

## Build, Develop and Test

```bash
# Build
npm run build

# Watch and build
npm run watch-build

# Unit tests
npm test

# Run test environment in browser
npm run build && npm start
```

Default localhost port for test environment is 8080 and url http://localhost:8080 .

## Key features

- **[Elastic collision](https://en.wikipedia.org/wiki/Elastic_collision)**, there is no net loss in kinetic energy in the system as a result of the collision
- **[No rotational inertia](https://en.wikipedia.org/wiki/Moment_of_inertia)**, circles do not rotate and there is no rotational energy taken into account in collisions
- **[Continuous Collision Detection](https://en.wikipedia.org/wiki/Collision_detection)**, the exact moment of collision is calculated for all collisions, objects are moved to touch at that point.
- **Fixed time step**, each step duration is 1 time unit. One time step is 1.0 long and collisions are calculated betweem 0.0 (previous step end) to 1.0 (next step start). If collision happens at time 0.3 the objects are moved there and collision is handled and the evaluation continues until time 1.0. If collision happens afterwards it taken into account on the next step. If frame or physics update rate changes the physics steps always the same amount, regardless of the variation of the time between the step calls.
- **Circle to circle collisions**, only circular objects are simulated, no other shapes
- **Sensors**, they can be collided with, but do not cause collision impact and can be driven through, sensor activates when the center of the non-sensor circle is inside of the sensor. Sensors do not collide with each other.
- **Minimum impact** can be set to all collisions, this is the least bounce that happens on collision.
- **World variables** can be customized:
  - FRINCTION, how fast objects slow down affects speed
  - IMPACT_MIN, the minimum impact of collisions

## Math

I found a Stackoverflow post asking about circle collisions and [this answer](https://stackoverflow.com/a/43577790/1898196) let me to solve the moment and place of the collisions. Here is a quote from the answer:
- Let's define our time as t
- Because we are using two dimensions we can call our dimensions x & y
- First let's define the two center points at t = 0 of our circles as a & b
- Let's also define our velocity at t = 0 of a & b as u & v respectively.
- Finally, assuming a constant acceleration of a & b as o & p respectively.
- The equation for a position along any one dimension (which we'll call i) with respect to time t is as follows: i(t) = 1 / 2 * a * t^2 + v * t + i0; with a being constant acceleration, v being initial velocity, and i0 being initial position along dimension i.
- We know the distance between two 2D points at any time t is the square root of ((a.x(t) - b.x(t))^2 + (a.y(t) - b.y(t))^2)
Using the formula of position along a dimensions we can substitute everything in the distance equation in terms of just t and the constants we defined earlier. For shorthand we will call the function d(t);
- Finally using that equation, we will know that the t values where d(t) = a.radius + b.radius are where collision starts or ends.
  - *Careful here. The correct formula is d(t) = (r1 + r2)^2*
To put this in terms of quadratic formula we move the radius to the left so we get d(t) - (a.radius + b.radius) = 0
- We can then expand and simplify the resulting equation so everything is in terms of t and the constant values that we were given. Using that solve for both positive & negative values with the quadratic formula.
  - *Here I found it useful to separate acceleration from the formulas. 4th degree polynomial solving for t turned into much more solvable 2nd degree polynomial. This approximation for enough for my current case.*
- This will handle errors as well because if you get two objects that will never collide, you will get an undefined or imaginary number.

(source: https://stackoverflow.com/questions/43577298/calculating-collision-times-between-two-circles-physics, AWESOME answer from [TinfoilPancakes](https://stackoverflow.com/users/4343520/tinfoilpancakes) )

### Formula for t

Solve below formula for collision time (t). [Link to WolframAlpha solving it.]](https://www.wolframalpha.com/input/?i=solve+t:+a+*+t%5E2+%2B+2+*+b+*+t+%2B+c).

```
# Solve for t
a * t^2 + 2 * b * t + d = 0
=>
t = -(sqrt(b^2 - a * c) + b) / a , a != 0
OR
t = (sqrt(b^2 - a * c) - b) / a , a != 0
```

Which ever of those formulas gives time that happens first is the collision time.

When a is zero, then the circles are moving to the same direction with same speed. They will never collide if they are not already overlapping. And overlapping I am taking care of earlier.

```
# Where
a = dot product of (circle2.velocity - circle1.velocity) with it self
b = dot product of (circle2.velocity - circle1.velocity) with (circle2.position - circle1.position)
c = dot product of (circle2.position - circle1.position) with it self
r = (circle1.radius + circle2.radius)^2
d = c - r
```

## Useful links
- [collision point calculatoin](https://gamedev.stackexchange.com/questions/71941/calculate-point-of-circle-circle-collision-between-frames)
- [Effect of mass to collision impact](https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-the-basics-and-impulse-resolution--gamedev-6331)
- [Video tutoria of Circle Vs Circle Collisions C++l!](https://www.youtube.com/watch?v=LPzyNOHY3A4)
