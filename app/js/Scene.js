// helper functions

// convert a list into a list of args and apply a constructor
function construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
}

// transform a mesh according to transform
function transformMesh(mesh, transform) {
    mesh.matrixAutoUpdate = false;

    var meshMatrix = mesh.matrixWorld.clone();
    mesh.matrix.multiply(meshMatrix.multiply(transform));
}

Scene.prototype.resizeCanvas = function() {
   // only change the size of the canvas if the size it's being displayed
   // has changed.
    if (!this.renderer)
        return;

    var $container = $('#canvas');

    this.WIDTH = $container.width();
    this.HEIGHT = $container.height();

    this.renderer.setSize(this.WIDTH, this.HEIGHT);
    this.camera.aspect = this.WIDTH / this.HEIGHT;
    this.camera.updateProjectionMatrix();
};

function Scene(callback) {
    // set the scene size
    this.SCALE = 1;

    // get the DOM element to attach to
    // - assume we've got jQuery to hand
    var $container = $('#canvas');

    this.WIDTH = $container.width();
    this.HEIGHT = $container.height();

    // set some camera attributes
    var VIEW_ANGLE = 45,
      ASPECT = this.WIDTH / this.HEIGHT,
      NEAR = 0.1,
      FAR = 10000;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // start the renderer
    this.renderer.setSize(this.WIDTH, this.HEIGHT);

    // attach the render-supplied DOM element
    $container.append(this.renderer.domElement);

    this.camera =
      new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR);

    // the camera starts at 0,0,0
    // so pull it back
    this.camera.position.x = 10;
    this.camera.position.y = 10;
    this.camera.position.z = 10;

    this.controls = new THREE.OrbitControls(this.camera);

    // load shaders
    this.vsRandDisplacement = Object("");
    this.fsRandDisplacement = Object("");
    this.fsDefault = Object("");

    function shaderLoaded(shader) {
        return function(str) {
            shader.valueOf = shader.toSource = shader.toString = function() { return str; };

            if (this.fsDefault.valueOf() !== "") {
                // all shaders have loaded, we are done with init
                callback();
            }
        };
    }

    loadFile("kiwi/shaders/fs-default.txt", shaderLoaded(this.fsDefault).bind(this), false);

    this.fireTexture = new THREE.ImageUtils.loadTexture( 'kiwi/images/explosion.png' );
}

Scene.prototype.init = function() {
    this.scene = new THREE.Scene();

    // add the camera to the scene
    this.scene.add(this.camera);

    var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 0.75, 0.5 );
    hemiLight.groundColor.setHSL( 0.095, 0.5, 0.5 );
    hemiLight.position.set( 0, 500, 0 );
    this.scene.add( hemiLight );

    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( -1, 0.75, 1 );
    dirLight.position.multiplyScalar( 50);
    dirLight.name = "dirlight";
    dirLight.castShadow = true;
    dirLight.shadowDarkness = 0.5;
    // dirLight.shadowCameraVisible = true;

    this.scene.add( dirLight );

    dirLight.castShadow = true;
    dirLight.shadowMapWidth = dirLight.shadowMapHeight = 1024*2;

    var d = 300;

    dirLight.shadowCameraLeft = -d;
    dirLight.shadowCameraRight = d;
    dirLight.shadowCameraTop = d;
    dirLight.shadowCameraBottom = -d;

    dirLight.shadowCameraFar = 3500;
    dirLight.shadowBias = -0.0001;
    dirLight.shadowDarkness = 0.35;

    this.geometry = [];

    // // add subtle blue ambient lighting
    // var ambientLight = new THREE.AmbientLight(0x000044);
    // this.scene.add(ambientLight);

    // this.controls.addEventListener( 'change',
    //     this.render.bind(this)
    // );

    // this.render();
    this.animate.call(this);
};

Scene.prototype.render = function() {
    this.controls.update();
	this.renderer.render(this.scene, this.camera);
};

Scene.prototype.animate = function() {
//     controls.update();
    requestAnimationFrame(this.animate.bind(this));
    this.render();
};

// q = quality of sphere
// transform = transform of sphere
Scene.prototype.addSphere = function(q, transform) {
    var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(this.SCALE/2, q, q),
      new THREE.MeshBasicMaterial());

    sphere.fshader = this.fsDefault;
    transformMesh(sphere, transform);
    sphere.setMaterial();

    this.geometry.push(sphere);
    this.scene.add(sphere);
    this.render();
    return sphere;
};

Scene.prototype.addCube = function(q, transform) {
    var cube = new THREE.Mesh(
      new THREE.CubeGeometry(this.SCALE, this.SCALE, this.SCALE, q, q, q),
      new THREE.MeshBasicMaterial());

    cube.fshader = this.fsDefault;
    transformMesh(cube, transform);
    cube.setMaterial();

    this.geometry.push(cube);
    this.scene.add(cube);
    this.render();
    return cube;
};

Scene.prototype.addPlane = function(q, transform) {
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.SCALE, this.SCALE, q, q),
      new THREE.MeshBasicMaterial());

    plane.fshader = this.fsDefault;
    transformMesh(plane, transform);
    plane.setMaterial();
    plane.material.side = THREE.DoubleSide;

    this.geometry.push(plane);
    this.scene.add(plane);
    this.render();

    return plane;
};

// Radii array is a 2d array that contains the radius at every point
// from 0 to 2pi around the object, and from 0 to 1 along the y axis.
// radiiArray[i][j] is at the angle i/len*2pi and the height j/len.
Scene.prototype.addLatheObject = function (radiiArray, transform) {
    var lathe = new THREE.Mesh(
        new THREE.CustomLatheGeometry(radiiArray, this.SCALE, this.SCALE),
        new THREE.MeshBasicMaterial());

    lathe.fshader = this.fsDefault;
    lathe.setMaterial();

    transformMesh(lathe, transform);

    this.geometry.push(lathe);
    this.scene.add(lathe);
    this.render();

    return lathe;
};

Scene.prototype.setSeed = function (seedName) {
    Math.seedrandom(seedName);
};

var vNum = 0;
Scene.prototype.export = function() {
    if (!this.geometry)
        return;
    var res;
    var zip = new JSZip();
    var geometry = new THREE.Geometry();
    for (var i = 0; i < this.geometry.length; i++) {
        THREE.GeometryUtils.merge(geometry, this.geometry[i]);
    }
    res = stlFromGeometry(geometry);
    zip.file("object.stl", res);
    var content = zip.generate({type:"blob"});
    // var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
    saveAs(content, "object.zip");
    // location.href = "data:application/zip;base64," + content;
};


function stlFromGeometry( geometry ) {
        // var mat = geometry.matrixWorld;
        // var imat = new THREE.Matrix4().getInverse(mat);
        // image = imat.transpose();
        // calculate the faces and normals if they are not yet present
        // geometry.geometry.computeFaceNormals();

        var facetToStl = function( verts, normal ) {
                var faceStl = '';
                // var normal = normal.applyMatrix4(imat);
                faceStl += 'facet normal ' + normal.x + ' ' + normal.y + ' ' +  normal.z + '\n';
                faceStl += 'outer loop\n';

                for ( var j = 0; j < 3; j++ ) {
                        var vert = verts[j];
                        // vert = vert.applyMatrix4(mat);
                        faceStl += 'vertex ' + (vert.x) + ' ' + (vert.y) + ' ' + (vert.z) + '\n';
                }

                faceStl += 'endloop\n';
                faceStl += 'endfacet\n';

                return faceStl;
        };

        // start bulding the STL string
        var stl = '';
        stl += 'solid\n';

        for ( var i = 0; i < geometry.faces.length; i++ ) {
                var face = geometry.faces[i];

                // if we have just a griangle, that's easy. just write them to the file
                if ( face.d === undefined ) {
                        var verts = [
                                geometry.vertices[ face.a ],
                                geometry.vertices[ face.b ],
                                geometry.vertices[ face.c ]
                        ];

                        stl += facetToStl( verts, face.normal );

                } else {
                        // if it's a quad, we need to triangulate it first
                        // split the quad into two triangles: abd and bcd
                        var verts = [];
                        verts[0] = [
                                geometry.vertices[ face.a ],
                                geometry.vertices[ face.b ],
                                geometry.vertices[ face.d ]
                        ];
                        verts[1] = [
                                geometry.vertices[ face.b ],
                                geometry.vertices[ face.c ],
                                geometry.vertices[ face.d ]
                        ];

                        for ( var k = 0; k<2; k++ ) {
                                stl += facetToStl( verts[k], face.normal );
                        }

                }
        }

        stl += 'endsolid\n';

        return stl;
}