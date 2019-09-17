// @input Component.Label label


var GlobalRepository = /** @class */ (function () {
    var CATCH_KEY = "catchScore";
    var THROW_KEY = "throwScore";
    var FAIL_KEY = "failScore";
    var PREVIOUS_FAIL_KEY = "previousFailed";
    var ASSET_KEY = "photoAsset";
    var THROW_SCREAN_AREA = "throwScreenArea";
    var PREVIOUS_PLAYER_KEY = "previousPlayer";

    var _isStartWithPlate;
    var _isFirstGame;
    var store;
    var currentPlayerIndex;
    var previousPlayerIndex;
    var currentPlayerCatchScore;
    var currentPlayerThrowScore;
    
    function GlobalRepository() {
        store = global.persistentStorageSystem.store;
        currentPlayerIndex = 0;
        
        
        init();
    }
    function init(){
        
        currentPlayerCatchScore = 0;
        currentPlayerThrowScore = 0;
        
        _isFirstGame =  store? !store.has(PREVIOUS_PLAYER_KEY) : true;
        _isStartWithPlate = store? (_isFirstGame || store.getBool(PREVIOUS_FAIL_KEY)) : true;   
        
        if(store){ 
            store.putBool(PREVIOUS_FAIL_KEY, false);
            
            currentPlayerIndex = getCurrentPlayerIndex();
            previousPlayerIndex = _isFirstGame? currentPlayerIndex : store.getInt(PREVIOUS_PLAYER_KEY);
            
            store.putInt(PREVIOUS_PLAYER_KEY ,currentPlayerIndex);        
            
            currentPlayerCatchScore = getPlayerSaveData(currentPlayerIndex, CATCH_KEY);
            currentPlayerThrowScore =  getPlayerSaveData(currentPlayerIndex, THROW_KEY);
        }
        else{
            print("REPOSITORY UNDEFINED!");
        }
        info();
    }
    function getCurrentPlayerIndex(){
        if(store.has(PREVIOUS_PLAYER_KEY) && store.getInt(PREVIOUS_PLAYER_KEY) == 0){
            return 1;
        }
        else{
            return 0;
        }
    }
    
    function getPlayerSaveData(playerId, key){
        key = key + playerId;
        print("get player key: " + key);
        return store? store.getInt(key) : 0;
    }
    function putPlayerSaveData(key, value){
        key = key + currentPlayerIndex;
        print("put player key: " + key);
        
        if(store){
            store.putInt(key, value);
        }
    }
    
    GlobalRepository.prototype.isStartWithPlate = function () {
        return _isStartWithPlate;
    }
    GlobalRepository.prototype.isFirstGame = function () {
        return _isFirstGame;
    }
    GlobalRepository.prototype.getCurrentPlayerCatchScore = function () {
        return currentPlayerCatchScore;
    }
    GlobalRepository.prototype.getCurrentPlayerThrowScore = function () {
        return currentPlayerThrowScore;
    }

    GlobalRepository.prototype.getPreviousPlayerThrowScore = function () {
        if(!_isFirstGame && store){
            return getPlayerSaveData(previousPlayerIndex, THROW_KEY);
        }
        else{
            return 0;
        }
    }    
    
    GlobalRepository.prototype.increaseCatchScore = function () {
        currentPlayerCatchScore += 1;
        
        putPlayerSaveData(CATCH_KEY, currentPlayerCatchScore);
        info();
        return currentPlayerCatchScore;
    }
    GlobalRepository.prototype.increaseThrowScore = function () {
        currentPlayerThrowScore += 1;
        
        putPlayerSaveData(THROW_KEY, currentPlayerThrowScore);
        info();
        return currentPlayerThrowScore;
    }
    GlobalRepository.prototype.increaseFailScore = function () {
        var failScore = getPlayerSaveData(currentPlayerIndex, FAIL_KEY);
        
        failScore += 1;         
        putPlayerSaveData(FAIL_KEY, failScore);
        if(store){
            store.putBool(PREVIOUS_FAIL_KEY, true);
        }
        return failScore;
    }
    
    GlobalRepository.prototype.saveThrowArea = function (areaIndex) {
        if(store){
            store.putInt(THROW_SCREAN_AREA ,areaIndex);  
        }
    }
    GlobalRepository.prototype.getThrowArea = function () {
        return store? store.getInt(THROW_SCREAN_AREA) : 0;  
    }
    
    GlobalRepository.prototype.savePlayerPhotoAsset = function (asset) {
        
    }
    GlobalRepository.prototype.getPlayerPhotoAsset = function () {
        
    }
    
    function info(){
        if(script.label){
            script.label.text = "CPid: " + currentPlayerIndex + " Ctch:" + currentPlayerCatchScore + " Thrw:" + currentPlayerThrowScore;
        }
    }
    
    return GlobalRepository
}())

global.REPOSITORY = new GlobalRepository();
