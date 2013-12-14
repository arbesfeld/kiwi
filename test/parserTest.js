var PEG = require('pegjs');
var assert = require('chai').assert;
var expect = require('chai').assert;
var fs = require('fs'); // for loading files
var wrapExceptions = require('./helperUtils.js').wrapExceptions;

// Read file contents
var data = fs.readFileSync('peg/main.peg', 'utf-8');
var parse = wrapExceptions(PEG.buildParser(data).parse);
// var parse = PEG.buildParser(data).parse;

// test primitives
console.log(parse("5"));
assert.deepEqual(parse("5"), [{expr:{tag:"ignore", body:5}, children:[]}], "number only");

console.log(parse("variable_Nam2e"));
assert.deepEqual(parse("variable_Nam2e"), [ {expr: {tag:"ignore", body:{tag:"ident", name:"variable_Nam2e"} }, children:[]} ], "variable only");

console.log(parse("  -5.3 +   0.3"));
assert.deepEqual(parse("  -5.3 +   0.3"), [ {expr: {tag:"ignore", body:{tag:"+", left:-5.3, right:0.3}}, children:[] }], "add only");

console.log(parse("\n\r\n\t5\n"));
console.log(parse("\n\r\n\t5\n")[0]);
assert.deepEqual(parse("\n\r\n5\n"), [ {expr:{tag:"ignore", body:5},  children:[] }, undefined], "only 5");

// test tabs
var simpleTabbedExpression =
  "5\n \
   \t\t8";
console.log(parse(simpleTabbedExpression));
assert.deepEqual(parse(simpleTabbedExpression), [ {expr:{tag:"ignore", body:5}, children:[{expr:{tag:"ignore", body:8}, children:[] }] }], "simple tabs");

var complexTabbedExpression =
"5\n\
\t8\n\
2";
console.log(parse(complexTabbedExpression));
assert.deepEqual(parse(complexTabbedExpression), [{ expr:{tag:"ignore", body:5}, children:[ {expr:{tag:"ignore", body:8}, children:[] }] }, { expr:{tag:"ignore", body:2}, children:[] }], "complex tabs" );

// 