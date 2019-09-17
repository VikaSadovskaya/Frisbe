//@input Component.ScriptComponent titleScreenInput
//@input Component.Label label
//@input Component.AnimationMixer animFrisbee
var start = script.animFrisbee.getLayer("start");
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({__proto__: []} instanceof Array && function (d, b) { d.__proto__ = b }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p] }
        return extendStatics(d, b)
    }
    return function (d, b) {
        extendStatics(d, b)
        function __() { this.constructor = d }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __())
    }
})()

function runDependingOs(mobile, macOs) {
    switch (global.deviceInfoSystem.getTargetOS()) {
        case "ios":
        case "android":
            mobile()
            break
        case "macos":
        case "win":
            if (macOs) macOs()
            break
        default:
            throw "throwed from lens: OS not supported"
    }
}

function showPlayButton() {
    global.clientInterfaceSystem.perform(ClientInterfaceElement.PlayButton, ClientInterfaceAction.Show)
}
function triggerPlayButton() {
    global.clientInterfaceSystem.perform(ClientInterfaceElement.PlayButton, ClientInterfaceAction.Trigger)
}
function openFrontCamera() {
    var currentCam = scene.getCameraType()
    if (currentCam != "front") {
        global.clientInterfaceSystem.perform(ClientInterfaceElement.ToggleCameraButton, ClientInterfaceAction.Trigger)
    }
}
function openBackCamera() {
    var currentCam = scene.getCameraType()
    if (currentCam != "back") {
        global.clientInterfaceSystem.perform(ClientInterfaceElement.ToggleCameraButton, ClientInterfaceAction.Trigger)
    }
}

var EventContainer = /** @class */ (function () {
    function EventContainer(bindingObject) {
        this.scriptComponent = bindingObject.createComponent("Component.ScriptComponent")
        this.eventsContainer = {}
    }
    EventContainer.prototype.createEvent = function (eventType, callback, enabled) {
        if (enabled === void 0) { enabled = true }
        if (!this.eventsContainer[eventType]) {
            this.eventsContainer[eventType] = []
        }
        var sceneEvent = this.scriptComponent.createEvent(eventType)
        sceneEvent.bind(callback)
        sceneEvent.enabled = enabled
        this.eventsContainer[eventType].push(sceneEvent)
        return sceneEvent
    }
    
    EventContainer.prototype.delayedCallback = function (callback, resetAfter) {
        var _this = this
        var delayedCallbackEvent = this.scriptComponent.createEvent("DelayedCallbackEvent")
        delayedCallbackEvent.bind(function () {
            callback()
            _this.scriptComponent.removeEvent(delayedCallbackEvent)
        })
        delayedCallbackEvent.reset(resetAfter)
        return delayedCallbackEvent
    }
    return EventContainer
}())

var ScreenController = /** @class */ (function () {
    
    function ScreenController(screenInput) {
        this.input = screenInput
        this._rootObject = screenInput.script.getSceneObject()
        this.eventContainer = new EventContainer(this.rootObject)
    }
    
    ScreenController.prototype.start = function () { }
    
    ScreenController.prototype.resume = function (data) { }
    
    ScreenController.prototype.stop = function () { }
    
    Object.defineProperty(ScreenController.prototype, "name", {
        get: function () {
            return this.constructor.name
        },
        enumerable: true,
        configurable: true
    })
    Object.defineProperty(ScreenController.prototype, "rootObject", {
        get: function () {
            return this._rootObject
        },
        enumerable: true,
        configurable: true
    })
    return ScreenController
}())

var Application = /** @class */ (function () {
    function Application() {
        this.screens = {}
    }
    Application.prototype.addScreen = function (screen) {
        this.screens[screen.name] = screen
        screen.rootObject.enabled = false
    }
    
    Application.prototype.startScreen = function (screenName, data) {
        this.pauseActiveScreen()
        this.activeScreen = this.screens[screenName]
        this.activeScreen.start()
        this.activeScreen.resume(data)
        this.activeScreen.rootObject.enabled = true
    }
    
    Application.prototype.resumeScreen = function (screenName, data) {
        this.pauseActiveScreen()
        this.activeScreen = this.screens[screenName]
        this.activeScreen.rootObject.enabled = true
        this.activeScreen.resume(data)
    }
    
    Application.prototype.pauseActiveScreen = function () {
        if (!this.activeScreen) {
            return
        }
        this.activeScreen.pause()
        this.activeScreen.rootObject.enabled = false
    }
    Application.prototype.stopScreen = function (screenName) {
        var screen = this.screens[screenName]
        if (!screen) {
            return
        }
        screen.stop()
        screen.rootObject.enabled = false
    }
    return Application
}())

/** Persistent flag wrapper */
PersistentFlag = /** @class */ (function () {
    function PersistentFlag(key) {
        this.key = key
        this.initStore()
    }
    Object.defineProperty(PersistentFlag.prototype, "value", {
        get: function () {
            return this.store.getBool(this.key)
        },
        set: function (value) {
            this.store.putBool(this.key, value)
        },
        enumerable: true,
        configurable: true
    })
    PersistentFlag.prototype.initStore = function () {
        this.store = global.persistentStorageSystem.getPersistentStoreIfLoaded()
        try {
            this.store.size()
        }
        catch (e) {
            print("[Script Error] Data component not created")
            throw e
        }
    }
    return PersistentFlag
}())
/**
 * Autoplay helps to handle automatic trigger of the play button on second player (turnIdx > 0).
 *      How to use?
 * 1) Play button should be triggered only if turnIdx > 0 and Autoplay.enabled === true
 * 2) on ClientInterfacePlayButtonTriggerEvent set Autoplay.enabled = false
 * 3) When user does some correct action (e.g. press Snap Button) set Autoplay.enabled = true
 * */
Autoplay = /** @class */ (function () {
    function Autoplay() {
    }
    Object.defineProperty(Autoplay, "enabled", {
        get: function () {
            return !this.store.value
        },
        set: function (value) {
            this.store.value = !value
        },
        enumerable: true,
        configurable: true
    })
    Object.defineProperty(Autoplay, "store", {
        get: function () {
            return this._store || new PersistentFlag(this.AUTOPLAY_STATE_KEY)
        },
        enumerable: true,
        configurable: true
    })
    Autoplay.AUTOPLAY_STATE_KEY = "autoplay_state_key"
    return Autoplay
}())

var TitleScreenSetting = /** @class */ (function () {
    function TitleScreenSetting() {
        this.easing = function (x) {
            return 1.6667 * x * x * x - 4.5 * x * x + 3.833 * x
        }
        this.BASE_CORE_VERSION = 77 //10.36
        this.SKIP_FRAME_COUNT = 3
        this.SNAP_BUTTON_SIZE = new vec2(0.11, 0.11)
        this.SNAP_BUTTON_POSITION = new vec2(0.0, -0.34)
        this.zDistance = -100.0
        this.animationDuration = 0.5
        this.delayBetweenAnimation = 0.03
        this.useScreenTransform = getCoreVersion() >= this.BASE_CORE_VERSION
        this.tagLineIndex = 2
        this.tagLineScale = 4.0
    }
    return TitleScreenSetting
}())
var TitleScreenUI = /** @class */ (function () {
    function TitleScreenUI(setting) {
        var _this = this
        this.input = null
        this.settings = new TitleScreenSetting()
        this.eventContainer = null
        this.frameCount = 0
        this.alpha = 0.0
        this.showTitle = false
        this.animationTrigger = false
        this.animationFinish = false
        this.screenTransform = null
        this.objectUI = []
        this.objectUIPosition = []
        this.alphaAnimation = null
        this.updateEvent = function () {
            if (_this.frameCount >= 0 || _this.showTitle === false) {
                --_this.frameCount
                return
            }
            _this.screenTransform.update()
            _this.updateUIPosition()
            _this.animate()
            TWEEN.update()
            if (_this.animationFinish) {
                for (var i = 0; i < _this.input.objectUI.length; ++i) {
                    _this.objectUI[i].setWorldScale(_this.screenTransform.fullScreenSize.x, _this.screenTransform.snapButtonSize.y * _this.input.objectUIScale[i], 1.0)
                    _this.objectUI[i].setScreenPosition(_this.objectUIPosition[i])
                }
            }
            _this.checkAnimationFinished()
        }
        var settingScript = setting.getFirstComponent("Component.ScriptComponent")
        this.input = settingScript.api.input
        this.eventContainer = new EventContainer(setting)
        this.eventContainer.createEvent("UpdateEvent", this.updateEvent)
        this.frameCount = this.settings.SKIP_FRAME_COUNT
        this.alpha = 0.0
        this.initialize()
        this.updateAlpha()
    }
    TitleScreenUI.prototype.initialize = function () {
        this.screenTransform = new TitleScreenTransform(this.input.mainCamera, this.settings)
        var animationFunction = TWEEN.Easing.Quintic.Out
        for (var i = 0; i < this.input.objectUI.length; ++i) {
            this.objectUI.push(new TitleScreenUIElement(this.screenTransform, this.input.objectNeedRescale[i], this.input.objectUI[i], animationFunction, i === this.settings.tagLineIndex ? this.settings.tagLineScale : 1.0))
            this.objectUIPosition.push(0.0)
            animationFunction = this.settings.easing
        }
        var tagLine = this.input.objectUI[this.settings.tagLineIndex].getFirstComponent("Component.TextVisual")
        tagLine.fontName = "AvenirNext-Medium.ttf"
        tagLine.fillMode = 3
    }
    TitleScreenUI.prototype.updateAlpha = function () {
        for (var i = 0; i < this.input.objectUI.length; ++i) {
            this.objectUI[i].setAlpha(this.alpha)
        }
    }
    TitleScreenUI.prototype.updateUIPosition = function () {
        var startOffset = 0.5 + this.input.objectAdditionalScreenOffset
        for (var i = 0; i < this.input.objectUI.length; ++i) {
            this.objectUI[i].setWorldScale(this.screenTransform.fullScreenSize.x, this.screenTransform.snapButtonSize.y * this.input.objectUIScale[i], 1.0)
            this.objectUI[i].regionScale = this.input.objectUIScale[i]
            startOffset += this.objectUI[i].regionScale
            startOffset += this.input.objectUIOffset[i]
        }
        for (var i = 0; i < this.input.objectUI.length; ++i) {
            startOffset -= this.objectUI[i].regionScale * 0.5
            startOffset -= this.input.objectUIOffset[i]
            this.objectUIPosition[i] = startOffset * this.screenTransform.snapButtonSize.y
            startOffset -= this.objectUI[i].regionScale * 0.5
        }
    }
    TitleScreenUI.prototype.animate = function () {
        var _this = this
        if (this.animationTrigger === false) {
            var delay = 0.0
            var _loop_1 = function (i) {
                this_1.eventContainer.delayedCallback(function () {
                    _this.objectUI[i].resetAnimation(_this.objectUIPosition[i], _this.settings.animationDuration)
                }, delay)
                delay += this_1.settings.delayBetweenAnimation
            }
            var this_1 = this
            for (var i = 0; i < this.input.objectUI.length; ++i) {
                _loop_1(i)
            }
            this.alphaAnimation = new TWEEN.Tween({x: 0.0})
            .to({x: 1.0}, this.settings.animationDuration * 1000.0)
            .easing(TWEEN.Easing.Sinusoidal.In)
            .onUpdate(function (object) {
                _this.alpha = object.x
                _this.updateAlpha()
            })
            .start()
            this.animationTrigger = true
        }
    }
    TitleScreenUI.prototype.checkAnimationFinished = function () {
        var animationFinish = true
        for (var i = 0; i < this.input.objectUI.length; ++i) {
            animationFinish = animationFinish && this.objectUI[i].animationFinish
        }
        this.animationFinish = this.animationFinish || animationFinish
    }
    TitleScreenUI.prototype.reset = function () {
        this.showTitle = true
        this.animationTrigger = false
        this.animationFinish = false
        this.frameCount = this.settings.SKIP_FRAME_COUNT
        this.alpha = 0.0
    }
    return TitleScreenUI
}())

var TitleScreen = /** @class */ (function (_super) {
    __extends(TitleScreen, _super)
    function TitleScreen(screenInput) {
        var _this = _super.call(this, screenInput) || this
        _this.titleScreenSettings = null
        _this.userNameAvailable = false
        _this.sessionReady = false
        _this.readyToGame = false
        
        global.clientInterfaceSystem.perform(ClientInterfaceElement.ToggleCameraButton, ClientInterfaceAction.Show)
        _this.updateEvent = function () {
            if (_this.readyToGame === false) {
                
                if (_this.sessionReady === true) {
                    _this.onGameLoaded()
                    
                }
            }
            
            
        }
        _this.sessionReadyEvent = function () {
            _this.sessionReady = true
        }
        _this.sessionFailed = function () {
        }
        _this.startGame = function () {
            Autoplay.enabled = false
            print("game started")
            app.stopScreen(TitleScreen.name)
            //TODO use real startGame function
            
            global.startGame()
            
            
        }
        _this.onGameLoaded = function () {
            
            _this.eventContainer.createEvent("ClientInterfacePlayButtonTriggerEvent", _this.startGame)
            
            _this.eventContainer.delayedCallback(function () {
                showPlayButton()
                //-----------------
               /* activeSession = global.snappablesSystem.getActiveSession()

                //TODO set real turnIDX (you can use global variable and key here)
                if(!activeSession.getGlobalStore().hasValueForKey(global.constants.storeTurnIndexKey))
                {
                    playerIdx = 0
                //TODO
                }else{
                    playerIdx =  activeSession.getGlobalStore().getInt(global.constants.storeTurnIndexKey)
					playerIdx++;
					activeSession.getGlobalStore().putInt(global.constants.storeTurnIndexKey, playerIdx)
                }
                //-----------------
                if (playerIdx > 0 && Autoplay.enabled) {
                    triggerPlayButton()
					
                }
                
                if (!global.REPOSITORY.isFirstGame && Autoplay.enabled) {
                    triggerPlayButton()
					
                }*/
				
            }, 0.1)
            openBackCamera()
                
            //openFrontCamera()
            _this.readyToGame = true
        }
        _this.titleScreenSettings = new TitleScreenUI(_this.input.titleScreenSettings)
        runDependingOs(function () {
            _this.eventContainer.createEvent("SnappablesSessionReadyEvent", _this.sessionReadyEvent)
            _this.eventContainer.createEvent("SnappablesSessionInitFailedEvent", _this.sessionFailed)
        }, function () {
            _this.eventContainer.createEvent("TouchStartEvent", _this.startGame)
        })
        _this.eventContainer.createEvent("UpdateEvent", _this.updateEvent)
        return _this
    }
    TitleScreen.prototype.resume = function () {
        this.titleScreenSettings.reset()
    }
    TitleScreen.prototype.pause = function () { }
    return TitleScreen
}(ScreenController))
var TitleScreenTransform = /** @class */ (function () {
    function TitleScreenTransform(mainCamera, titleSetting) {
        this.settings = null
        this.mainCamera = null
        this.cameraPosition = vec3.zero()
        this.snapButtonTransform = null
        this.screenTransform = null
        this.cameraTransform = null
        this.snapButtonSize = vec2.one()
        this.snapButtonPosition = vec3.zero()
        this.fullScreenSize = vec2.one()
        this.fullScreenPosition = vec3.zero()
        this.settings = titleSetting
        this.mainCamera = mainCamera
        this.cameraTransform = this.mainCamera.getSceneObject().getTransform()
        this.initialize()
    }
    TitleScreenTransform.prototype.initialize = function () {
        if (this.settings.useScreenTransform === true) {
            var screenButtonRoot = scene.createSceneObject("TransformForButtonCompute")
            screenButtonRoot.setParent(this.mainCamera.getSceneObject())
            var screenButtonRegion = screenButtonRoot.createComponent("Component.ScreenRegionComponent")
            screenButtonRegion.region = ScreenRegionType.RoundButton
            this.snapButtonTransform = screenButtonRoot.createComponent("Component.ScreenTransform")
            var screenRoot = scene.createSceneObject("ScreenTransform")
            screenRoot.setParent(this.mainCamera.getSceneObject())
            var screenRegion = screenRoot.createComponent("Component.ScreenRegionComponent")
            screenRegion.region = ScreenRegionType.Capture
            this.screenTransform = screenRoot.createComponent("Component.ScreenTransform")
        }
    }
    TitleScreenTransform.prototype.update = function () {
        if (this.settings.useScreenTransform === true) { //10.36
            this.snapButtonSize.x = Math.abs(this.snapButtonTransform.rect.z - this.snapButtonTransform.rect.x)
            this.snapButtonSize.y = Math.abs(this.snapButtonTransform.rect.w - this.snapButtonTransform.rect.y)
            this.snapButtonPosition.x = (this.snapButtonTransform.rect.x + this.snapButtonTransform.rect.z) * 0.5
            this.snapButtonPosition.y = (this.snapButtonTransform.rect.w + this.snapButtonTransform.rect.y) * 0.5
            this.fullScreenSize.x = Math.abs(this.screenTransform.rect.z - this.screenTransform.rect.x)
            this.fullScreenSize.y = Math.abs(this.screenTransform.rect.w - this.screenTransform.rect.y)
            this.fullScreenPosition.x = (this.screenTransform.rect.x + this.screenTransform.rect.z) * 0.5
            this.fullScreenPosition.y = (this.screenTransform.rect.w + this.screenTransform.rect.y) * 0.5
        }
        else {
            this.fullScreenPosition.x = 0.0
            this.fullScreenPosition.y = 0.0
            this.fullScreenSize.x = this.mainCamera.size * this.mainCamera.aspect
            this.fullScreenSize.y = this.mainCamera.size
            this.snapButtonPosition.x = this.settings.SNAP_BUTTON_POSITION.x * this.mainCamera.size
            this.snapButtonPosition.y = this.settings.SNAP_BUTTON_POSITION.y * this.mainCamera.size
            this.snapButtonSize = this.settings.SNAP_BUTTON_SIZE.uniformScale(this.mainCamera.size)
        }
        this.fullScreenPosition.z = this.settings.zDistance
        this.snapButtonPosition.z = this.settings.zDistance
        this.cameraPosition = this.cameraTransform.getWorldPosition()
        this.fullScreenPosition = this.cameraPosition.add(this.cameraTransform.right.uniformScale(this.fullScreenPosition.x)).add(this.cameraTransform.up.uniformScale(this.fullScreenPosition.y)).add(this.cameraTransform.forward.uniformScale(this.fullScreenPosition.z))
        this.snapButtonPosition = this.cameraPosition.add(this.cameraTransform.right.uniformScale(this.snapButtonPosition.x)).add(this.cameraTransform.up.uniformScale(this.snapButtonPosition.y)).add(this.cameraTransform.forward.uniformScale(this.snapButtonPosition.z))
    }
    return TitleScreenTransform
}())
var TitleScreenUIElement = /** @class */ (function () {
    function TitleScreenUIElement(screenTransform, canRescale, object, animationFunction, additionalScale) {
        if (additionalScale === void 0) { additionalScale = 1.0 }
        this.screenTransform = null
        this.object = null
        this.objectTransform = null
        this.animationFunction = null
        this.animation = null
        this.worldScale = vec3.one()
        this._regionScale = 1.0
        this.additionalYScale = 1.0
        this.worldPosition = vec3.zero()
        this.animationFinish = false
        this.canRescale = true
        this.screenTransform = screenTransform
        this.object = object
        this.objectTransform = this.object.getTransform()
        this.animationFunction = animationFunction
        this.canRescale = canRescale
        this.additionalYScale = additionalScale
    }
    TitleScreenUIElement.prototype.getPass = function (object) {
        if (object.getComponentCount("Component.TextVisual")) {
            var text = object.getFirstComponent("Component.TextVisual")
            return text.mainMaterial.mainPass
        }
        else if (object.getComponentCount("Component.SpriteVisual")) {
            var sprite = object.getFirstComponent("Component.SpriteVisual")
            return sprite.mainMaterial.mainPass
        }
        return null
    }
    TitleScreenUIElement.prototype.setAlphaIfCan = function (alpha, object) {
        var pass = this.getPass(object)
        if (pass) {
            var baseColor = pass.baseColor
            baseColor.a = alpha
            pass.baseColor = baseColor
        }
        for (var i = 0; i < object.getChildrenCount(); ++i) {
            var child = object.getChild(i)
            this.setAlphaIfCan(alpha, child)
        }
    }
    TitleScreenUIElement.prototype.setAlpha = function (alpha) {
        this.setAlphaIfCan(alpha, this.object)
    }
    TitleScreenUIElement.prototype.setScreenPosition = function (offset) {
        this.worldPosition = this.screenTransform.snapButtonPosition.add(this.screenTransform.cameraTransform.up.uniformScale(offset))
        this.objectTransform.setWorldPosition(this.worldPosition)
    }
    TitleScreenUIElement.prototype.resetAnimation = function (targetPosition, animationDuration) {
        var _this = this
        this.animation = new TWEEN.Tween({x: 0.0})
        .to({x: targetPosition}, animationDuration * 1000.0)
        .easing(this.animationFunction)
        .onUpdate(function (object) {
            _this.setScreenPosition(object.x)
        })
        .onComplete(function () {
            _this.animationFinish = true
        })
        .start()
    }
    TitleScreenUIElement.prototype.setWorldScale = function (scaleX, scaleY, scaleZ) {
        if (this.canRescale) {
            this.worldScale.x = scaleX
            this.worldScale.y = scaleY * this.additionalYScale
            this.worldScale.z = scaleZ
            this.objectTransform.setWorldScale(this.worldScale)
        }
    }
    Object.defineProperty(TitleScreenUIElement.prototype, "regionScale", {
        get: function () {
            return this._regionScale
        },
        set: function (value) {
            this._regionScale = value
            if (this.canRescale === false) {
                this._regionScale /= this.screenTransform.snapButtonSize.y
            }
        },
        enumerable: true,
        configurable: true
    })
    return TitleScreenUIElement
}())

var app = new Application()
function main() {
    var titleScreenInput = script.titleScreenInput.api.input
    app.addScreen(new TitleScreen(titleScreenInput))
    app.startScreen(TitleScreen.name)
}
var eventContainer = new EventContainer(script.getSceneObject())
eventContainer.createEvent("TurnOnEvent", main)
