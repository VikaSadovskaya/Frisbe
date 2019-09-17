//@input SceneObject[] objectUI
//@input float[] objectUIScale
//@input float[] objectUIOffset
//@input bool[] objectNeedRescale
//@input float objectAdditionalScreenOffset = 0.3
//@input Component.Camera mainCamera

script.api.input = {}
for (var asset in script) {
    script.api.input[asset] = script[asset]
}
script.api.input.script = script