var EngineConfig = {
    canvasWidth: 1010,
    canvasHeight: 760,

    scoreCanvasWidth: 1010,
    scoreCanvasHeight: 150,

    gameRows: 8,
    gameCols: 12,
    enemyRows: 5,
    startingRow: 7, // 0 - water

    isDead: false
};

var Engine = (function(global) {
    var doc = global.document;
    var win = global.window;

    var canvas = doc.createElement('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = EngineConfig.canvasWidth;
    canvas.height = EngineConfig.canvasHeight;

    doc.body.appendChild(canvas);

    var scoreCanvas = doc.createElement('canvas');
    var scrCtx = scoreCanvas.getContext('2d');

    scoreCanvas.width = EngineConfig.scoreCanvasWidth;
    scoreCanvas.height = EngineConfig.scoreCanvasHeight;

    doc.body.appendChild(scoreCanvas);

    var lastTime;

    // main game loop
    function main() {
        win.requestAnimationFrame(main);
        var now = Date.now();
        var dt = (now - lastTime) / 1000.0;

        update(dt);
        render();

        lastTime = now;
    };

    // game logic - called every frame
    function update(dt) {
        updateEnemies(dt);

        // prevent further updates in case player is dead
        if(EngineConfig.isDead) {
            return;
        }

        updatePlayer(dt);
        updateCollectible(dt);

        // collision logic
        Game.allEnemies.forEach(function (enemy) {
            if(checkCollision(Game.player, enemy)) {
                Game.player.collide(enemy);
                enemy.collide(Game.player);
            }
        });

        if (Game.collectible)  {
            if(checkCollision(Game.collectible, Game.player)) {
                Game.player.collect(Game.collectible);
                Game.collectible.getCollected(Game.player);
            }
        }


        // count elapsed time
        Game.timeSinceLastEnemy = Game.timeSinceLastEnemy + dt;
        Game.timeSinceLastCollectible = Game.timeSinceLastCollectible + dt;

        // generate new enemies
        if(Game.timeSinceLastEnemy >= Game.waitTillNextEnemy) {
            Game.waitTillNextEnemy = Math.random() * 1.5;
            Game.timeSinceLastEnemy = 0;
            createNewEnemy();
        }

        // generate new Game.collectibles
        if(Game.timeSinceLastCollectible >= Game.waitTillNextCollectible) {
            createCollectible();
            Game.timeSinceLastCollectible = 0;
        }

        // check if player has reached the water
        if (Game.player.row == -1) {
            Game.score = Game.score + 1000;
            Game.level = Game.level + 1;
            reset();
        }

        updateScoreboard();
    }


    // checks collision between 2 objects
    function checkCollision (object1, object2) {
        var delta = 60;
        if (Math.abs(object1.x - object2.x) < delta && object1.row == object2.row) {
            return true;
        } else {
            return false;
        }
    }


    // initializes the game
    function init() {
        lastTime = Date.now();
        Game.player = new Player();
        reset();
        main();
    }


    // creates enemy on a random lane
    function createNewEnemy () {
        var row = Math.floor(Math.random() * EngineConfig.enemyRows);
        var newEnemySpeed = 100 + 200 * Math.random() * Game.level / 8;
        Game.allEnemies.push(new Enemy(row, newEnemySpeed));
    }


    // updates scoreboard while player is alive
    function updateScoreboard () {
        scrCtx.clearRect (0, 0, scoreCanvas.width, scoreCanvas.height );

        scrCtx.font ='30px "Sigmar One"';
        scrCtx.fillText('Score : ' + Game.score, 10, scoreCanvas.height / 2 - 40);
        scrCtx.fillText('Level : ' + Game.level, 10, scoreCanvas.height / 2);
        if (Game.player instanceof ChuckNorris) {
            scrCtx.fillText('Chuck Norris mode activated', 10, scoreCanvas.height / 2 + 40);
        }


        for(i = 1; i <= Game.lives ; i++ ) {
            scrCtx.drawImage(Resources.get('images/Heart.png'), scoreCanvas.width - 60 * i, 0, 50, 85);
        }

    }

    // creates collectible
    function createCollectible () {
        var r = Game.player.row;
        var c = Game.player.col;

        var crow = r;
        var ccol = c;

        // collectible should not be located on the same cell as player
        while(crow == r && ccol == c) {
            crow = Math.floor(Math.random() * (EngineConfig.gameRows - 3));
            ccol = Math.floor(Math.random() * EngineConfig.gameCols);
        }

        // some collectibles should be created not that often
        if(Math.random() > 0.8) {
            Game.collectible = new Collectible('heart', crow, ccol);
        } else {
            Game.collectible = new Collectible('gem-blue', crow, ccol);
        }
    }


    function updateEnemies(dt) {
        // update and GC enemies which are out of screen
        for(var i = Game.allEnemies.length - 1; i >= 0 ; i--) {
            Game.allEnemies[i].update(dt);
            if( Game.allEnemies[i].x > canvas.width) {
                Game.allEnemies.splice(i, 1);
            }
        }
    }

    function updatePlayer(dt) {
        Game.player.update(dt);
    }

    function updateCollectible(dt) {
        if (Game.collectible) {
            Game.collectible.update(dt);
        }
    }

    function renderCollectible () {
        if(Game.collectible) {
            Game.collectible.render();
        }
    }

    // renders big banner in case player is dead
    function renderDeadMenu () {
        if(EngineConfig.isDead) {
            Game.player.x = -500;
            Game.player.y = -500;


            ctx.globalAlpha = 0.4;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200);

            ctx.globalAlpha = 1;

            var text1 = 'You have died on level :' + Game.level;
            var text2 = 'Your score is :' + Game.score;
            var text3 = 'Wanna play again?';
            var text4 = 'Press "Enter" to continue';

            ctx.textAlign = 'center';
            ctx.fillStyle = 'blue';
            ctx.font = '30px "Sigmar One"';
            ctx.fillText(text1, canvas.width / 2, 200);
            ctx.fillText(text2, canvas.width / 2, 250);
            ctx.fillText(text3, canvas.width / 2, 300);
            ctx.fillText(text4, canvas.width / 2, 350);
        }
    }

    // main render function which is called from the game loop
    function render() {
        var rowImages = [
            'images/water-block.png',   // Top row is water
            'images/stone-block.png',   // Row 1 of 3 of stone
            'images/stone-block.png',   // Row 2 of 3 of stone
            'images/stone-block.png',   // Row 3 of 3 of stone
            'images/stone-block.png',   // Row 3 of 3 of stone
            'images/stone-block.png',   // Row 3 of 3 of stone
            'images/grass-block.png',   // Row 1 of 2 of grass
            'images/grass-block.png'    // Row 2 of 2 of grass
        ];
        var numRows = EngineConfig.gameRows;
        var numCols = EngineConfig.gameCols;
        var row;
        var col;

        ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
            }
        }

        renderEntities();

        renderDeadMenu();
    }


    function renderEntities() {
        Game.allEnemies.forEach(function(enemy) {
            enemy.render();
        });

        Game.player.render();

        renderCollectible();
    }

    // resets the game in case of running till water or restart
    function reset() {
        var man = new Player();
        if (Game.player instanceof ChuckNorris) {
            man = new ChuckNorris();
        };
        Game.resetGame(man);
    }

    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/Heart.png',
        'images/char-horn-girl.png',
        'images/Gem Blue.png'
    ]);
    Resources.onReady(init);

    global.ctx = ctx;
})(this);
