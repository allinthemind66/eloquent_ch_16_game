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
    this .actors = actors;
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
    this.spedd = speed;
  }

  get type() { return "player";}

  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0 , 0));
  }
}

Player.prototype.size = new Vec(0.8, 1.5);

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
    return new Coin(basePos, basePos, Math.random() * Math.PI * 2);
  }
}

Coin.prototype.size = new Vec(0.6, 0.6);

const levelChars = {
  ".": 'empty', "#": 'wall', "+": 'lava',
  "@": Player, "o": Coin, "=": Lava, "|": Lava, "v": Lava
};
