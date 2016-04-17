var loadState = {
  preload: function() {
    game.add.text(80, 150, 'loading...', {font:'24px Arial', fill: '#FFFFFF'});
    
    //load all assets here
//    game.load.image('player1','/assets/player1.png');
//    game.load.image('player2','/assets/player2.png');
  },
  
  create: function(){
    game.state.start('play');
  }
}