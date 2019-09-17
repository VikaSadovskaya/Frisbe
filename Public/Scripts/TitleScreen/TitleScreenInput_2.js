//@input Component.SpriteVisual gameIcon
//@input Component.Camera camera

//@input SceneObject titleScreenSettings

script.api.input = {}
for (var asset in script) {
    script.api.input[asset] = script[asset]
}
script.api.input.script = script