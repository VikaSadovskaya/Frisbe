//@input Component.SpriteVisual[] level
//@input Component.SpriteVisual[] levelUnlock
//@input SceneObject[] unlockToDisable
//@input int[] minScoreCount

//@input float moveAnimDuration
//@input float unlockAnimDuration

//@input Component.SpriteVisual selector
//@input Component.Camera camera

script.api.input = {}
for (var asset in script) {
    script.api.input[asset] = script[asset]
}
script.api.input.script = script