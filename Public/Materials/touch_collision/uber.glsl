//-----------------------------------------------------------------------
// Copyright (c) 2017 Snap Inc.
//-----------------------------------------------------------------------


//-----------------------------------------------------------------------
// Feature defines
//-----------------------------------------------------------------------
//#define ENABLE_UV2                    // Enables a UV trasform that can take an existing UV set and scale and translate it, for example to tile a detail map over an existing UV set.
//#define ENABLE_UV2_ANIMATION          // This enables UV scrolling. The speed of the scroll will be uv2Offset units per second.
//#define ENABLE_UV3                    // Enables a UV trasform that can take an existing UV set and scale and translate it, for example to tile a detail map over an existing UV set.
//#define ENABLE_UV3_ANIMATION          // This enables UV scrolling. The speed of the scroll will be uv2Offset units per second.
//#define ENABLE_BASE_TEX               // Most materials use a base texture, but disabling it means the base texture will be considered white.
//#define ENABLE_VERTEX_COLOR_BASE      // Multiplies the base color by vertex color rgba.
//#define ENABLE_OPACITY_TEX            // Normally, the baseTex texture's alpha is taken as opacity. Enabling this allows you to define a separate greyscale opacity texture. The opacityTex value will be bultiplied with the baseTex texture's alpha (which is 1 for textures without alpha) to get the final opacity.
//#define ENABLE_NORMALMAP              // Enables the normal map texture and normal mapping.
//#define ENABLE_EMISSIVE               // Enables the emissive texture.
//#define ENABLE_VERTEX_COLOR_EMISSIVE  // Enables emissive color from vertex color rgb, and adds it on top of any other emissive source.
//#define ENABLE_LIGHTING               // Enables direct and indirect (ambient) lighting. Disabling this creates an unlit (flat) shader.
//#define ENABLE_DIFFUSE_LIGHTING       // Enables direct and indirect diffuse lighting. Can be disabled as an optimization on pure metals.
//#define ENABLE_SPECULAR_LIGHTING      // Enables direct and indirect specular lighting (specular highlights and reflections). Disabling this creates a shader that's only lit diffusely.
//#define ENABLE_DIRECT_LIGHTS          // Enables direct analytical lights (directional lights, point lights, etc.). Disabling this means objects will only be lit by the environment map (indirect light), and rendering will be faster.
//#define ENABLE_VERTEX_COLOR_AO        // Multiplies AO by vertex color rgb.
//#define ENABLE_ENVMAP                 // Use an environment map for indirect diffuse and indirect specular lighting. Disabling this will use the ambient light instead as set in Studio.
//#define ENABLE_ENVMAP_OVERRIDE        // Allow per-material override of envmaps. Normally all materials use the envmaps/ambient defined by the ambient lights in the scene.
//#define ENABLE_ENVMAP_FROM_CAMERA     // Use the live camera feed as the source of the environment map. This replaces the usual user specified environment map.
//#define ENABLE_ENVMAP_FROM_CAMERA_ROUGHNESS     // Enable blurring of camera envmap based on roughness.
//#define ENABLE_SPECULAR_AO            // Allow AO to influence indirect specular lighting (reflections).
//#define ENABLE_SIMPLE_REFLECTION      // Replaces the default PBR environment mapping with a simple lookup from a regular texture (no hdr, no roughness, no fresnel, etc.). The reflection lookup technically assumes a spherical environment map, which is a circular shaped texture as obtained by photographing a mirror ball. However, as a hack, it is sometimes used with simple, flat photos, and manually bent mesh normals. This is an example of a mirror ball env map http://www.orbolt.com/media/blog_files/LightProbe.jpg . Note: this spherical mapping is technically different from the "angular" envmap format that looks similar (represented here: http://www.pauldebevec.com/Probes/ ).
//#define ENABLE_RIM_HIGHLIGHT          // "Rim highlight", aka. "fake Fresnel effect".
//#define ENABLE_RIM_COLOR_TEX          // Allows the use of a texture (rimColorTex) to modulate the rim highlight color.
//#define ENABLE_TRANSLUCENCY_THIN      // [not implemented] Translucency through thin objects like leaves, flags, etc. Light penetrates to back side, because even if the substance might be quite opaque, the distance light has to travel is short.
//#define ENABLE_TRANSLUCENCY_BROAD     // [not implemented] Broad translucency as seen in highly translucent materials with thick volume, like grapes or jade. Light penetrates to back side, because even though it has to travel far, the substance is not very opaque.
//#define ENABLE_TRANSLUCENCY_SHORT     // [not implemented] Short range diffusion on the front sides of highly opaque materials, like facial skin or marble. Light does not penetrate to back side, because the opaque substance extinguishes it quickly, and the object is thick.
//#define ENABLE_TONE_MAPPING           // Normally all lit and unlit materials are rendered with HDR tone mapping enabled, so that they fit into the 3D scene correctly. However, for some uses, like UI elements or unlit materials withh multiplicative blending, you might want to turn tone mapping off.
//#define ENABLE_FIZZLE                 // Allows the material to fizzle in or out of existence according to a noise function, driven by the "transition" parameter (0 is fully visible and 1 is fully invisible).
//#define RENDER_CONSTANT_COLOR         // Ignores all other shader operations and just renders a solid color (baseColor). This is the cheapest possible shader, useful for occluders and such.


//-----------------------------------------------------------------------
// Standard defines
//-----------------------------------------------------------------------
#define SC_USE_USER_DEFINED_VS_MAIN


//-----------------------------------------------------------------------
// Standard includes
//-----------------------------------------------------------------------
#include <std.glsl>
#include <std_vs.glsl>
#include <std_fs.glsl>


//-----------------------------------------------------------------------
// Global defines
//-----------------------------------------------------------------------
//#define DEBUG
#define SCENARIUM

#ifdef GL_ES
#define MOBILE
#endif

#if SC_DEVICE_CLASS >= SC_DEVICE_CLASS_C && (!defined(MOBILE) || defined(GL_FRAGMENT_PRECISION_HIGH))
#define DEVICE_IS_FAST
#endif

#ifdef ENABLE_LIGHTING
#define SC_ENABLE_SRGB_EMULATION_IN_SHADER
#endif


//-----------------------------------------------------------------------
// Varyings
//-----------------------------------------------------------------------
varying vec4 varColor;


//-----------------------------------------------------------------------
// User includes
//-----------------------------------------------------------------------
#include "includes/uber_lighting.glsl"
#include "includes/uber_surface_properties.glsl"
#include "includes/uber_debug.glsl"
#include "includes/pbr.glsl"
#include "includes/utils.glsl"
#include "includes/blend_modes.glsl"
#include "includes/fizzle.glsl"


//-----------------------------------------------------------------------
#ifdef VERTEX_SHADER
//-----------------------------------------------------------------------
attribute vec4 color;

void main() {
    sc_Vertex_t v = sc_LoadVertexAttributes();
    varColor = color;
    sc_ProcessVertex(v);
}
#endif // #ifdef VERTEX_SHADER


//-----------------------------------------------------------------------
#ifdef FRAGMENT_SHADER
//-----------------------------------------------------------------------
void main() {
    
#ifdef RENDER_CONSTANT_COLOR
    gl_FragColor = baseColor;
    
#elif defined(sc_ProjectiveShadowsCaster)
    float shadowAlpha = 1.0;
#ifdef sc_ExporterVersion
#if (sc_ExporterVersion >= 68)
    vec4 color = baseColor;
#ifdef ENABLE_BASE_TEX
    vec2 uvs[NUM_UVS];
    calculateUVs(uvs);
    color *= sampleTexture(baseTex, uvs[baseTexUV], baseTexTransform, SC_USE_UV_TRANSFORM_baseTex);
#endif // ENABLE_BASE_TEX
#ifdef ENABLE_VERTEX_COLOR_BASE
    color *= varColor;
#endif // ENABLE_VERTEX_COLOR_BASE
    shadowAlpha = getShadowAlpha(color, alphaTestThreshold);
#endif // sc_ExporterVersion >= 68
#endif // sc_ExporterVersion
    gl_FragColor = getShadowColor(shadowAlpha);
#else // endif sc_ProjectiveShadowsCaster
    
    DebugOptions debug = setupDebugOptions();
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // Set up surface properties
    
    SurfaceProperties surfaceProperties = setupSurfaceProperties(debug);
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // Evaluate lighting
    
#ifdef ENABLE_LIGHTING
    surfaceProperties = calculateDerivedSurfaceProperties(surfaceProperties, debug);
    
    LightingComponents lighting = evaluateLighting(surfaceProperties, debug);
#else // #ifdef ENABLE_LIGHTING
    LightingComponents lighting = defaultLightingComponents();
#endif // #else // #ifdef ENABLE_LIGHTING
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // Output
    
#ifdef sc_BlendMode_ColoredGlass
    // Colored glass implies that the surface does not diffusely reflect light, instead it transmits light.
    // The transmitted light is the background multiplied by the color of the glass, taking opacity as strength.
    lighting.directDiffuse = vec3(0.0);
    lighting.indirectDiffuse = vec3(0.0);
    vec3 framebuffer = srgbToLinear(getFramebufferColor().rgb);
    lighting.transmitted = framebuffer * mix(vec3(1.0), surfaceProperties.albedo, surfaceProperties.opacity);
    surfaceProperties.opacity = 1.0; // Since colored glass does its own multiplicative blending (above), forbid any other blending.
#endif
    
#ifdef sc_BlendMode_PremultipliedAlpha
    const bool enablePremultipliedAlpha = true;
#else
    const bool enablePremultipliedAlpha = false;
#endif
    
    // This is where the lighting and the surface finally come together.
    vec4 result = vec4(combineSurfacePropertiesWithLighting(surfaceProperties, lighting, enablePremultipliedAlpha), surfaceProperties.opacity);
    
    // Tone mapping
#if defined(ENABLE_TONE_MAPPING) && !defined(sc_BlendMode_Multiply)
#ifdef DEBUG
    if (debug.acesToneMapping)
        result.rgb = acesToneMapping(result.rgb);
    else if (debug.linearToneMapping)
#endif // #ifdef DEBUG
        result.rgb = linearToneMapping(result.rgb);
#endif // #if defined(ENABLE_TONE_MAPPING) && !defined(sc_BlendMode_Multiply)
    
    // sRGB output
    result.rgb = linearToSrgb(result.rgb);
    
    // Debug
#ifdef DEBUG
    result = debugOutput(result, surfaceProperties, lighting, debug);
#endif

    // Blending
#ifdef sc_BlendMode_Custom
    result = applyCustomBlend(result);
#elif defined(sc_BlendMode_MultiplyOriginal)
    result.rgb = mix(vec3(1.0), result.rgb, result.a); 
#elif defined(sc_BlendMode_Screen)
    result.rgb = result.rgb * result.a;
#endif
    
#ifdef ENABLE_FIZZLE
    result = fizzle(result);
#endif
    
    gl_FragColor = result;
    
#endif // #ifdef RENDER_CONSTANT_COLOR
}
#endif // #ifdef FRAGMENT_SHADER


