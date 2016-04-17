var socket = io();
var player, player2;
var gameID, playerID;

var playState = {
  create: function() {
    socket.emit('join');
  },
  
  update: function() {
  }
}

socket.on('join', function(data) {
  gameID = data.gameID;
  playerID = data.playerID;
  console.log('game ID: ' + gameID);
  console.log('player ID:' + playerID);
  
  if (gameID != playerID) {
    socket.emit('add player', gameID);
  }
});

socket.on('add player', function() {
  console.log('player joined');
});
