//@input string alignMode {"widget":"combobox", "values":[{"label":"OrthoCam - Width", "value":"OrthoCam - Width"}, {"label":"OrthoCam - Height", "value":"OrthoCam - Height"}, {"label":"OrthoCam - Fit", "value":"OrthoCam - Fit"}, {"label":"PerspCam - Width", "value":"PerspCam - Width"}, {"label":"PerspCam - Height", "value":"PerspCam - Height"}, {"label":"PerspCam - Fit", "value":"PerspCam - Fit"}]}
//@input Component.Camera camera

//@input float sizeW = 28.0 {"showIf":"alignMode", "showIfValue":"OrthoCam - Width"}
//@input float aspectOW = 0.5625 {"showIf":"alignMode", "showIfValue":"OrthoCam - Width"}
//@input float sizeH = 28.0 {"showIf":"alignMode", "showIfValue":"OrthoCam - Height"}
//@input float aspectO = 0.5625 {"showIf":"alignMode", "showIfValue":"OrthoCam - Fit"}
//@input float size = 28.0 {"showIf":"alignMode", "showIfValue":"OrthoCam - Fit"}

//@input float fovW = 60.0 {"showIf":"alignMode", "showIfValue":"PerspCam - Width"}
//@input float aspectPW = 0.5625 {"showIf":"alignMode", "showIfValue":"PerspCam - Width"}
//@input float fovH = 60.0 {"showIf":"alignMode", "showIfValue":"PerspCam - Height"}
//@input float fov = 60.0 {"showIf":"alignMode", "showIfValue":"PerspCam - Fit"}
//@input float aspectP = 0.5625 {"showIf":"alignMode", "showIfValue":"PerspCam - Fit"}

//@input int sourceRegionType = 1 {"widget":"combobox", "values":[{"label":"FullFrame", "value":0}, {"label":"Capture", "value":1}, {"label":"Preview", "value":2}, {"label":"SafeRender", "value":3}]}
//@input int onSnapEventRegionType = 2 {"widget":"combobox", "values":[{"label":"FullFrame", "value":0}, {"label":"Capture", "value":1}, {"label":"Preview", "value":2}, {"label":"SafeRender", "value":3}]}

//@input SceneObject moveSceneObject

var DEG_TO_RAD = 0.0174532925;
var EPS = 0.001;

var camera = script.camera;
var canUseScreenTransform = global.getCoreVersion() >= 77 &&
    global.deviceInfoSystem.getTargetOS() !== "macos";

script.createEvent("LateUpdateEvent").bind(onScreenRectChange);
script.createEvent("SnapImageCaptureEvent").bind(onRecording);
script.createEvent("SnapRecordStartEvent").bind(onRecording);

var visibleRegion = vec2.one();
var centerRegion = vec2.zero();

var cameraSizeWidth;
var cameraSizeHeigth;
var cameraPerspWidth;
var cameraPerspHeigth;
var worldPosition;
var moveSceneObjectTransform;

var screenRegion = null;
function initialize() {
    if (canUseScreenTransform) {
        var screenRoot = scene.createSceneObject("Transform");
        screenRegion = screenRoot.createComponent("Component.ScreenRegionComponent");
        screenRegion.region = script.sourceRegionType;
        
        if (script.moveSceneObject) {
            moveSceneObjectTransform = script.moveSceneObject.getTransform();
            worldPosition = moveSceneObjectTransform.getWorldPosition();
        }
    }
    
    if (script.alignMode === "OrthoCam - Width") {
        cameraSizeWidth = cameraSizeHeigth = script.sizeW * script.aspectOW;
        
    } else if (script.alignMode === "OrthoCam - Height") {
        cameraSizeWidth = cameraSizeHeigth = script.sizeH;
        
    } else if (script.alignMode === "OrthoCam - Fit") {
        cameraSizeHeigth = script.size;
        cameraSizeWidth = cameraSizeHeigth * script.aspectO;
    } else if (script.alignMode === "PerspCam - Width") {
        cameraPerspWidth = cameraPerspHeigth = script.aspectPW * Math.tan(script.fovW * DEG_TO_RAD * 0.5);
        
    } else if (script.alignMode === "PerspCam - Height") {
        cameraPerspWidth = cameraPerspHeigth = Math.tan(script.fovH * DEG_TO_RAD * 0.5);
        
    } else if (script.alignMode === "PerspCam - Fit") {
        cameraPerspWidth = script.aspectPW * Math.tan(script.fovW * DEG_TO_RAD * 0.5);
        cameraPerspHeigth = Math.tan(script.fovH * DEG_TO_RAD * 0.5);
    }
}

function onRecording() {
    if(canUseScreenTransform) {
        screenRegion.region = script.onSnapEventRegionType;
    }
    onScreenRectChange();
}

var isInitialize = false;
function onScreenRectChange() {
    if(isInitialize === false) {
        initialize();
        isInitialize = true;
        return;
    }
    
    if (camera.inputTexture) {
        var aspect = camera.inputTexture.getWidth() / camera.inputTexture.getHeight();
        camera.aspect = aspect;
    }
    
    if(canUseScreenTransform) {
        var region = screenRegion.getRect();
        visibleRegion.x = (region.z - region.x) * 0.5;
        visibleRegion.y = (region.w - region.y) * 0.5;
        
        centerRegion.x = (region.z + region.x) * 0.5;
        centerRegion.y = (region.w + region.y) * 0.5;
    }
    else {
        visibleRegion = vec2.one();
        centerRegion = vec2.zero();
    }
    
    onUpdate();
    updatePosition();
}

function updatePosition() {
    if (moveSceneObjectTransform) {
        var screenCameraPosition = camera.project(worldPosition)
        
        screenCameraPosition.x = centerRegion.x
        screenCameraPosition.y = centerRegion.y
        
        worldPosition = camera.unproject(screenCameraPosition)
        moveSceneObjectTransform.setWorldPosition(worldPosition)
    }
}

function onUpdate() {
    if (script.alignMode === "OrthoCam - Width") {
        var value = getOrthoCameraSizeWidth(cameraSizeWidth);
        if(Math.abs(value - camera.size) > EPS) {
            camera.size = value;
        }
        
    } else if (script.alignMode === "OrthoCam - Height") {
        var value = getOrthoCameraSizeHeigth(cameraSizeHeigth);
        if(Math.abs(value - camera.size) > EPS) {
            camera.size = value;
        }
        
    } else if (script.alignMode === "OrthoCam - Fit") {
        var value = Math.max(getOrthoCameraSizeWidth(cameraSizeWidth), getOrthoCameraSizeHeigth(cameraSizeHeigth));
        if(Math.abs(value - camera.size) > EPS) {
            camera.size = value;
        }
        
    } else if (script.alignMode === "PerspCam - Width") {
        var value = getPerspCameraSizeWidth(cameraPerspWidth);
        
        if(Math.abs(value - camera.fov) > EPS) {
            camera.fov = value;
        }
        
    } else if (script.alignMode === "PerspCam - Height") {
        var value = getPerspCameraSizeHeigth(cameraPerspHeigth);
        
        if(Math.abs(value - camera.fov) > EPS) {
            camera.fov = value;
        }
        
    } else if (script.alignMode === "PerspCam - Fit") {
        var value = Math.max(getPerspCameraSizeWidth(cameraPerspWidth), getPerspCameraSizeHeigth(cameraPerspHeigth));
        
        if(Math.abs(value - camera.fov) > EPS) {
            camera.fov = value;
        }
    }
}

function getOrthoCameraSizeWidth(size) {
    return (size / visibleRegion.x) / camera.aspect;
}

function getOrthoCameraSizeHeigth(size) {
    return size / visibleRegion.y;
}

function getPerspCameraSizeWidth(value) {
    var ratio = visibleRegion.x;
    ratio = 1.0 / (ratio * camera.aspect);
    
    var fovMath = 2.0 * Math.atan(value * ratio);
    return ((fovMath + Math.PI) % Math.PI);
}

function getPerspCameraSizeHeigth(value) {
    var ratio = visibleRegion.y;
    
    var fovMath = 2.0 * Math.atan(value / ratio);
    return ((fovMath + Math.PI) % Math.PI);
}

script.updatePriority = 200000;
