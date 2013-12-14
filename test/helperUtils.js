exports.wrapExceptions = function (parser) {
  return function (argument) {
      argument = argument + "\n";
      return parser(argument);
  } 
};