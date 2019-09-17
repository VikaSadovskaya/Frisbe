//-----------------------------------------------------------------------
// Copyright (c) 2017 Snap Inc.
//-----------------------------------------------------------------------
#ifndef UBER_SURFACE_PROPERTIES_GLSL
#define UBER_SURFACE_PROPERTIES_GLSL

#ifdef FRAGMENT_SHADER

#include "pbr.glsl"
#include "utils.glsl"


//-----------------------------------------------------------------------
// Local defines
//-----------------------------------------------------------------------
#ifdef DEVICE_IS_FAST
#define DEFAULT_MIP_BIAS 0.0
#else
#define DEFAULT_MIP_BIAS 1.0
#endif

#if defined(ENABLE_UV3)
#define NUM_UVS 4
#elif defined(ENABLE_UV2)
#define NUM_UVS 3
#else
#define NUM_UVS 2
#endif


//-----------------------------------------------------------------------
// Uniforms
//-----------------------------------------------------------------------
uniform sampler2D baseTex;
uniform mat3 baseTexTransform;
#ifndef SC_USE_UV_TRANSFORM_baseTex
#define SC_USE_UV_TRANSFORM_baseTex true
#endif
#ifndef baseTexUV
#define baseTexUV 0  // compatibility for code materials that don't set this define
#endif

uniform sampler2D opacityTex;
uniform mat3 opacityTexTransform;
#ifndef SC_USE_UV_TRANSFORM_opacityTex
#define SC_USE_UV_TRANSFORM_opacityTex true
#endif

uniform sampler2D normalTex;
uniform mat3 normalTexTransform;
#ifndef SC_USE_UV_TRANSFORM_normalTex
#define SC_USE_UV_TRANSFORM_normalTex true
#endif

uniform sampler2D materialParamsTex;
uniform mat3 materialParamsTexTransform;
#ifndef SC_USE_UV_TRANSFORM_materialParamsTex
#define SC_USE_UV_TRANSFORM_materialParamsTex true
#endif

uniform sampler2D emissiveTex;
uniform mat3 emissiveTexTransform;
#ifndef SC_USE_UV_TRANSFORM_emissiveTex
#define SC_USE_UV_TRANSFORM_emissiveTex true
#endif

uniform sampler2D rimColorTex;
uniform mat3 rimColorTexTransform;
#ifndef SC_USE_UV_TRANSFORM_rimColorTex
#define SC_USE_UV_TRANSFORM_rimColorTex true
#endif

uniform sampler2D reflectionTex;
uniform mat3 reflectionTexTransform;
#ifndef SC_USE_UV_TRANSFORM_reflectionTex
#define SC_USE_UV_TRANSFORM_reflectionTex true
#endif

uniform vec2 uv2Scale;
uniform vec2 uv2Offset;
uniform vec2 uv3Scale;
uniform vec2 uv3Offset;

uniform vec4 baseColor;
uniform float alphaTestThreshold;
uniform vec3 emissiveColor;
uniform float emissiveIntensity;
uniform float reflectionIntensity;
uniform vec3 rimColor;
uniform float rimIntensity;
uniform float rimExponent;
uniform float specularAoIntensity;
uniform float specularAoDarkening;

vec4 sampleTexture(sampler2D sampler, vec2 uv, mat3 uvTransform, bool useUvTransform, float mipBias) {
    if (useUvTransform) {
        uv = saturate(uv);  // Make sure flipbook animated textures only show the current frame, not the whole atlas.
        uv = vec2(uvTransform * vec3(uv, 1.0));
    }
    return texture2D(sampler, uv, mipBias);
}

vec4 sampleTexture(sampler2D sampler, vec2 uv, mat3 uvTransform, bool useUvTransform) {
    return sampleTexture(sampler, uv, uvTransform, useUvTransform, DEFAULT_MIP_BIAS);
}

#ifdef ENABLE_STIPPLE_PATTERN_TEST
bool stipplePatternTest(highp float alpha) {
    vec2 localCoord = floor(mod(gl_FragCoord.xy, vec2(4.0)));
    float threshold = (mod(dot(localCoord, vec2(4.0, 1.0)) * 9.0, 16.0) + 1.0) / 17.0;

    return alpha >= threshold;
}
#endif  // ENABLE_STIPPLE_PATTERN_TEST

vec3 fragNormal(vec2 uvs[NUM_UVS]) {
#ifdef ENABLE_NORMALMAP
    vec3 N = varNormal;
    vec3 T = varTangent;
    vec3 B = cross(N, T) * varBitangentSign;
    mat3 TBN = mat3(T, B, N);
    vec3 nm = sampleTexture(normalTex, uvs[normalTexUV], normalTexTransform, SC_USE_UV_TRANSFORM_normalTex).xyz * (255.0/128.0) - 1.0; // Make sure that RGB 128 actually maps to 0, otherwise there's no way to express straight up normals.
#ifdef DEBUG
    nm.xy *= vec2(DebugNormalIntensity);
#endif
    return normalize(TBN * nm);
#else  // #ifdef ENABLE_NORMALMAP
    return normalize(varNormal);
#endif  // #else  // #ifdef ENABLE_NORMALMAP
}

void calculateUVs(out vec2 uvs[NUM_UVS]) {
	uvs[0] = varTex0;
	uvs[1] = varTex1;

#ifdef ENABLE_UV2
	vec2 uv2OffsetLocal = uv2Offset;
#ifdef ENABLE_UV2_ANIMATION
	uv2OffsetLocal *= sc_TimeElapsed;
#endif
	uvs[2] = uvs[uv2] * uv2Scale + uv2OffsetLocal;
#endif

#ifdef ENABLE_UV3
	vec2 uv3OffsetLocal = uv3Offset;
#ifdef ENABLE_UV3_ANIMATION
	uv3OffsetLocal *= sc_TimeElapsed;
#endif
	uvs[3] = uvs[uv3] * uv3Scale + uv3OffsetLocal;
#endif
}

SurfaceProperties setupSurfaceProperties(DebugOptions debug) {
    vec2 uvs[NUM_UVS];
    calculateUVs(uvs);
    
    vec3 V = normalize(sc_Camera.position - varPos);
    
    SurfaceProperties surfaceProperties = defaultSurfaceProperties();
    
    // Albedo
    vec4 albedo = baseColor;
#ifdef ENABLE_BASE_TEX
    albedo *= sampleTexture(baseTex, uvs[baseTexUV], baseTexTransform, SC_USE_UV_TRANSFORM_baseTex);
#endif
#ifdef ENABLE_VERTEX_COLOR_BASE
    albedo *= varColor;
#endif
    surfaceProperties.albedo = srgbToLinear(albedo.rgb);
    
    // Opacity
    surfaceProperties.opacity = albedo.a;
#if defined(ENABLE_OPACITY_TEX) && !defined(sc_BlendMode_Disabled)
    surfaceProperties.opacity *= sampleTexture(opacityTex, uvs[opacityTexUV], opacityTexTransform, SC_USE_UV_TRANSFORM_opacityTex).r;
#endif
#ifdef sc_BlendMode_Disabled
    surfaceProperties.opacity = 1.0;  // Only necessary because on some hardware when alpha==0.0 we get a pure black result.
#endif
    
    // Alpha Test
#ifdef sc_BlendMode_AlphaTest
    if (surfaceProperties.opacity < alphaTestThreshold) {
        discard;
    }
#endif  // #ifdef sc_BlendMode_AlphaTest
#ifdef ENABLE_STIPPLE_PATTERN_TEST
    if (stipplePatternTest(surfaceProperties.opacity) == false) {
        discard;
    }
#endif  // ENABLE_STIPPLE_PATTERN_TEST

    // Normal
    surfaceProperties.normal = fragNormal(uvs);

    // Emissive
#ifdef ENABLE_EMISSIVE
    surfaceProperties.emissive += sampleTexture(emissiveTex, uvs[emissiveTexUV], emissiveTexTransform, SC_USE_UV_TRANSFORM_emissiveTex).rgb;
#endif
#ifdef ENABLE_VERTEX_COLOR_EMISSIVE
    surfaceProperties.emissive += varColor.rgb;
#endif
#if defined(ENABLE_EMISSIVE) || defined(ENABLE_VERTEX_COLOR_EMISSIVE)
    surfaceProperties.emissive *= emissiveColor * emissiveIntensity;
    surfaceProperties.emissive = srgbToLinear(surfaceProperties.emissive);
#endif
    
    // Rim highlight (fake Fresnel)
#ifdef ENABLE_RIM_HIGHLIGHT
    vec3 rimCol = rimColor * rimIntensity;
#ifdef ENABLE_RIM_COLOR_TEX
    rimCol *= sampleTexture(rimColorTex, uvs[rimColorTexUV], rimColorTexTransform, SC_USE_UV_TRANSFORM_rimColorTex).rgb;
#endif  // #ifdef ENABLE_RIM_COLOR_TEX
    surfaceProperties.emissive += pow(1.0 - abs(dot(surfaceProperties.normal, V)), rimExponent) * srgbToLinear(rimCol);
#endif  // #ifdef ENABLE_RIM_HIGHLIGHT

    // Simple reflection
#ifdef ENABLE_SIMPLE_REFLECTION
    vec3 R = reflect(V, surfaceProperties.normal);
    R.z = -R.z;
    vec2 uv = vec2(1.0) - calcSphericalTexCoordsFromDir(R);
    vec3 reflectionColor = sampleTexture(reflectionTex, uv, reflectionTexTransform, SC_USE_UV_TRANSFORM_reflectionTex).rgb;
    surfaceProperties.emissive += srgbToLinear(reflectionColor) * reflectionIntensity;
#endif
    
    // Lighting related surface properties
#ifdef ENABLE_LIGHTING
#ifdef ENABLE_SPECULAR_LIGHTING
    vec3 materialParams = sampleTexture(materialParamsTex, uvs[materialParamsTexUV], materialParamsTexTransform, SC_USE_UV_TRANSFORM_materialParamsTex).rgb;  // R - metalness, G - roughness, B - ambient occlusion
#else
    vec3 materialParams = vec3(0.0, 0.0, 1.0);
#endif
    
    // Metallic
    surfaceProperties.metallic = materialParams.r;
    
    // Roughness
    surfaceProperties.roughness = materialParams.g;
#ifdef DEBUG
    surfaceProperties.roughness += DebugRoughnessOffset;
    surfaceProperties.roughness *= DebugRoughnessScale;
#endif

    // AO
    surfaceProperties.ao = vec3(materialParams.b);
#ifdef ENABLE_VERTEX_COLOR_AO
    surfaceProperties.ao *= varColor.rgb;
#endif
#ifdef ENABLE_SPECULAR_AO
    vec3 dummyAlbedo;
    vec3 dummySpecColor;
    deriveAlbedoAndSpecColorFromSurfaceProperties(surfaceProperties, dummyAlbedo, dummySpecColor, debug);  // Kind of hacky, but necessary to keep separation between material setup and lighting. Gets optimized away in practice, since calculateDerivedSurfaceProperties() does the same calculation below.
    vec3 specularAoColor = mix(dummySpecColor * dummySpecColor * (1.0 - specularAoDarkening), vec3(1.0), surfaceProperties.ao);  // When specularAoDarkening is 0, we just saturate towards the specular color, rather than blending to black, which is a more natural representation of interreflections.
    surfaceProperties.specularAo = mix(vec3(1.0), specularAoColor, specularAoIntensity);
#endif
#endif  // #ifdef ENABLE_LIGHTING

    return surfaceProperties;
}

#endif  // #ifdef FRAGMENT_SHADER

#endif  // UBER_SURFACE_PROPERTIES_GLSL
