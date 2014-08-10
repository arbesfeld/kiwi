var preProcess = function () {
    return 'float x = position.x;\n' +
           'float y = position.y;\n' +
           'float z = position.z;\n';
};

var postProcess = function () {
    return 'vec3 displacedPosition = vec3(x, y, z);\n';
};

// Load a file |file| and return |callback| when the file has been loaded
// |noCache| specifies whether the url should be cached
// |isJSON| specifies whether the file is a JSON
function loadFile(file, callback, noCache, isJSON) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 1) {
            if (isJSON) {
                request.overrideMimeType('application/json');
            }
            request.send();
        } else if (request.readyState == 4) {
            if (request.status == 200) {
                callback(request.responseText);
            } else if (request.status == 404) {
                throw 'File "' + file + '" does not exist.';
            } else {
                throw 'XHR error ' + request.status + '.';
            }
        }
    };
    var url = file;
    if (noCache) {
        url += '?' + (new Date()).getTime();
    }
    request.open('GET', url, true);
};

THREE.Geometry.prototype.addDisplacement = function (mapFunc) {
    for (var i = 0; i < this.vertices.length; i++) {
        this.vertices[i].set.apply(this.vertices[i], mapFunc(this.vertices[i].x,
                                         this.vertices[i].y,
                                         this.vertices[i].z));
    }
    this.verticesNeedUpdate = true;
    this.normalsNeedUpdate = true;
    // this.mergeVertices();
    // this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals();
};

THREE.Geometry.prototype.getAttachPoint = function (xMin, yMin, zMin, xMax, yMax, zMax) {
    var face, vert;
    var finalVert = undefined;
    var normal = undefined;
    for (var i = 0; i < this.faces.length; i++) {
        face = this.faces[i];
        vert = this.vertices[face.a].add(this.vertices[face.b]).add(this.vertices[face.c]).multiplyScalar(1/3);
        if (vert.x + 0.005 >= xMin &&
            vert.y + 0.005 >= yMin &&
            vert.z + 0.005 >= zMin &&
            vert.x - 0.005 <= xMax &&
            vert.y - 0.005 <= yMax &&
            vert.z - 0.005 <= zMax) {
            finalVert = vert;
            normal = face.vertexNormals[0].add(face.vertexNormals[1]).add(face.vertexNormals[2]).multiplyScalar(1/3);
            break;
        }
    }

    if (finalVert && normal) {
        var xyLength = Math.sqrt(normal.x*normal.x + normal.y*normal.y);
        var zAngle, xAngle;
        // will be 0 when vec is pointing along the +z or -z axis
        if (xyLength == 0) {
            zAngle = normal.x > 0 ? Math.PI/2 : -Math.PI/2;
        } else {
            zAngle = Math.acos(normal.y / xyLength);
        }

        xAngle = Math.acos(xyLength);
        xAngle = normal.z > 0 ? xAngle : -xAngle;
        zAngle = normal.x > 0 ? -zAngle : zAngle;

        var translateMat = new THREE.Matrix4().makeTranslation(finalVert.x, finalVert.y, finalVert.z);
        var xRotation = new THREE.Matrix4().makeRotationX(xAngle);
        var zRotation = new THREE.Matrix4().makeRotationZ(zAngle);
        return translateMat.multiply(zRotation.multiply(xRotation));
    }
};

THREE.Mesh.prototype.addVDisplacement = function (str) {
    if (!this.displacementString)
        this.displacementString = '';
    this.displacementString += "{\n" + str + "}\n";
    console.log(str);
    this.setMaterial();
};

THREE.Mesh.prototype.addDisplacementNoise = function (noiseVal) {
    this.noise = noiseVal;
    this.setMaterial();
};


THREE.Mesh.prototype.setMaterial = function () {
    var displacementString = this.displacementString || '';
    var vertexShaderStart = document.getElementById('vertexShaderStart').textContent;
    var vertexShaderEnd = document.getElementById('vertexShaderEnd').textContent;

    var lambertVertexShader = ShaderLib.DEFAULT_FUNC + vertexShaderStart + preProcess() +
                              displacementString + postProcess() + vertexShaderEnd;
    var uniforms = THREE.ShaderLib.lambert.uniforms;
    if (this.noise) {
        // random displacement material
        var myUniforms = {
            tExplosion: { type: "t", value: this.fireTexture },
            noiseFactor: {type: 'f', value:this.noise}
        };

        var mergeUniforms = THREE.UniformsUtils.merge( [
            uniforms,
            myUniforms
        ] );

        this.material = new THREE.ShaderMaterial( {
            vertexShader: "#define USE_NOISE\n" + lambertVertexShader,
            fragmentShader: "#define USE_NOISE\n" + this.fshader,
            uniforms: mergeUniforms,
            lights:true
        });
    } else {
        // this.material = new THREE.ShaderMaterial ({
        //     vertexShader: lambertVertexShader,
        //     fragmentShader: this.fshader,
        //     uniforms: uniforms,
        //     lights:true
        // });
        this.material = new THREE.ShaderMaterial ({
            vertexShader: lambertVertexShader,
            fragmentShader: this.fshader,
            uniforms: uniforms,
            lights:true
        });
    }
    this.material.needsUpdate = true;
};


THREE.Geometry.prototype.myComputeVertexNormals = function() {

        var v, vl, f, fl, face, vertices;

        // create internal buffers for reuse when calling this method repeatedly
        // (otherwise memory allocation / deallocation every frame is big resource hog)

        if ( this.__tmpVertices === undefined ) {

                this.__tmpVertices = new Array( this.vertices.length );
                vertices = this.__tmpVertices;

                for ( v = 0, vl = this.vertices.length; v < vl; v ++ ) {

                        vertices[ v ] = new THREE.Vector3();

                }

                for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                        face = this.faces[ f ];
                        face.vertexNormals = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

                }

        } else {

                vertices = this.__tmpVertices;

                for ( v = 0, vl = this.vertices.length; v < vl; v ++ ) {

                        vertices[ v ].set( 0, 0, 0 );

                }

        }

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                face = this.faces[ f ];

                vertices[ face.a ].add( face.normal );
                vertices[ face.b ].add( face.normal );
                vertices[ face.c ].add( face.normal );

        }


        for ( v = 0, vl = this.vertices.length; v < vl; v ++ ) {

                vertices[ v ].normalize();

        }
        return vertices;
};