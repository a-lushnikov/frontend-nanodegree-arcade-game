/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

var timeSinceLastEnemy = 0; // used to generate new enemies after some time
var waitTillNextEnemy = 0; // time to wait till next enemy will be generated
var timeSinceLastCollectible = 0;
var waitTillNextCollectible = 1;

var EngineConfig = {
    canvasWidth: 1010,
    canvasHeight: 760,

    scoreCanvasWidth: 1010,
    scoreCanvasHeight: 150,

    gameRows: 8,
    gameCols: 12,
    enemyRows: 5,
    startingRow: 7, // 0 - water

    score: 0,
    lives: 3,
    level: 1,

    isDead: false
};

var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
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

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */
        update(dt);
        render();

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    };

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        lastTime = Date.now();
        player = new Player();
        reset();
        main();
    }

    function checkCollision (player, enemy) {
        var delta = 60;
        if (Math.abs(player.x - enemy.x) < delta && player.row == enemy.row) {
            return true;
        } else {
            return false;
        }
    }

    function getCollisions() {
        var colliding = [];
        for (i = 0, n = allEnemies.length ; i < n ; i++) {
            if (checkCollision(player, allEnemies[i])) {
                colliding.push(i);
            }
        }
        return colliding;
    }

    function createNewEnemy () {
        var row = Math.floor(Math.random() * EngineConfig.enemyRows);
        var newEnemySpeed = 100 + 200 * Math.random() * EngineConfig.level / 8;
        allEnemies.push(new Enemy(row, newEnemySpeed));
    }

    function updateScoreboard () {
        scrCtx.clearRect (0, 0, scoreCanvas.width, scoreCanvas.height );

        scrCtx.font ='30px "Sigmar One"';
        scrCtx.fillText('Score : ' + EngineConfig.score, 10, scoreCanvas.height / 2 - 40);
        scrCtx.fillText('Level : ' + EngineConfig.level, 10, scoreCanvas.height / 2);
        if (player instanceof ChuckNorris) {
            scrCtx.fillText('Chuck Norris mode activated', 10, scoreCanvas.height / 2 + 40);
        }


        for(i = 1; i <= EngineConfig.lives ; i++ ) {
            scrCtx.drawImage(Resources.get('images/Heart.png'), scoreCanvas.width - 60 * i, 0, 50, 85);
        }

    }

    function createCollectible () {
        var r = player.row;
        var c = player.col;

        var crow = r;
        var ccol = c;

        while(crow == r || ccol == c) {
            crow = Math.floor(Math.random() * (EngineConfig.gameRows - 1));
            ccol = Math.floor(Math.random() * (EngineConfig.gameCols - 1));
        }

        collectible = new Collectible('heart', crow, ccol);
        console.log(crow, ccol);
    }

    function update(dt) {
        // general updatea
        updateEnemies(dt);

        if(EngineConfig.isDead) {
            return;
        }

        updatePlayer(dt);
        updateCollectible(dt);


        // collision logic
        var collidingEnemies = getCollisions();
        if(collidingEnemies.length > 0) {
            if (!player.superPowers) {
                EngineConfig.lives = EngineConfig.lives - 1;
                if (EngineConfig.lives == 0) {
                    EngineConfig.isDead = true;
                } else {
                    reset();
                }
            } else {
                collidingEnemies.forEach(function (x) {
                    allEnemies.splice(x,1);
                    EngineConfig.score = EngineConfig.score + 100;
                    EngineConfig.lives = EngineConfig.lives + 1;
                    if(EngineConfig.lives > 10) {
                        EngineConfig.lives = 10;
                    }
                });
            }

        }

        // count elapsed time
        timeSinceLastEnemy = timeSinceLastEnemy + dt;
        timeSinceLastCollectible = timeSinceLastCollectible + dt;

        // generate new enemies
        if(timeSinceLastEnemy >= waitTillNextEnemy) {
            waitTillNextEnemy = Math.random() * 1.0;
            timeSinceLastEnemy = 0;
            createNewEnemy();
        }

        // generate new collectibles
        if(timeSinceLastCollectible >= waitTillNextCollectible) {
            createCollectible();
            timeSinceLastCollectible = 0;
            waitTillNextCollectible = 9000;
        }

        // check if player has reached the water
        if (player.row == -1) {
            EngineConfig.score = EngineConfig.score + 1000;
            EngineConfig.level = EngineConfig.level + 1;
            reset();
        }

        updateScoreboard();
    }

    /* This is called by the update function  and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to  the object. Do your drawing in your
     * render methods.
     */

    function updateEnemies(dt) {
        // update and GC enemies which are out of screen
        for(var i = allEnemies.length - 1; i >= 0 ; i--) {
            allEnemies[i].update(dt);
            if( allEnemies[i].x > canvas.width) {
                allEnemies.splice(i, 1);
            }
        }
    }

    function updatePlayer(dt) {
        player.update(dt);
    }

    function updateCollectible(dt) {
        if (collectible) {
            collectible.update(dt);
        }

    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */

    function renderCollectible () {
        if(collectible) {
            collectible.render();
        }
    }

    function renderDeadMenu () {
        if(EngineConfig.isDead) {
            player.x = -500;
            player.y = -500;


            ctx.globalAlpha = 0.4;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200);

            ctx.globalAlpha = 1;

            var text1 = 'You have died on level :' + EngineConfig.level;
            var text2 = 'Your score is :' + EngineConfig.score;
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

    function render() {
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
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

        // reset canvas so to clear shit left by player when sprite is out of
        // level bounds
        ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

        /* Loop through the number of rows and columns we've defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
            }
        }


        renderEntities();

        renderDeadMenu();

        renderCollectible();
    }

    /* This function is called by the render function and is called on each game
     * tick. It's purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        /* Loop through all of the objects within the allEnemies array and call
         * the render function you have defined.
         */
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });

        player.render();
    }

    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
        var man = new Player();
        if (player instanceof ChuckNorris) {
            man = new ChuckNorris();
        };
        restartGame(man);
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/Heart.png',
        'images/char-horn-girl.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developer's can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
})(this);
