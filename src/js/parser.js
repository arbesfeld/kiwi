// global variables
var gNewestObj = undefined;

// env is like:
// { bindings: { x: 5, ... }, outer: { } }

// Lookup a variable in an environment.
// variable = {neg:true/false, name:name}
var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings')))
        throw new Error("Env does not have bindings for " + JSON.stringify(v));

    var str = v.hasOwnProperty('name') ? v.name : v;

    if (env.bindings.hasOwnProperty(str)) {
        var val = env.bindings[str];
        if (v.neg && typeof val === 'number')
            return -val;
        return val;
    }
    return lookup(env.outer, v);
};

// Update existing binding in environment
var update = function (env, v, val) {
    if (env.hasOwnProperty('bindings')) {
        var str = v.hasOwnProperty('name') ? v.name : v;

        if (env.bindings.hasOwnProperty(str)) {
            env.bindings[str] = val;
        } else {
            update(env.outer, v, val);
        }
    } else {
        throw new Error('Undefined variable update ' + v);
    }
};

// Add a new binding to outermost level
// variable = {neg:true/false, name:name}
var addBinding = function (env, v, val) {
    var str = v.hasOwnProperty('name') ? v.name : v;

    if (env.hasOwnProperty('bindings')) {
        env.bindings[str] = val;
    } else {
        env.bindings = {};
        env.outer = {};
        env.bindings[str] = val;
    }
};

// Create a new scope.
var newScope = function (env) {
    return { bindings:{}, outer:env };
}

// Call a fucnction on arguments.
// { tag: "call", name:"function-name", args:[] }
var call = function (expr, env) {
    // Get function value.
    var func = lookup(env, expr.name);

    // Evaluate argumetns to pass.
    var ev_args = [];
    var i;
    for (i = 0; i < expr.args.length; ++i) {
        ev_args[i] = evalExpr(expr.args[i], env);
    }

    var val = func.apply(env, ev_args);
    return val;
};

// Evaluate an expression and return the result.
var evalExpr = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }

    // Look at tag to see what to do.
    switch(expr.tag) {
        case 'and':
            return evalExpr(expr.left, env) &&
                   evalExpr(expr.right, env);
        case 'or':
            return evalExpr(expr.left, env) ||
                   evalExpr(expr.right, env);

        // Conditionals.
        case '<':
            return evalExpr(expr.left, env) <
                   evalExpr(expr.right, env);
        case '>':
            return evalExpr(expr.left, env) >
                   evalExpr(expr.right, env);
        case '<=':
            return evalExpr(expr.left, env) <=
                   evalExpr(expr.right, env);
        case '>=':
            return evalExpr(expr.left, env) >=
                   evalExpr(expr.right, env);
        case '!=':
            return evalExpr(expr.left, env) !=
                   evalExpr(expr.right, env);
        case '==':
            return evalExpr(expr.left, env) ===
                   evalExpr(expr.right, env);

        // Basic operations.
        case '+':
            return evalExpr(expr.left, env) +
                   evalExpr(expr.right, env);
        case '-':
            return evalExpr(expr.left, env) -
                   evalExpr(expr.right, env);
        case '*':
            return evalExpr(expr.left, env) *
                   evalExpr(expr.right, env);
        case '/':
            return evalExpr(expr.left, env) /
                   evalExpr(expr.right, env);
        case '%':
            return evalExpr(expr.left, env) %
                   evalExpr(expr.right, env);
        case '^':
            return Math.pow(evalExpr(expr.left, env),
                            evalExpr(expr.right, env));

        // Variable expression:
        // {tag: "ident", name: "x"}
        case "ident":
            return lookup(env, expr.name);

        // Function calls.
        case 'call':
            return call(expr, env);

        // Should not get here
        default:
            throw new Error('Unknown form in AST expression ' + expr.tag);
    }
};

// Evaluate a statement and return the result.
// {statement:statment, children:children}
var evalBlock = function (block, env) {
    var val = undefined;
    var stmt = block.statement;
    var num;
    var i;

    // Statements always have tags.
    switch(stmt.tag) {
        // A single expression
        // { tag:"ignore", body:expression }
        case 'ignore':
            // Just evaluate expression.
            return evalExpr(stmt.body, env);

        // Declare a new variable.
        // { tag:"set", left:x, right:5}
        case 'set':
            val = evalExpr(stmt.right, env);
            addBinding(env, stmt.left, val);
            return 0;

        // Assign a variable.
        // { tag:"=", left:x, right:5}
        case '=':
            val = evalExpr(stmt.right, env);
            update(env, stmt.left, val);
            return 0;

        // If statement.
        // {expr: { tag:"if", body:expression }, children:...}
        case 'if':
            if (evalExpr(stmt.expr, env)) {
                val = evalStatements(block.children, env);
            }
            return val;

        // Loop statement.
        // {expr: { tag:"loop", v:v, start:start, end:end}, children:...}
        case 'loop':
            var startVal = evalExpr(stmt.start, env);
            var endVal = evalExpr(stmt.end, env);
            var newEnv;
            for (i = startVal; i < endVal; i++) {
                newEnv = newScope(env);
                var str = stmt.v;
                addBinding(newEnv, str, i);
                evalStatements(block.children, newEnv);
            }
            return 0;

        // Repeat statment
        // {expr: { tag:"repeat", body:expression }, children:...}
        case 'repeat':
            // Evaluate expr for number of times to repeat
            num = evalExpr(stmt.expr, env);

            // Now do a loop
            for (i = 0; i < num; i++) {
                var newEnv = newScope(env);
                evalStatements(block.children, newEnv);
            }
            return 0;

        // Functions.
        // {expr: { tag:"function", name:"f", args[]}, children:...}
        case 'function':
            // the env is passed as "this"
            var newFunc = function() {
                // This function takes any number of arguments.
                var i;
                var newEnv = newScope(this);

                for (i = 0; i < stmt.args.length; i++) {
                    newEnv.bindings[stmt.args[i].name] = arguments[i];
                }

                return evalFunction(block.children, newEnv);
            };
            addBinding(env, stmt.name, newFunc);
            return 0;

        case 'return':
            // Just evaluate expression.
            return evalExpr(stmt.body, env);

        // Transforms.
        // {{tag:'transform', exprs:[list of transforms}}
        case 'transform':
            var newEnv = newScope(env);
            evalTransform(stmt.exprs, newEnv);
            evalStatements(block.children, newEnv);
            return 0;

        // Translate/scale/rotate
        // {tag:"translate"/"scale"/"rotate", xExpr:..., yExpr:..., zExpr:...}
        case 'translate':
            var newEnv = newScope(env);
            evalTranslate(stmt.xExpr, stmt.yExpr, stmt.zExpr, newEnv);
            evalStatements(block.children, newEnv);
            return 0;

        case 'scale':
            var newEnv = newScope(env);
            evalScale(stmt.xExpr, stmt.yExpr, stmt.zExpr, newEnv);
            evalStatements(block.children, newEnv);
            return 0;

        case 'rotate':
            var newEnv = newScope(env);
            evalRotate(stmt.xExpr, stmt.yExpr, stmt.zExpr, newEnv);
            evalStatements(block.children, newEnv);
            return 0;

        // Sphere
        // {{tag:'sphere', q:16 }}
        case 'sphere':
            var qVal = evalExpr(stmt.q, env);
            var transform = lookup(env, '#transform');
            var sphere = SCENE.addSphere(qVal, transform);
            gNewestObj = sphere;
            addBinding(env, '#object', sphere);

            return 0;

        // Cube
        // {{tag:'cube', q:16 }}
        case 'cube':
            var qVal = evalExpr(stmt.q, env);
            var transform = lookup(env, '#transform');

            var cube = SCENE.addCube(qVal, transform);
            gNewestObj = cube;
            addBinding(env, '#object', cube);

            return 0;

        // Plane
        // {{tag:'plane', q:16 }}
        case 'plane':
            var qVal = evalExpr(stmt.q, env);
            var transform = lookup(env, '#transform');

            var plane = SCENE.addPlane(qVal, transform);
            gNewestObj = plane;
            addBinding(env, '#object', plane);

            return 0;

        // Lathe
        // {tag:'lathe', tStep:expr, yStep:expr }
        case 'lathe':
            var tStep = evalExpr(stmt.tStep, env);
            var yStep = evalExpr(stmt.yStep, env);
            if (tStep < 2 || yStep < 2)
                throw new Error("Lathe arguments must be greater than 1.");

            var tCounter, yCounter;
            var t, y, r;
            var newEnv;

            // vertArray[i][j] is the vertex at t=i and y=j
            // where t is the angle of the point from the origin
            // and y is the height of the point
            var vertArray = new Array(tStep)
            for (i = 0; i < tStep; i++) {
                vertArray[i] = new Array(yStep);
            }

            for (tCounter = 0; tCounter < tStep; tCounter++) {
                for (yCounter = 0; yCounter < yStep; yCounter++) {
                    // calculate the percentages
                    t = 2 * Math.PI * tCounter / (tStep - 1.0);
                    y = yCounter / (yStep - 1.0);

                    // add the new default bindings that we use for lathes
                    newEnv = newScope(env);
                    addBinding(newEnv, "t", t);
                    addBinding(newEnv, "y", y);

                    // calculate the radius at t, y
                    vertArray[tCounter][yCounter] = evalFunction(block.children, newEnv);
                }
            }

            var transform = lookup(env, '#transform');
            var lathe = SCENE.addLatheObject(vertArray, transform);
            gNewestObj = lathe;
            addBinding(env, '#object', lathe);

            return 0;

        // displace function
        // {tag:'displace'}
        case 'displace':
            function newFunc(env) {
                return function(x, y, z) {
                    var newEnv = newScope(env);
                    addBinding(newEnv, 'x', x);
                    addBinding(newEnv, 'y', y);
                    addBinding(newEnv, 'z', z);
                    evalFunction(block.children, newEnv);
                    return [lookup(newEnv, 'x'),
                            lookup(newEnv, 'y'),
                            lookup(newEnv, 'z')];
                };
            };
            gNewestObj.geometry.addDisplacement(newFunc(env));

            return 0;

        // vertex displacement
        case 'displacev':
            var compiledDisplacement = standalone(block.children, env);
            gNewestObj.addVDisplacement(compiledDisplacement);
            return 0;

        // random displacement
        // {statement:{tag:'displacen', noise:10}, children:{}}
        case 'displacen':
            var noiseVal = evalExpr(stmt.noise, env);
            gNewestObj.addDisplacementNoise(noiseVal);
            return 0;

        // find a vertex on the object and transform the next object by its
        // position and normal4
        // {statement:{tag:'attach', xMin:expr, yMin:expr, zMin:expr
        // xMax:expr, yMax:expr, zMax:expr }, children:{}}
        case 'attach':
            var xMin = evalExpr(stmt.xMin, env);
            var yMin = evalExpr(stmt.yMin, env);
            var zMin = evalExpr(stmt.zMin, env);
            var xMax = evalExpr(stmt.xMax, env);
            var yMax = evalExpr(stmt.yMax, env);
            var zMax = evalExpr(stmt.zMax, env);

            // we attach to the most recent object in our scope
            var object = lookup(env, '#object');
            var curTransform = lookup(env, '#transform');
            var transform = object.geometry.getAttachPoint(xMin, yMin, zMin,
                                                           xMax, yMax, zMax);
            // if we found a point to attach to
            if (transform) {
                var newEnv = newScope(env);
                var newTransform = new THREE.Matrix4().multiplyMatrices(transform, curTransform);
                addBinding(newEnv, '#transform', newTransform);
                evalStatements(block.children, newEnv);
            }
            return 0;

        // Choice
        // {tag:'choose'} followed by n blocks of "option"
        case 'choose':
            val = evalOptions(block.children, env);
            return val;

        // Seed
        // {tag:'seed' v:identifier}
        case 'seed':
            var name = stmt.v.name;
            SCENE.setSeed(name);
            return 0;

        // Should not get here.
        default:
            throw new Error('Unknown form in AST statement ' + stmt.tag);
    }
};

var evalTranslate = function (xExpr, yExpr, zExpr, env) {
    var tx = evalExpr(xExpr, env);
    var ty = evalExpr(yExpr, env);
    var tz = evalExpr(zExpr, env);

    var curTransform = lookup(env, '#transform');
    var translateMat = new THREE.Matrix4().makeTranslation(tx, ty, tz);
    addBinding(env, '#transform', new THREE.Matrix4().multiplyMatrices(translateMat, curTransform));
};

var evalScale = function (xExpr, yExpr, zExpr, env) {
    var sx = evalExpr(xExpr, env);
    var sy = evalExpr(yExpr, env);
    var sz = evalExpr(zExpr, env);

    if (sx == 0 || sy == 0 || sz == 0)
        throw new Error("Cannot scale to 0.");

    var curTransform = lookup(env, '#transform');
    var scaleMat = new THREE.Matrix4().makeScale(sx, sy, sz);
    addBinding(env, '#transform', new THREE.Matrix4().multiplyMatrices(curTransform, scaleMat));
};

var evalRotate = function(xExpr, yExpr, zExpr, env) {
    var rx = evalExpr(xExpr, env);
    var ry = evalExpr(yExpr, env);
    var rz = evalExpr(zExpr, env);

    var curTransform = lookup(env, '#transform');
    var rotationX = new THREE.Matrix4().makeRotationX(rx);
    var rotationY = new THREE.Matrix4().makeRotationY(ry);
    var rotationZ = new THREE.Matrix4().makeRotationZ(rz);
    var rotationMat = new THREE.Matrix4().multiplyMatrices(rotationX, rotationY);
    rotationMat.multiply(rotationZ);
    addBinding(env, '#transform', new THREE.Matrix4().multiplyMatrices(rotationMat, curTransform));
};

var evalTransform = function (seq, env) {
    if (seq.length % 3 != 0 || seq.length == 0 || seq.length > 9)
        throw new Error('Invalid transform of length ' + seq.length);


    if (seq.length == 9) {
        evalRotate(seq[6], seq[7], seq[8], env);
    }

    if (seq.length >= 6) {
        evalScale(seq[3], seq[4], seq[5], env);
    }
    evalTranslate(seq[0], seq[1], seq[2], env);
};

var evalFunction = function (seq, env) {
    var i;
    var val = undefined;

    // Only return the result of the "return" statement.
    for (i = 0; i < seq.length; i++) {
        if (seq[i] === undefined || seq[i].statement === undefined)
            continue;

        val = evalBlock(seq[i], env);
        if (seq[i].statement.tag === 'return') {
            return val;
        }
    }
    return val;
};

var evalStatements = function (seq, env) {
    var i;
    var val = undefined;

    for (i = 0; i < seq.length; i++) {
        if (seq[i] === undefined || seq[i].statement === undefined)
            continue;

        val = evalBlock(seq[i], env);
    }
    return val;
};

// Evaluate one of the options according to their probability.
var evalOptions = function (options, env) {
    var i;
    var total = 0;

    // sum up the total choice amount
    for (i = 0; i < options.length; i++) {
        if (options[i] === undefined || options[i].statement === undefined)
            continue;
        if (options[i].statement.tag !== 'option')
            throw new Error(options[i].statement.tag + " where there should be an option.");
        total += evalExpr(options[i].statement.expr, env);
    }

    var rand = Math.random();
    var currentTotal = 0;
    var val;
    for (i = 0; i < options.length; i++) {
        if (options[i] === undefined || options[i].statement === undefined)
            continue;
        currentTotal += evalExpr(options[i].statement.expr, env);
        if (rand <= currentTotal / total) {
            // do this option
            val = evalStatements(options[i].children, env);
            break;
        }
    }
    return val;
};

// If we are used as Node module, export symbols
if (typeof module !== 'undefined') {
    module.exports.addBinding = addBinding;
}
