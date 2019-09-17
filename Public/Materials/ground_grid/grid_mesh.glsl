#include <std.glsl>
#include <std_vs.glsl>
#include <std_fs.glsl>

uniform vec4        mainColor;

uniform float       uvScale;

uniform sampler2D mainTexture;
uniform sampler2D maskTexture;

// varying vec2 varTex2;

#ifdef VERTEX_SHADER

// struct sc_Vertex_t {
//     vec4 position;
//     vec3 normal;
//     vec3 tangent;
//     vec2 texture0;
//     vec2 texture1;
// };

void sc_VSMain(inout sc_Vertex_t v) {
    // float uvScale = 0.70*0.70;
    // float uvScale2 = 1.75*0.70;

    // // vec2 uv = vertex.texture0;
    v.texture1 = v.texture0;
    // vec2 uv = vertex.texture0*vec2(uvScale, uvScale);
    // // uv.x = uv.x * tilingX;//, 1.0);
    // // uv.y = uv.y * tilingY;//, 1.0);
    // // uv = mod(uv, vec2(1.0,1.0));
    // vertex.texture0 = uv;

    
    // vec4 center = sc_ModelMatrix * vec4(0,0,0,1);
    // vec4 radiusVec = sc_ModelMatrix * vec4(1.5,1.5,1.5,1) - center;
    // float r = sqrt(dot(radiusVec.xz, radiusVec.xz)) * (12.0-uvScale2);//12;// * sqrt(2 * (1.5*1.5));//*2;

    // vec2 offset = vec2(-1.0/r, 1.0/r)*center.xz;
    // // offset.x = mod(offset.x, 1.0);
    // // offset.y = mod(offset.y, 1.0);

    // varTex2 = (vertex.texture0 - offset) * vec2(uvScale);

    float scale = uvScale / 100.0;
    vec3 worldPos = (sc_ModelMatrix * v.position).xyz;
    v.texture0 = vec2(-1.0*scale, 1.0*scale)*worldPos.xz;

    // varTex2 = v.texture0;
}

#endif



#ifdef FRAGMENT_SHADER


void main(void) {
    vec4 albedo = texture2D(mainTexture, varTex0) * mainColor;
    float mask = texture2D(maskTexture, varTex1).r;//.r;
    mask = mask*mask;
    mask = mask*mask;
    mask = mask*mask;
    gl_FragColor = vec4(albedo.rgb*vec3(mask), albedo.a*mask);
    // gl_FragColor = albedo * resultAlpha;//vec4(albedo.rgb,resultAlpha);////.rrrr;
}

#endif //FRAGMENT SHADER
