let simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;

class Level {
  constructor(plan){
    //split entire map plan into arrays for each line or row
    let rows = plan.trim().split("\n").map(l => [...l]);
    this.height = rows.length;
    this.width = rows[0].length;
    //actors are the moving elements.
    this.startActors = [];

//map passes array index as second argument
//so first y is the y value because it goes through each line
//x is the x value because it goes through each item in a line
    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        //levelChars is an object which maps backround elements to strings
        //and actor characters to classes
        let type = levelChars[ch];
        if (typeof type == 'string') return type;
        //if type is an actor class (i.e. not string)

        this.startActors.push(
          //position of object is stored in the Vec object
          type.create(new Vec(x,y), ch));
        return 'empty';
      });
    });
  }
}
class State {
  constructor(level, actors, status){
    //status will switch to lost or won at end of game
    this.level = level;
    this.actors = actors;
    this.status = status;
  }
  static start(level){
    return new State(level, level.startActors, "playing");
  }

  get player() {
    return this.actors.find(a => a.type == "player");
  }
}
 //Vec is the position of an actor in x,y coordinates
 //An Actor's pos propery holds the coordinates of the elements top left corner
 //An actors size property holds its size
class Vec {
  constructor(x,y){
    this.x = x; this.y = y;
  }
  plus(other){
    return new Vec(this.x + other.x, this.y + other.y);
  }
  times(factor){
    return new Vec(this.x * factor, this.y * factor);
  }
}

class Player {
  constructor(pos, speed){
    this.pos = pos;
    this.speed = speed;
  }

  get type() { return "player";}

  static create(pos) {
    //Vec is position of top left of actor
    return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0 , 0));
  }
}
Player.prototype.size = new Vec(0.8, 1.5);

// class Monster {
//   constructor(pos, speed, reset){
//     this.pos = pos;
//     this.speed = speed;
//     this.reset = reset;
//   }
//
//   get type() { return 'monster'}
//
//   static create(pos){
//     return new Monster(pos.plus(new Vec(0, -0.5)), new Vec(4 , 0));
//   }
// }

// Monster.prototype.size = new Vec(0.8, 1.5)


class Lava {
  constructor(pos, speed, reset){
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() { return 'lava'; }

  static create(pos, ch) {
    if(ch == '=') {
      return new Lava(pos, new Vec(2,0));
    } else if (ch == '|') {
      return new Lava(pos, new Vec(0, 2));
    } else if (ch = 'v'){
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
}

Lava.prototype.size = new Vec(1,1);


class Coin {
  constructor(pos, basePos, wobble){
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }

  get type() { return "coin"; }

  static create(pos){
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new Coin(basePos, basePos, Math.random() * Math.PI / 2);
  }
}

Coin.prototype.size = new Vec(0.6, 0.6);

const levelChars = {
  ".": 'empty', "#": 'wall', "+": 'lava',
  "@": Player, "o": Coin, "=": Lava, "|": Lava, "v": Lava
};

//let simpleLevel = new Level(simpleLevelPlan);
//console.log(simpleLevel)


//this function creates html elements and attributes for those elements
function elt(name, attrs, ...children){
  let dom = document.createElement(name);
  for(let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for(let child of children){
    dom.appendChild(child);
  }
  return dom
}

class DOMDisplay {
  constructor(parent, level){
    this.dom = elt('div', {class: 'game'}, drawGrid(level));
    //this.actorLayer will be used to track the element that holds the actors so that they
    //can easily be removed and replaced.
    //actor layer is a div containing all the actors defined by the
    //drawActors function
    this.actorLayer = null;
    parent.appendChild(this.dom);
    console.log('the actor layer is', this.actorLayer)
  }
  clear() { this.dom.remove(); }
}

//this is the amount of pixels per unit
const scale = 20;


//background is drawn as a table element
function drawGrid(level){
  return elt("table", {
    class: "background",
    style: `width: ${level.width * scale}px`
  }, ...level.rows.map(row => elt("tr", {style: `height: ${scale}px`}, ...row.map(type => elt("td", {class: type})))
));
}
//
function drawActors(actors){
  return elt("div", {}, ...actors.map(actor => {
    let rect = elt("div", {class: `actor ${actor.type}`});
    rect.style.width = `${actor.size.x * scale}px`;
    rect.style.height = `${actor.size.y * scale}px`;
    rect.style.left = `${actor.pos.x * scale}px`;
    rect.style.top = `${actor.pos.y * scale}px`;
    return rect;
  }));
}

DOMDisplay.prototype.syncState = function(state) {
  if(this.actorLayer) this.actorLayer.remove();
  //actor layer is a div with all the actors inside
  this.actorLayer = drawActors(state.actors);
  // console.log(this.dom)
  this.dom.appendChild(this.actorLayer);
  this.dom.className = `game ${state.status}`;
  this.scrollPlayerIntoView(state);
};
//
DOMDisplay.prototype.scrollPlayerIntoView = function(state){
  //client width and client height are attributes on all dom elements
  //they are the viewable portion of an element
  let width = this.dom.clientWidth;
  let height = this.dom.clientHeight;
  let margin = width/3;
  // margin is used so when the player is two thirds of the way in the viewport
  // the window will scroll with the player

  // the viewport
  // scroll left and scrollTop are JS DOM methods
  // gets or sets the number of pixels that an element's content is scrolled to the left or top.
  let left = this.dom.scrollLeft, right = left + width;
  let top = this.dom.scrollTop, bottom = top + height;
//
  let player = state.player;
  let center = player.pos.plus(player.size.times(0.5)).times(scale);

  if(center.x < left + margin) {
    this.dom.scrollLeft = center.x - margin;
  } else if(center.x > right - margin){
    this.dom.scrollLeft = center.x + margin - width;
  }
  if(center.y < top + margin){
    this.dom.scrollTop = center.y - margin;
  } else if(center.y > bottom - margin) {
    this.dom.scrollTop = center.y + margin - height;
  }
};
//

//
// //UP TO HERE, ALL THE GAME CAN DO IS RENDER A MAP WITH ALL THE NECESSARY ACTORS BUT IT IS NOT RUNNING
//
Level.prototype.touches = function(pos, size, type){
  //calculate all sides of user and rounds up or down so its a bit larger than the user
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);
//loops over a series of coordinates around a rectangle (pos and size) and returns true if it matches the type
  for(var y = yStart; y < yEnd; y++){
    for(var x = xStart; x < xEnd; x++){
      // console.log(this)
      //figures out if the user is outside of the width of the entire game area, width and height are in units from gameLevels
      // console.log(this.rows[y][x])
      let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
      //here determines for each block around a player what the player is touching (i.e. wall, empty, ect.)
      let here = isOutside ? "wall" : this.rows[y][x];
      //returns true when user touches whatever was passed into this function as the third argument
      if (here == type) return true;
    }
  }
  return false;
}

State.prototype.update = function(time, keys) {
  //"Step" is a process of calculating system's next state. "Timestep" is the time interval for which simulation will progress during next "step".
  let actors = this.actors.map(actor => actor.update(time, this, keys));
  let newState = new State(this.level, actors, this.status);
  // console.log(newState.status)
//returns a new state if the game is lost or is not playing
  if(newState.status != "playing") return newState;

  let player = newState.player;
  if(this.level.touches(player.pos, player.size, "lava")) {
    //this is for the static lava
    return new State(this.level, actors, "lost")
  }

  for(let actor of actors){
    if(actor != player && overlap(actor, player)) {
      //calculates new state based on actors collide method
      newState = actor.collide(newState);
    }
  }
  return newState;
}

function overlap(actor1, actor2){
  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Lava.prototype.collide = function(state){
  return new State(state.level, state.actors, "lost");
};

// function monsterHit(player, monster){
//   //pos is top left corner
//   // debugger
// //already overlapping, so just check for y coordinate
//   return player.pos.y + player.size.y < monster.pos.y + .5
// }
// Monster.prototype.collide = function(state){
//   let player = state.actors.find(player => player.type == 'player')
//   if(monsterHit(player, this)){
//     let filtered = state.actors.filter(a => a != this);
//     let status = state.status;
//     return new State(state.level, filtered, status);
//   }
//   else{
//     return new State(state.level, state.actors, "lost");
//   }
//
//
//   console.log(player)
//   return new State(state.level, state.actors, "lost");
// }

Coin.prototype.collide = function(state){
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  //if there are no more coins
  if(!filtered.some(a => a.type == "coin")) status = "won";
  return new State(state.level, filtered, status);
}

Lava.prototype.update = function(time, state) {
  //this is for moving lava only
  let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall")) {
    //if it doesnt touch a wall, it keeps moving
    return new Lava(newPos, this.speed, this.reset);
  } else if (this.reset){
    //else it resets
    //dripping lava has a reset position
    return new Lava(this.reset, this.speed, this.reset);
  } else {
    //bouncing lava, inverts its speed by multiplying by -1
    return new Lava(this.pos, this.speed.times(-1));
  }
}


const wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.update = function(time){
  //wobble is incremented to track time
  //wobble keeps incrementing
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};

const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;

Player.prototype.update = function(time, state, keys) {
  let xSpeed = 0;
  if (keys.ArrowLeft) xSpeed -= playerXSpeed;
  if (keys.ArrowRight) xSpeed += playerXSpeed;

  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  //calculates where player will be horizontally. if it doesnt touch a wall, then it updates
  if (!state.level.touches(movedX, this.size, "wall")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  //starts out negative 17. increments by .5  everytime step.
  //when user first jumps, ySpeed is set to negative jump speed(17)
  //will keep moving downwards until it hits a wall(floor)
  //the speed the user is going up is slowed each timestep by timestep * gravity(.5)
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall")) {
    pos = movedY;
  } else if(keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;

  } else {
    ySpeed = 0;
  }
  return new Player(pos, new Vec(xSpeed, ySpeed));
}

// Monster.prototype.update = function(time, state) {
//   let pos = this.pos;
//   let newPos = this.pos.plus(this.speed.times(time));
//
//   if (!state.level.touches(newPos, this.size, "wall")) {
//     return new Monster(newPos, this.speed, this.reset);
//   }
//   else {
//     //bouncing lava, inverts its speed by multiplying by -1
//     return new Monster(this.pos, this.speed.times(-1));
//   }
// }


function trackKeys(keys, unregister){
  //make it so it unregisters arrowKeys
  let down = Object.create(null);
  function track(event){
    if(keys.includes(event.key)) {
      //if the key is down, then its true
      //also updates when key is up and makes it false
      down[event.key] = event.type == "keydown";
      // console.log(down)
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);
  if(unregister){
    window.removeEventListener("keydown", track);
    window.removeEventListener("keyup", track);
  }
  return down;
}

const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

function runAnimation(frameFunc){
  let lastTime = null;
  //fram calculates the difference between now and the last time it was called.
  function frame(time){
    //frame is automatically passed a DOMHighResTimeStamp which indicates the current time
    if(lastTime != null) {
      //chooses the minimum value, so if the player switches screens and then goes backround
      //the time step is only 100, then divided by 1000.
      let timeStep = Math.min(time - lastTime, 100) / 1000;

      if(frameFunc(timeStep) === false) return;
    }
    lastTime = time;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display) {
  //make this register keys
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1;
  const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);
  //ending is the amount of seconds to wait after the game has either been won or lost
  //decrements by the timeStep
  let pause = false;
    return new Promise(resolve => {
      window.addEventListener('keydown', (e)=> {
        if(e.key == "Escape"){
          pause = !pause
          if(!pause){
            runAnimation(time => {
              state = state.update(time, arrowKeys);
              display.syncState(state);
              if(state.status == "playing" && !pause) {
                return true;
              } else if (pause) {
                console.log('you paused me');
                return false
              }
              else if (ending > 0) {
                // console.log(ending)
                ending -= time;
                return true;
              } else {
                display.clear();
                resolve(state.status);
                trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"], true);
                return false;
              }
            });
          }
        }
      })

      runAnimation(time => {
        state = state.update(time, arrowKeys);
        display.syncState(state);
        if(state.status == "playing" && !pause) {
          return true;
        } else if (pause) {
          console.log('you paused me');
          return false
        }
        else if (ending > 0) {
          ending -= time;
          // console.log(ending)
          return true;
        } else {
          display.clear();
          resolve(state.status);
          return false;
        }
      });
    });
}

async function runGame(plans, Display) {
  let playerLives = 3;
  for(let level = 0; level < plans.length;){
    let status = await runLevel(new Level(plans[level]), Display);
    if(status == "won") level++;
    if(status == "lost"){
      if(playerLives > 0){
          playerLives -= 1;
      }
      else{
        console.log("You've lost!")
        level = 0;
        playerLives = 3;
      }
      console.log(playerLives)
    }
  }
  console.log("You've won!");
}
