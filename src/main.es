'use strict';

let fs = require('fs');
/*
let rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
*/

const Tokens = {
  WHITE : /^\s+/,
  COMMENT : /^#.*$/,
  STATE : /^state/,
  PROCESS : /^process/,
  PREVIOUS : /^'/,
  IDENT : /^[A-Za-z_][A-Za-z0-9_]+/,
  NUMBER : /^(-)?\d+(\.\d+)?/,
  COLON : /^:/,
  CURLY_OPEN : /^{/,
  CURLY_CLOSE : /^}/,
  SQUARE_OPEN : /^\[/,
  SQUARE_CLOSE : /^\]/,
  RIGHT_ARROW : /^==>/,
  DOT : /^\./,
  ROUND_OPEN : /^\(/,
  ROUND_CLOSE : /^\)/,
  OPERATOR : /^(<-|\/=|==)/,
  STRING : /^".*"/,
  EQ : /^=/
};



let main = () => {
  let code = fs.readFileSync('test.uitribe', 'utf-8');
  let tokens = tokenize(code);
  let elems = (new Parser(tokens)).exec();
  console.log(elems);
  let exec = new Executor(elems);
  exec.verify();
  //rl.on('line', s => {console.log('hello')});

};



/*TOKENIZER--------------------------------------------------------------------*/
let tokenize = code => { 
  if (code === '') return [];
  const t = match(code);
  return [t].concat(tokenize(code.substr(t.value.length)));
};


let match = code => {
  for (let key in Tokens) {
    let m = Tokens[key].exec(code);
    if (!m) continue;
    return {type : key, value : m[0]};
  }
  throw `Unknown charactor ${code}`
};



/*PARSER--------------------------------------------------------------------*/

let Parser = class {
  constructor(tokens) {
    this.tokens = tokens;
    this.done = [];
  };

  exec() {
    this.es = {}; // {state : [{obj, event, target}*]}
    // this.objs = {};
    this.skipBlank();
    while (this.tokens.length > 0) {
      this.toplevel();
    }
    return this.es;
  };

  toplevel() {
    if (this.seek('STATE')) {
      let name = this.next().scan('IDENT');
      if (name.value in this.es) throw `State ${name.value} has been already declared\n\n${this.error()}`
      this.es[name.value] = this.verify('COLON').states();
    } else if(this.seek('PROCESS')) {
      let name = this.next.scan('IDENT');
      
    }
    else throw `Unexcepted token ${this.tokens[0].type}(${this.tokens[0].value}) \n\n ${this.error()}`;
  };

  states() {
    let ss = [];
    while(this.seek('IDENT')) {
      let subj = this.scan('IDENT');
      let event = this.verify('DOT').scan('IDENT'); 
      let target = this.verify('RIGHT_ARROW').scan('IDENT');
      ss.push({subj:subj.value, event:event.value, target:target.value});
    }
    return ss;
  };

  next() {
    this.done.push(this.tokens.shift());
    this.skipBlank();
    return this;
  };

  skipBlank() {
    while ( this.seek('WHITE') || this.seek('COMMENT') ) {
      this.done.push(this.tokens.shift());
    }
    return this;
  };

  seek(type) {
    if (!this.tokens[0]) return false;
    return this.tokens[0].type === type;
  };

  verify(type) {
    if (this.seek(type)) this.next();
    else throw `Unexcepted token: ${type} was required but ${this.tokens[0].type}(${this.tokens[0].value}) was founded\n\n${this.error()}` ;
    return this;
  };

  scan(type) {
    let t = this.tokens[0];
    if (this.seek(type)) this.next();
    else throw `Unexcepted token: ${type} was required but ${this.tokens[0].type}(${this.tokens[0].value}) was founded \n\n${this.error()}` ;
    return t;
  };

  error() {
    let script = this.done.map(x => x.value).join('');
    let row = this.done.filter((x) => x.value.indexOf('\n') !== -1).length + 1;
    let col = script.split('\n').pop().length + 1;
    return `at row: ${row}, col: ${col}`;
  };
};

/*PARSER--------------------------------------------------------------------*/
let Executor = class {
  constructor(trans) {
    this.trans = trans;
  };
  

  verify() {
    let msg = [];
    // Check all targets are declared
    let states = Object.keys(this.trans);
    states.map(s => {
      this.trans[s].map(x => x.target)
                   .filter(x => !(x in this.trans))
                   .forEach(x => msg.push(`${x} is not declared!`));
    });

    // Output messages
    msg.forEach(x => this.log(x));
    if(msg.length !== 0) throw `incorrext transitions`;
  };

  log(s) {
    console.log(s);
  };

};

main();

