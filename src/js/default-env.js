if (typeof module !== 'undefined') {
    addBinding = require('./parser.js').addBinding;
}

var defaultEnv = function() {
    var env = { };

    var clamp = function(v, minVal, maxVal) {
        return Math.min(Math.max(v, minVal), maxVal);
    }

    addBinding(env, 'sin', Math.sin);
    addBinding(env, 'cos', Math.cos);
    addBinding(env, 'abs', Math.abs);
    addBinding(env, 'sqrt', Math.sqrt);
    addBinding(env, 'min', Math.min);
    addBinding(env, 'max', Math.max);
    addBinding(env, 'clog', function(x) { console.log(x); });
    addBinding(env, 'clamp', clamp);

    // random in range from min to max
    addBinding(env, 'rand',
        function(min, max) { return min !== undefined && max !== undefined ? Math.random() * (max - min) + min : Math.random(); });

    // random integer in range from min to max
    addBinding(env, 'randi',
        function(min, max) { return Math.floor(Math.random() * (Math.round(max) - Math.round(min) + 1)) + Math.round(min); });

    addBinding(env, 'PI', Math.PI);
    addBinding(env, 'EPS', 0.001);

    addBinding(env, 'lerp', function(v0, v1, t) { return v0+(v1-v0)*t; });
    addBinding(env, 'smoothstep',
        function(edge0, edge1, x) {
            x = clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0);
            return x*x*x*(x*(x*6-15)+10);
        }
    );

    addBinding(env, '#transform', new THREE.Matrix4());
    addBinding(env, '#object', undefined);

    // these do not work in node
    if (typeof module === 'undefined') {
        addBinding(env, 'alert', alert);

        // uniforms
        addBinding(env, '#b', 0.0);
        addBinding(env, '#noise', 0.0);
    }

    return env;
};

// If we are used as Node module, export symbols
if (typeof module !== 'undefined') {
    module.exports.defaultEnv = defaultEnv;
}