//@input Component.AnimationMixer animFrisbee
//@input Asset.Texture texture
//@input SceneObject first_face
//@input Component.SpriteVisual second_face
//@input SceneObject first_screen
//@input SceneObject general_screen
//@input SceneObject snapButton
//@input SceneObject sphere
// @input SceneObject L1
// @input SceneObject L2
// @input SceneObject L3
// @input SceneObject L4
// @input SceneObject L5
// @input SceneObject L6
// @input SceneObject L7
//@input SceneObject firstScore
//@input SceneObject secondScore1
//@input SceneObject secondScore2
//@input SceneObject winner 

var Idle = script.animFrisbee.getLayer("Idle");
var Idle2 = script.animFrisbee.getLayer("Idle2");
var start = script.animFrisbee.getLayer("start");
var catch1 = script.animFrisbee.getLayer("catch1");
var catchTrue = script.animFrisbee.getLayer("catchTrue");
var catchFalse = script.animFrisbee.getLayer("catchFalse");  
global.touchSystem.touchBlocking = true;
//global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);


global.startGame = function (activeSession) 
{
    var isCatched = false
    global.checkLine = 0
    global.allowTap = false;
    var move = false
    var able_start = true
    
    function resultScreen()
    {
        global.touchSystem.touchBlocking = false
        global.clientInterfaceSystem.perform(ClientInterfaceElement.ToggleCameraButton, ClientInterfaceAction.Trigger)
        
        script.snapButton.enabled = true
        
        global.touchSystem.touchBlocking = true
        script.first_face.enabled = true
        if(global.REPOSITORY.isFirstGame())
        {
            
            script.first_screen.enabled = true   
            script.firstScore.enabled = true
        }
        else
        {
            script.general_screen.enabled = true
            script.second_face.enabled = true   
            script.second_face.mainPass.baseTex = global.REPOSITORY.getPlayerPhotoAsset()
            script.secondScore1.enabled = true
            script.secondScore1.text = ""+global.REPOSITORY.getCurrentPlayerThrowScore()
            script.secondScore2.enabled = true
            script.secondScore2.text = ""+global.REPOSITORY.getPreviousPlayerThrowScore()
        }
        
        function tap_snap()
        {
            var texture_copy = script.texture.copyFrame()
            global.REPOSITORY.savePlayerPhotoAsset(texture_copy)
            global.snapRecordingSystem.captureSnapImage() 
        }
        global.scBehaviorSystem.addCustomTriggerResponse("tap_snap", tap_snap);
        

    }
    
    if(global.REPOSITORY.isStartWithPlate())
    {
        script.animFrisbee.setWeight("Idle", 1.0);
        script.animFrisbee.start("Idle", 0, -1); 

        
    }else
    {
        script.animFrisbee.setWeight("Idle2", 1.0);
        script.animFrisbee.start("Idle2", 0, -1);
        function del(eventData)
        {
            script.L1.enabled = true;
        }
            
        var delayedEvent = script.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(del);
        delayedEvent.reset(0.01);
        
        function delay(eventData)
        {
            script.L2.enabled = true;
        }
            
        var delayedEvent = script.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(delay);
        delayedEvent.reset(1);
            
        function delay1(eventData)
        {
            script.L3.enabled = true;
        }
        var delayedEvent = script.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(delay1);
        delayedEvent.reset(2);
        
        function delay2(eventData)
        {
            script.L4.enabled = true
            script.sphere.enabled = true;
            global.tweenManager.startTween( script.sphere, "appear");
        }
        var delayedEvent = script.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(delay2)
        delayedEvent.reset(3);
            
        function delay3(eventData)
        {
            script.L5.enabled = true;
            script.animFrisbee.stop("Idle2");
            script.animFrisbee.setWeight("catch1", 1.0);
            script.animFrisbee.start("catch1", 0, 1);
            global.allowTap = true;
        }
        var delayedEvent = script.createEvent("DelayedCallbackEvent");
        delayedEvent.bind(delay3);
        delayedEvent.reset(4);
        
    }
        
    
    var event = script.createEvent("TouchMoveEvent");
    event.bind(function(eventData)
    {
        if(global.REPOSITORY.isStartWithPlate() || isCatched)
        {
            move = true
        }
    });

    var event1 = script.createEvent("TouchEndEvent");
    event1.bind(function(eventData)
    {
        if(move && (able_start || isCatched))
        {
            /*            
            var posTouch = eventData.getTouchPosition().x;
            if(posTouch < 0.3)
            {
                startAnim = 1
                
            }else if(posTouch >= 0.3 && posTouch < 0.6)
            {
                startAnim = 2
                
            }else if(posTouch >= 0.6 && posTouch <= 1)
            {
                startAnim = 3
                
            }
         */
            able_start = false;
            isCatched = false
            script.animFrisbee.stop("Idle");
            script.animFrisbee.setWeight("start", 1.0);
            script.animFrisbee.start("start", 0, 1); 
            
            
            //global.REPOSITORY.saveThrowArea(startAnim)
            global.REPOSITORY.increaseThrowScore()
        }
    });
    
    function tap_sphere()
    {
        if(global.allowTap == true)
        {
            global.checkLine = 1
            print("попал")
        }    
    }
    global.scBehaviorSystem.addCustomTriggerResponse("tap_sphere", tap_sphere);
    
  
    function end_start(){
        script.animFrisbee.stop("Idle");
        
        
        if(Math.abs(global.REPOSITORY.getCurrentPlayerThrowScore - global.REPOSITORY.getPreviousPlayerThrowScore) == 3)
        {
            global.REPOSITORY.final()
            resultScreen()
            script.winner.enabled = true
        }else
        {
            resultScreen()
        }
	
    }
    global.scBehaviorSystem.addCustomTriggerResponse("end_start", end_start);
    
    function end_catch1()
    {
        global.tweenManager.startTween( script.sphere, "disappear");

        if(global.checkLine == 1)
        {
            script.animFrisbee.setWeight("catchTrue", 1.0);
            script.animFrisbee.start("catchTrue", 0, 1);             
        }else
        {
            script.animFrisbee.setWeight("catchFalse", 1.0);
            script.animFrisbee.start("catchFalse", 0, 1);         
        }
        script.sphere.enabled = false
    }
    global.scBehaviorSystem.addCustomTriggerResponse("end_catch1", end_catch1);
    
    function catch_True()
    {
        global.REPOSITORY.increaseCatchScore()
        script.animFrisbee.setWeight("Idle", 1.0);
        script.animFrisbee.start("Idle", 0, -1); 
        isCatched = true
    }
    global.scBehaviorSystem.addCustomTriggerResponse("end_catchTrue", catch_True);
    
    function catch_False()
    {
        global.REPOSITORY.increaseFailScore()
        resultScreen()
        
    }
    global.scBehaviorSystem.addCustomTriggerResponse("end_catchFalse", catch_False);
    
}
      
    
    
    
  