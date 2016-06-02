'use strict';

let greet = x => `hello ${x}`;


let main = code => {
  Object.freeze(code);
  
  console.log(greet('hoge'));
  
};


main('hello');
