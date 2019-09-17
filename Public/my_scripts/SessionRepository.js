var SessionRepository = /** @class */ (function () {
    var CATCH_KEY = "catchScore";
    var THROW_KEY = "throwScore";
    var FAIL_KEY = "failScore";
    var PREVIOUS_FAIL_KEY = "previousFailed";
    var ASSET_KEY = "photoAsset";
    var THROW_SCREAN_AREA = "throwScreenArea";
    var PREVIOUS_PLAYER_KEY = "previousPlayer";
    var FINISH = "finish"

    var _isStartWithPlate
    var store
    var activeSession
    var currentPlayerIndex
    var previousPlayerIndex
    var currentPlayerCatchScore
    var currentPlayerThrowScore
    var _isFirstGame
    
    function SessionRepository() {
        activeSession = global.snappablesSystem.getActiveSession();
        store = activeSession.getGlobalStore();
        
        _isFirstGame = !store.has(PREVIOUS_PLAYER_KEY)
        _isStartWithPlate = _isFirstGame || store.getBool(PREVIOUS_FAIL_KEY); 
        
        currentPlayerIndex =  activeSession.getCurrentPlayerIndex();
        previousPlayerIndex = _isFirstGame? currentPlayerIndex : store.getInt(PREVIOUS_PLAYER_KEY);
        
        store.putInt(PREVIOUS_PLAYER_KEY ,currentPlayerIndex);
        store.putBool(PREVIOUS_FAIL_KEY, false);
        
        currentPlayerCatchScore = getPlayerSaveData(currentPlayerIndex, CATCH_KEY);
        currentPlayerThrowScore =  getPlayerSaveData(currentPlayerIndex, THROW_KEY);
    }
    function getPlayerSaveData(playerId, key){
        var playerStore = activeSession.getPlayerStore(playerId);
        return playerStore.getInt(key)
    }
    function putPlayerSaveData(key, value){
        var playerStore = activeSession.getCurrentPlayerStore();
        playerStore.putInt(key, value);
    }
    
    SessionRepository.prototype.isStartWithPlate = function () {
        return _isStartWithPlate;
    }
	
    SessionRepository.prototype.isFirstGame = function () {
        return _isFirstGame;
    }
	
    SessionRepository.prototype.getCurrentPlayerCatchScore = function () {
        return currentPlayerCatchScore;
    }
    SessionRepository.prototype.getCurrentPlayerThrowScore = function () {
        return currentPlayerThrowScore;
    }

    SessionRepository.prototype.getPreviousPlayerThrowScore = function () {
        if(!_isFirstGame && store){
            return getPlayerSaveData(previousPlayerIndex, THROW_KEY);
        }
        else{
            return 0;
        }
    }    
    
    SessionRepository.prototype.increaseCatchScore = function () {
        currentPlayerCatchScore += 1;
        
        putPlayerSaveData(CATCH_KEY, currentPlayerCatchScore);
        return currentPlayerCatchScore;
    }
    SessionRepository.prototype.increaseThrowScore = function () {
        currentPlayerThrowScore += 1;
        
        putPlayerSaveData(THROW_KEY, currentPlayerThrowScore);
        return currentPlayerThrowScore;
    }
    SessionRepository.prototype.increaseFailScore = function () {
        var failScore = getPlayerSaveData(currentPlayerIndex, FAIL_KEY);
        
        failScore += 1;         
        putPlayerSaveData(FAIL_KEY, failScore);
        store.putBool(PREVIOUS_FAIL_KEY, true);
        return failScore;
    }
    SessionRepository.prototype.final = function(){
        activeSession.shouldAttachToSnap = true   
    }
    
    SessionRepository.prototype.saveThrowArea = function (areaIndex) {
        store.putInt(THROW_SCREAN_AREA ,areaIndex);  
    }
    SessionRepository.prototype.getThrowArea = function () {
        return store.getInt(THROW_SCREAN_AREA);  
    }
    
    
    SessionRepository.prototype.savePlayerPhotoAsset = function (asset) {
        activeSession.saveAsset(asset, ASSET_KEY);
    }
    SessionRepository.prototype.getPlayerPhotoAsset = function () {
        if(activeSession.hasAsset(ASSET_KEY)){
            return activeSession.getAsset(ASSET_KEY);
        }
        else{
            return null;
        }
    }
    SessionRepository.prototype.takeSnap = function() {
        global.snapRecordingSystem.captureSnapImage() 
    }
    return SessionRepository
}())

global.REPOSITORY = new SessionRepository();



    