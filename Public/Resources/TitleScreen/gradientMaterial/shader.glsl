#define SC_USE_USER_DEFINED_VS_MAIN
#include <std_vs.glsl>

#define startCoord 0.25
#define maxAlpha 0.9

#ifdef VERTEX_SHADER
void main(void){
	sc_Vertex_t vertex=sc_LoadVertexAttributes();
	sc_ProcessVertex(vertex);
}
#endif

#ifdef FRAGMENT_SHADER
void main(){
	float alpha=smoothstep(startCoord,1.0,1.0 -varTex0.y)*maxAlpha;
	gl_FragColor=vec4(vec3(0.0),alpha);
}
#endif
