
var ShaderLib = {
	DEFAULT_FUNC :
		"float lerp(float v0, float v1, float t) { return v0+(v1-v0)*t; }\n\n",

 	LAMBERT_START :
		"varying vec3 vViewPosition;\n" +
		"#define LAMBERT\n" +
		"varying vec3 vLightFront;\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"varying vec3 vLightBack;\n" +
		"#endif\n" +
		"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP )\n" +
		"varying vec2 vUv;\n" +
		"uniform vec4 offsetRepeat;\n" +
		"#endif\n" +
		"#ifdef USE_LIGHTMAP\n" +
		"varying vec2 vUv2;\n" +
		"#endif\n" +
		"#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP )\n" +
		"varying vec3 vReflect;\n" +
		"uniform float refractionRatio;\n" +
		"uniform bool useRefract;\n" +
		"#endif\n" +
		"#ifdef WRAP_AROUND\n" +
		"uniform vec3 wrapRGB;\n" +
		"#endif\n" +
		"#ifdef USE_COLOR\n" +
		"varying vec3 vColor;\n" +
		"#endif\n" +
		"#ifdef USE_MORPHTARGETS\n" +
		"#ifndef USE_MORPHNORMALS\n" +
		"uniform float morphTargetInfluences[ 8 ];\n" +
		"#else\n" +
		"uniform float morphTargetInfluences[ 4 ];\n" +
		"#endif\n" +
		"#endif\n" +
		"#ifdef USE_SKINNING\n" +
		"#ifdef BONE_TEXTURE\n" +
		"uniform sampler2D boneTexture;\n" +
		"uniform int boneTextureWidth;\n" +
		"uniform int boneTextureHeight;\n" +
		"mat4 getBoneMatrix( const in float i ) {\n" +
		"float j = i * 4.0;\n" +
		"float x = mod( j, float( boneTextureWidth ) );\n" +
		"float y = floor( j / float( boneTextureWidth ) );\n" +
		"float dx = 1.0 / float( boneTextureWidth );\n" +
		"float dy = 1.0 / float( boneTextureHeight );\n" +
		"y = dy * ( y + 0.5 );\n" +
		"vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );\n" +
		"vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );\n" +
		"vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );\n" +
		"vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );\n" +
		"mat4 bone = mat4( v1, v2, v3, v4 );\n" +
		"return bone;\n" +
		"}\n" +
		"#else\n" +
		"uniform mat4 boneGlobalMatrices[ MAX_BONES ];\n" +
		"mat4 getBoneMatrix( const in float i ) {\n" +
		"mat4 bone = boneGlobalMatrices[ int(i) ];\n" +
		"return bone;\n" +
		"}\n" +
		"#endif\n" +
		"#endif\n" +
		"#ifdef USE_SHADOWMAP\n" +
		"varying vec4 vShadowCoord[ MAX_SHADOWS ];\n" +
		"uniform mat4 shadowMatrix[ MAX_SHADOWS ];\n" +
		"#endif\n" +
		"void main() {\n",

	LAMBERT_END :
		"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP )\n" +
		"vUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n" +
		"#endif\n" +
		"#ifdef USE_LIGHTMAP\n" +
		"vUv2 = uv2;\n" +
		"#endif\n" +
		"#ifdef USE_COLOR\n" +
		"#ifdef GAMMA_INPUT\n" +
		"vColor = color * color;\n" +
		"#else\n" +
		"vColor = color;\n" +
		"#endif\n" +
		"#endif\n" +
		"#ifdef USE_MORPHNORMALS\n" +
		"vec3 morphedNormal = vec3( 0.0 );\n" +
		"morphedNormal +=  ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];\n" +
		"morphedNormal +=  ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];\n" +
		"morphedNormal +=  ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];\n" +
		"morphedNormal +=  ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];\n" +
		"morphedNormal += normal;\n" +
		"#endif\n" +
		"#ifdef USE_SKINNING\n" +
		"mat4 boneMatX = getBoneMatrix( skinIndex.x );\n" +
		"mat4 boneMatY = getBoneMatrix( skinIndex.y );\n" +
		"#endif\n" +
		"#ifdef USE_SKINNING\n" +
		"mat4 skinMatrix = skinWeight.x * boneMatX;\n" +
		"skinMatrix  += skinWeight.y * boneMatY;\n" +
		"#ifdef USE_MORPHNORMALS\n" +
		"vec4 skinnedNormal = skinMatrix * vec4( morphedNormal, 0.0 );\n" +
		"#else\n" +
		"vec4 skinnedNormal = skinMatrix * vec4( normal, 0.0 );\n" +
		"#endif\n" +
		"#endif\n" +
		"vec3 objectNormal;\n" +
		"#ifdef USE_SKINNING\n" +
		"objectNormal = skinnedNormal.xyz;\n" +
		"#endif\n" +
		"#if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )\n" +
		"objectNormal = morphedNormal;\n" +
		"#endif\n" +
		"#if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )\n" +
		"objectNormal = normal;\n" +
		"#endif\n" +
		"#ifdef FLIP_SIDED\n" +
		"objectNormal = -objectNormal;\n" +
		"#endif\n" +
		"vec3 transformedNormal = normalMatrix * objectNormal;\n" +
		"#ifdef USE_MORPHTARGETS\n" +
		"vec3 morphed = vec3( 0.0 );\n" +
		"morphed += ( morphTarget0 - displacedPosition ) * morphTargetInfluences[ 0 ];\n" +
		"morphed += ( morphTarget1 - displacedPosition ) * morphTargetInfluences[ 1 ];\n" +
		"morphed += ( morphTarget2 - displacedPosition ) * morphTargetInfluences[ 2 ];\n" +
		"morphed += ( morphTarget3 - displacedPosition ) * morphTargetInfluences[ 3 ];\n" +
		"#ifndef USE_MORPHNORMALS\n" +
		"morphed += ( morphTarget4 - displacedPosition ) * morphTargetInfluences[ 4 ];\n" +
		"morphed += ( morphTarget5 - displacedPosition ) * morphTargetInfluences[ 5 ];\n" +
		"morphed += ( morphTarget6 - displacedPosition ) * morphTargetInfluences[ 6 ];\n" +
		"morphed += ( morphTarget7 - displacedPosition ) * morphTargetInfluences[ 7 ];\n" +
		"#endif\n" +
		"morphed += displacedPosition;\n" +
		"#endif\n" +
		"#ifdef USE_SKINNING\n" +
		"#ifdef USE_MORPHTARGETS\n" +
		"vec4 skinVertex = vec4( morphed, 1.0 );\n" +
		"#else\n" +
		"vec4 skinVertex = vec4( displacedPosition, 1.0 );\n" +
		"#endif\n" +
		"vec4 skinned  = boneMatX * skinVertex * skinWeight.x;\n" +
		"skinned     += boneMatY * skinVertex * skinWeight.y;\n" +
		"#endif\n" +
		"vec4 mvPosition;\n" +
		"#ifdef USE_SKINNING\n" +
		"mvPosition = modelViewMatrix * skinned;\n" +
		"#endif\n" +
		"#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS )\n" +
		"mvPosition = modelViewMatrix * vec4( morphed, 1.0 );\n" +
		"#endif\n" +
		"#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS )\n" +
		"mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );\n" +
		"#endif\n" +
		"vViewPosition = -mvPosition.xyz;\n" +
		"gl_Position = projectionMatrix * mvPosition;\n" +
		"#if defined( USE_ENVMAP ) || defined( PHONG ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )\n" +
		"#ifdef USE_SKINNING\n" +
		"vec4 worldPosition = modelMatrix * skinned;\n" +
		"#endif\n" +
		"#if defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )\n" +
		"vec4 worldPosition = modelMatrix * vec4( morphed, 1.0 );\n" +
		"#endif\n" +
		"#if ! defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )\n" +
		"vec4 worldPosition = modelMatrix * vec4( displacedPosition, 1.0 );\n" +
		"#endif\n" +
		"#endif\n" +
		"#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP )\n" +
		"vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * objectNormal;\n" +
		"worldNormal = normalize( worldNormal );\n" +
		"vec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n" +
		"if ( useRefract ) {\n" +
		"vReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n" +
		"} else {\n" +
		"vReflect = reflect( cameraToVertex, worldNormal );\n" +
		"}\n" +
		"#endif\n" +
		"vLightFront = vec3( 0.0 );\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vLightBack = vec3( 0.0 );\n" +
		"#endif\n" +
		"transformedNormal = normalize( transformedNormal );\n" +
		"vec3 viewPosition = -mvPosition.xyz;\n" +
		"#if MAX_DIR_LIGHTS > 0\n" +
		"for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {\n" +
		"vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );\n" +
		"vec3 dirVector = normalize( lDirection.xyz );\n" +
		"float dotProduct = dot( transformedNormal, dirVector );\n" +
		"vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vec3 directionalLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );\n" +
		"#ifdef WRAP_AROUND\n" +
		"vec3 directionalLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );\n" +
		"#endif\n" +
		"#endif\n" +
		"#ifdef WRAP_AROUND\n" +
		"vec3 directionalLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );\n" +
		"directionalLightWeighting = mix( directionalLightWeighting, directionalLightWeightingHalf, wrapRGB );\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"directionalLightWeightingBack = mix( directionalLightWeightingBack, directionalLightWeightingHalfBack, wrapRGB );\n" +
		"#endif\n" +
		"#endif\n" +
		"vLightFront += directionalLightColor[ i ] * directionalLightWeighting;\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vLightBack += directionalLightColor[ i ] * directionalLightWeightingBack;\n" +
		"#endif\n" +
		"}\n" +
		"#endif\n" +

		"#ifdef DOUBLE_SIDED\n" +
		"vLightBack += pointLightColor[ i ] * pointLightWeightingBack * lDistance;\n" +
		"#endif\n" +
		"}\n" +
		"#endif\n" +
		"#if MAX_SPOT_LIGHTS > 0\n" +
		"for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {\n" +
		"vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );\n" +
		"vec3 lVector = lPosition.xyz - mvPosition.xyz;\n" +
		"float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - worldPosition.xyz ) );\n" +
		"if ( spotEffect > spotLightAngleCos[ i ] ) {\n" +
		"spotEffect = max( pow( spotEffect, spotLightExponent[ i ] ), 0.0 );\n" +
		"float lDistance = 1.0;\n" +
		"if ( spotLightDistance[ i ] > 0.0 )\n" +
		"lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );\n" +
		"lVector = normalize( lVector );\n" +
		"float dotProduct = dot( transformedNormal, lVector );\n" +
		"vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vec3 spotLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );\n" +
		"#ifdef WRAP_AROUND\n" +
		"vec3 spotLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );\n" +
		"#endif\n" +
		"#endif\n" +
		"#ifdef WRAP_AROUND\n" +
		"vec3 spotLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );\n" +
		"spotLightWeighting = mix( spotLightWeighting, spotLightWeightingHalf, wrapRGB );\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"spotLightWeightingBack = mix( spotLightWeightingBack, spotLightWeightingHalfBack, wrapRGB );\n" +
		"#endif\n" +
		"#endif\n" +
		"vLightFront += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vLightBack += spotLightColor[ i ] * spotLightWeightingBack * lDistance * spotEffect;\n" +
		"#endif\n" +
		"}\n" +
		"}\n" +
		"#endif\n" +
		"#if MAX_HEMI_LIGHTS > 0\n" +
		"for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {\n" +
		"vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );\n" +
		"vec3 lVector = normalize( lDirection.xyz );\n" +
		"float dotProduct = dot( transformedNormal, lVector );\n" +
		"float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;\n" +
		"float hemiDiffuseWeightBack = -0.5 * dotProduct + 0.5;\n" +
		"vLightFront += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vLightBack += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeightBack );\n" +
		"#endif\n" +
		"}\n" +
		"#endif\n" +
		"vLightFront = vLightFront * diffuse + ambient * ambientLightColor + emissive;\n" +
		"#ifdef DOUBLE_SIDED\n" +
		"vLightBack = vLightBack * diffuse + ambient * ambientLightColor + emissive;\n" +
		"#endif\n" +
		"#ifdef USE_SHADOWMAP\n" +
		"for( int i = 0; i < MAX_SHADOWS; i ++ ) {\n" +
		"vShadowCoord[ i ] = shadowMatrix[ i ] * worldPosition;\n" +
		"}\n" +
		"#endif\n" +
		"}\n",
};