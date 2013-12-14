
// Radii array is a 2d array that contains the radius at every point
// from 0 to 2pi around the object, and from 0 to 1 along the y axis.
// radiiArray[i][j] is at the angle i/len*2pi and the height j/len.
THREE.CustomLatheGeometry = function ( radiiArray, scale, height ) {

        THREE.Geometry.call( this );

        var segments = radiiArray.length;
        var pointLength = radiiArray[0].length;

        var inversePointLength = 1.0 / ( pointLength - 1 );
        var inverseSegments = 1.0 / segments;

        for ( var i = segments; i >= 0; i-- ) {

                var phi = i * inverseSegments * 2 * Math.PI;
                var c = Math.cos( phi ),
                    s = Math.sin( phi );

                for ( var j = 0, jl = pointLength; j < jl; j++ ) {

                        var r = radiiArray[i%segments][j];
                        var vertex = new THREE.Vector3();

                        vertex.x = scale * c * r;
                        vertex.y = height * scale * j * inversePointLength;
                        vertex.z = scale * s * r;

                        this.vertices.push( vertex );

                }

        }

        var np = pointLength;

        // push vertices for the top and bottom face
        this.vertices.push( new THREE.Vector3(0, 0, 0) ); // (segments+1)*np
        this.vertices.push( new THREE.Vector3(0, height*scale, 0) ); // (segments+1)*(np+1)
        var bottomFaceV = (segments+1)*np;
        var topFaceV = (segments+1)*np+1;

        for ( var i = 0, il = segments; i < il; i ++ ) {

                for ( var j = 0, jl = pointLength - 1; j < jl; j ++ ) {

                        var base = j + np * i;
                        var a = base;
                        var b = base + np;
                        var c = base + 1 + np;
                        var d = base + 1;

                        var u0 = i * inverseSegments;
                        var v0 = j * inversePointLength;
                        var u1 = u0 + inverseSegments;
                        var v1 = v0 + inversePointLength;

                        this.faces.push( new THREE.Face3( a, b, d ) );

                        this.faceVertexUvs[ 0 ].push( [

                                new THREE.Vector2( u0, v0 ),
                                new THREE.Vector2( u1, v0 ),
                                new THREE.Vector2( u0, v1 )

                        ] );

                        this.faces.push( new THREE.Face3( b, c, d ) );

                        this.faceVertexUvs[ 0 ].push( [

                                new THREE.Vector2( u1, v0 ),
                                new THREE.Vector2( u1, v1 ),
                                new THREE.Vector2( u0, v1 )

                        ] );

                        // make the bottom face
                        if (j == 0) {
                                // TODO: add UVs
                                this.faces.push( new THREE.Face3( a, bottomFaceV, b ) );
                        }
                        // make the top face
                        if (j == pointLength - 2) {
                                this.faces.push( new THREE.Face3( c, topFaceV, d ) );
                        }
                }

        }

        this.mergeVertices();
        this.computeCentroids();
        this.computeFaceNormals();
        this.computeVertexNormals();

};

THREE.CustomLatheGeometry.prototype = Object.create( THREE.Geometry.prototype );