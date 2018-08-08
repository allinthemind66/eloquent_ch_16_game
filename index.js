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
