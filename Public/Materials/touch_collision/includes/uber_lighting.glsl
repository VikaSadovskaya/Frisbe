//-----------------------------------------------------------------------
// Copyright (c) 2017 Snap Inc.
//-----------------------------------------------------------------------
#ifndef UBER_LIGHTING_GLSL
#define UBER_LIGHTING_GLSL

#ifdef FRAGMENT_SHADER

#include "pbr.glsl"
#include "envmap.glsl"
#include "spherical_harmonics.glsl"
#include "utils.glsl"


#define MAX_MIP_BIAS 13.0

uniform sampler2D diffuseEnvmapTex;
uniform sampler2D specularEnvmapTex;

uniform float envmapExposure;
uniform float envmapRotation;
uniform float reflBlurWidth;
uniform float reflBlurMinRough;
uniform float reflBlurMaxRough;


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Ambient diffuse lighting

vec2 uniDiffuseEnvmapRes = vec2(64.0, 32.0); // Must match the actual size of the texture.

vec3 sampleDiffuseEnvmap(sampler2D sampler, float rotation, vec3 N) {
    vec2 uv = calcPanoramicTexCoordsFromDir(N, rotation);
    uv = calcSeamlessPanoramicUvsForSampling(uv, uniDiffuseEnvmapRes, 0.0);
    vec4 tex = texture2D(sampler, uv, -MAX_MIP_BIAS);  // Must load the top mip, otherwise there will be a seam where the u coordinate wraps around from 1 to 0 in the panoramic mapping, because the derivatives get screwed up.
    return decodeRGBD(tex);
}

vec3 getDiffuseEnvironmentLighting(vec3 N) {
    vec3 result = vec3(0.0);

#ifdef sc_EnvLightMode
    if (sc_EnvLightMode == sc_AmbientLightMode_SphericalHarmonics) {
        result = evaluateSh(sc_Sh[0], sc_Sh[1], sc_Sh[2], sc_Sh[3], sc_Sh[4], sc_Sh[5], sc_Sh[6], sc_Sh[7], sc_Sh[8], -N) * sc_ShIntensity;
    }
    if (sc_EnvLightMode == sc_AmbientLightMode_EnvironmentMap) {
        result = sampleDiffuseEnvmap(sc_EnvmapDiffuse, sc_EnvmapRotation.y, N) * sc_EnvmapExposure;
    }
#endif  // #ifdef sc_EnvLightMode

    return result;
}

#ifndef ENABLE_ENVMAP

#define accumulateAmbientDiffusePerLight(accumulator, N, light, lightMode)\
    accumulator += light.color * light.intensity * light.weight;

#elif defined(sc_EnvLightMode)  // #ifndef ENABLE_ENVMAP

#define accumulateAmbientDiffusePerLight(accumulator, N, light, lightMode)\
    if (lightMode == sc_AmbientLightMode_Constant) {\
        accumulator += light.color * light.intensity * light.weight;\
    }

#else  // #elif defined(sc_EnvLightMode)  // #ifndef ENABLE_ENVMAP

#define accumulateAmbientDiffusePerLight(accumulator, N, light, lightMode) {\
    vec3 result;\
    \
    if (lightMode == sc_AmbientLightMode_Constant) {\
        result = light.color * light.intensity;\
    }\
    if (lightMode == sc_AmbientLightMode_SphericalHarmonics) {\
        result = evaluateSh(\
                       light.sphericalHarmonics[0],\
                       light.sphericalHarmonics[1],\
                       light.sphericalHarmonics[2],\
                       light.sphericalHarmonics[3],\
                       light.sphericalHarmonics[4],\
                       light.sphericalHarmonics[5],\
                       light.sphericalHarmonics[6],\
                       light.sphericalHarmonics[7],\
                       light.sphericalHarmonics[8], -N);\
        result *= light.intensity;\
    }\
    if (lightMode == sc_AmbientLightMode_EnvironmentMap) {\
        result = sampleDiffuseEnvmap(light.diffuseEnvMap, light.rotation.y, N) * light.exposure;\
        result += 0.0001 * light.color;  /*// HACK: for some reason this fixes diffuse and specular envmaps on Windows. WTF???*/\
    }\
    \
    accumulator += result * light.weight;\
}

#endif  // #else  // #elif defined(sc_EnvLightMode)  // #ifndef ENABLE_ENVMAP

vec3 calculateDiffuseIrradiance(vec3 N) {
#if defined(ENABLE_ENVMAP) && defined(ENABLE_ENVMAP_OVERRIDE)

    // Use per material envmap
    return sampleDiffuseEnvmap(diffuseEnvmapTex, envmapRotation, N) * envmapExposure;

#else  // #if defined(ENABLE_ENVMAP) && defined(ENABLE_ENVMAP_OVERRIDE)

    vec3 accumulatedLight = vec3(0.0);

#ifdef ENABLE_ENVMAP
    // Use environment light
    accumulatedLight = getDiffuseEnvironmentLighting(N);
#endif 

    // Use ambient lights 
#ifdef sc_AmbientLightsCount
#if sc_AmbientLightsCount > 0
    accumulateAmbientDiffusePerLight(accumulatedLight, N, sc_AmbientLights[0], sc_AmbientLightMode0);
#endif
#if sc_AmbientLightsCount > 1
    accumulateAmbientDiffusePerLight(accumulatedLight, N, sc_AmbientLights[1], sc_AmbientLightMode1);
#endif
#if sc_AmbientLightsCount > 2
    accumulateAmbientDiffusePerLight(accumulatedLight, N, sc_AmbientLights[2], sc_AmbientLightMode2);
#endif
#endif
    return accumulatedLight;

#endif  // #else  // #if defined(ENABLE_ENVMAP) && defined(ENABLE_ENVMAP_OVERRIDE)
}


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Ambient specular lighting

vec2 uniTopMipRes = vec2(512.0, 256.0);

vec4 emulateTexture2DLod(sampler2D sampler, vec2 uv, float lod) {
#if (__VERSION__ == 120)
    return texture2DLod(sampler, uv, lod);
#elif defined(GL_EXT_shader_texture_lod)
    return texture2DLodEXT(sampler, uv, lod);
#elif defined(GL_OES_standard_derivatives)
    vec2 texels = uv * uniTopMipRes;
    float dudx = dFdx(texels.x);
    float dvdx = dFdx(texels.y);
    float dudy = dFdy(texels.x);
    float dvdy = dFdy(texels.y);
    float rho = max(length(vec2(dudx, dvdx)), length(vec2(dudy, dvdy))); // OpenGL reference calculation
    float mu = max(abs(dudx), abs(dudy));
    float mv = max(abs(dvdx), abs(dvdy));
    float rho2 = max(mu, mv); // The allowed alternative OpoenGL reference calculation that seems to match the main reference best.
    float mip = log2(rho2);
    float bias = lod - mip;
    return texture2D(sampler, uv, bias);
#else
    #error Unsupported call to emulateTexture2DLod
#endif
}

vec4 sampleSpecularEnvTextureLod(sampler2D diffTex, sampler2D specTex, vec2 uv, float lod) {
#if (__VERSION__ == 120) || defined(GL_EXT_shader_texture_lod) || defined(GL_OES_standard_derivatives)
	return emulateTexture2DLod(specTex, uv, lod);
#else
    // If we don't have access to specific LODs, we fall back to blending between the spec and diffuse textures based on roughness.
    vec4 spec = texture2D(specTex, uv, -MAX_MIP_BIAS);
    vec4 diff = texture2D(diffTex, uv, -MAX_MIP_BIAS);
    return mix(spec, diff, lod / 5.0);
#endif
}

vec3 sampleSpecularEnvTextureLod(sampler2D diffTex, sampler2D specTex, vec3 R, float rotation, float lod) {
    vec2 uv = calcPanoramicTexCoordsFromDir(R, rotation);
    
#if defined(DEVICE_IS_FAST)
    // Seamless envmap lookup.
    // Since the seamless uv offset is specific per LOD, we can't use a trilinear filtered lookup directly.
    // We need to sample the two mips separately with the appropriate offset at each level, then blend manually.
    float lodFloor = floor(lod);
    float lodCeil = ceil(lod);
    float lodFrac = lod - lodFloor;
    
    vec2 uvFloor = calcSeamlessPanoramicUvsForSampling(uv, uniTopMipRes, lodFloor);
    vec4 texFloor = sampleSpecularEnvTextureLod(diffTex, specTex, uvFloor, lodFloor);
    
    vec2 uvCeil = calcSeamlessPanoramicUvsForSampling(uv, uniTopMipRes, lodCeil);
    vec4 texCeil = sampleSpecularEnvTextureLod(diffTex, specTex, uvCeil, lodCeil);
    
    vec4 tex = mix(texFloor, texCeil, lodFrac);
#else // ##if defined(DEVICE_IS_FAST)
    vec4 tex = sampleSpecularEnvTextureLod(diffTex, specTex, uv, lod);
#endif // #else // ##if defined(DEVICE_IS_FAST)
    
    return decodeRGBD(tex);
}

#define getAmbientSpecularPerLight(R, lod, light)\
    sampleSpecularEnvTextureLod(light.diffuseEnvMap, light.specularEnvMap, R, light.rotation.y, lod) * light.exposure * light.weight

vec3 sampleAllSpecularEnvTexturesLod(vec3 R, float lod) {
#ifdef ENABLE_ENVMAP

#ifdef ENABLE_ENVMAP_OVERRIDE

    // Use per material envmap
    return sampleSpecularEnvTextureLod(diffuseEnvmapTex, specularEnvmapTex, R, envmapRotation, lod) * envmapExposure;

#elif defined(sc_EnvLightMode)  // #ifdef ENABLE_ENVMAP_OVERRIDE

    // Use environment light
    return sampleSpecularEnvTextureLod(sc_EnvmapDiffuse, sc_EnvmapSpecular, R, sc_EnvmapRotation.y, lod) * sc_EnvmapExposure;

#else  // #elif defined(sc_EnvLightMode)  // #ifdef ENABLE_ENVMAP_OVERRIDE

    // Use ambient lights
    vec3 accumulatedLight = vec3(0.0);    
#ifdef sc_AmbientLightsCount
#if sc_AmbientLightsCount > 0 
#if sc_AmbientLightMode0 == sc_AmbientLightMode_EnvironmentMap  // Note: PowerVR 544 compiler fails if we try to evaluate this with && on the line above
    accumulatedLight += getAmbientSpecularPerLight(R, lod, sc_AmbientLights[0]);
#endif  // #if sc_AmbientLightMode0 == sc_AmbientLightMode_EnvironmentMap
#endif  // #if sc_AmbientLightsCount > 0 
#if sc_AmbientLightsCount > 1
#if sc_AmbientLightMode1 == sc_AmbientLightMode_EnvironmentMap
    accumulatedLight += getAmbientSpecularPerLight(R, lod, sc_AmbientLights[1]);
#endif  // #if sc_AmbientLightMode1 == sc_AmbientLightMode_EnvironmentMap
#endif  // #if sc_AmbientLightsCount > 1
#if sc_AmbientLightsCount > 2
#if sc_AmbientLightMode2 == sc_AmbientLightMode_EnvironmentMap
    accumulatedLight += getAmbientSpecularPerLight(R, lod, sc_AmbientLights[2]);
#endif  // #if sc_AmbientLightMode2 == sc_AmbientLightMode_EnvironmentMap
#endif  // #if sc_AmbientLightsCount > 2
#endif  // #ifdef sc_AmbientLightsCount
    return accumulatedLight;

#endif  // #else  // #elif defined(sc_EnvLightMode)  // #ifdef ENABLE_ENVMAP_OVERRIDE

#else  // #ifdef ENABLE_ENVMAP

    return vec3(0.0);

#endif // #else  // #ifdef ENABLE_ENVMAP
}

vec3 sampleScreenTexture(vec2 uv, float lod)
{
#if defined(ENABLE_ENVMAP_FROM_CAMERA_ROUGHNESS) && defined(DEVICE_IS_FAST)
    const float maxRoughnessMipInv = 1.0/5.0;
    float r = lod * maxRoughnessMipInv;
    float reflectionRoughness = saturate((r - reflBlurMinRough) / (reflBlurMaxRough-reflBlurMinRough));
    vec2 pixelSize = vec2(1.0/720.0, 1.0/1280.0);
    vec3 blurred = vec3(0.0);
    const int NUM_SAMPLES = 5;
    vec2 offset = pixelSize * reflBlurWidth / float(NUM_SAMPLES) * reflectionRoughness;
    vec2 rnd = fract(uv * 1331711.0) - 0.5;
    //    uv += offset * rnd;
    uv -= offset * float(NUM_SAMPLES-1) * 0.5;
    for (int i = 0; i < NUM_SAMPLES; ++i) {
        for (int j = 0; j < NUM_SAMPLES; ++j) {
            blurred += texture2D(sc_ScreenTexture, uv + offset * vec2(i, j)).rgb;
        }
    }
    blurred *= 1.0 / float(NUM_SAMPLES * NUM_SAMPLES);
    return blurred;
#else // #if defined(ENABLE_ENVMAP_FROM_CAMERA_ROUGHNESS) && defined(DEVICE_IS_FAST)
    return texture2D(sc_ScreenTexture, uv).rgb;
#endif //#else // #if defined(ENABLE_ENVMAP_FROM_CAMERA_ROUGHNESS) && defined(DEVICE_IS_FAST)
}

vec3 sampleSpecularEnvmapLod(vec3 R, float lod) {
#ifdef ENABLE_ENVMAP_FROM_CAMERA
    
    R = (sc_ViewMatrix * vec4(R, 0.0)).xyz;
    vec2 uv = calculateEnvmapScreenToCube(R);
    return srgbToLinear(sampleScreenTexture(uv, lod));
    
#else // #ifdef ENABLE_ENVMAP_FROM_CAMERA
    
    return sampleAllSpecularEnvTexturesLod(R, lod);

#endif // #else // #ifdef ENABLE_ENVMAP_FROM_CAMERA
}


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Evaluate lighting
// This function evaluates all lighting for a surface based on its surface properties and all the existing lighting in the environment (multiple lights, ambient, reflections, etc).

LightingComponents evaluateLighting(SurfaceProperties surfaceProperties, DebugOptions debug) {
    LightingComponents lighting = defaultLightingComponents();

    vec3 V = normalize(sc_Camera.position - varPos);
    
#ifdef ENABLE_DIRECT_LIGHTS
#ifdef sc_DirectionalLightsCount
    // Directional lights
    for(int i = 0; i < sc_DirectionalLightsCount; ++i) {
        sc_DirectionalLight_t light = sc_DirectionalLights[i];
        LightProperties lightProperties;
        lightProperties.direction = light.direction;
        lightProperties.color = light.color.rgb;
        lightProperties.attenuation = light.color.a;
        lighting = accumulateLight(lighting, lightProperties, surfaceProperties, V);
        
#ifdef sc_ProjectiveShadowsReceiver
        lighting.directDiffuse *= getShadowSample();
#endif // sc_ProjectiveShadowsReceiver
    }
#endif // #ifdef sc_DirectionalLightsCount
    
#ifdef sc_PointLightsCount
    // Point lights
    for(int i = 0; i < sc_PointLightsCount; ++i) {
        sc_PointLight_t light = sc_PointLights[i];
        LightProperties lightProperties;
        lightProperties.direction = normalize(light.position - varPos);
        lightProperties.color = light.color.rgb;
        lightProperties.attenuation = light.color.a;
        lighting = accumulateLight(lighting, lightProperties, surfaceProperties, V);
        
#ifdef sc_ProjectiveShadowsReceiver
        lighting.directDiffuse *= getShadowSample();
#endif // sc_ProjectiveShadowsReceiver
    }
#endif // #ifdef sc_PointLightsCount
    
#ifndef ENABLE_SPECULAR_LIGHTING
    lighting.directSpecular = vec3(0.0);
#endif

#ifndef ENABLE_DIFFUSE_LIGHTING
    lighting.directDiffuse = vec3(0.0);
#endif
#endif // #ifdef ENABLE_DIRECT_LIGHTS
    
    // Indirect diffuse
#ifdef ENABLE_DIFFUSE_LIGHTING
    lighting.indirectDiffuse = calculateIndirectDiffuse(surfaceProperties);
#else
    lighting.indirectDiffuse = vec3(0.0);
#endif
    
    // Indirect specular
#if defined(ENABLE_ENVMAP) && defined(ENABLE_SPECULAR_LIGHTING) && !defined(ENABLE_SIMPLE_REFLECTION)
    lighting.indirectSpecular = calculateIndirectSpecular(surfaceProperties, V, debug);
#endif
    
    // Translucency
#ifdef ENABLE_TRANSLUCENCY_BROAD
#endif
    
#ifdef DEBUG
    // Debug sliders
    lighting.directDiffuse *= debug.directDiffuse;
    lighting.directSpecular *= debug.directSpecular;
    lighting.indirectDiffuse *= debug.indirectDiffuse;
    lighting.indirectSpecular *= debug.indirectSpecular;
#endif
    
    return lighting;
}
    
#endif // #ifdef FRAGMENT_SHADER

#endif // UBER_LIGHTING_GLSL
