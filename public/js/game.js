var game = new Phaser.Game(600, 600, Phaser.AUTO, 'canvas-container');

game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('play', playState);

game.state.start('boot');