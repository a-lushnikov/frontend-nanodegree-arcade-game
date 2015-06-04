// main game objects
var Game = {
    allEnemies : undefined,
    player : undefined,
    collectible : undefined, // can only have 1 collectible on screen at a time

    waitTillNextCollectible : 6, // s
    timeSinceLastCollectible : 0,

    timeSinceLastEnemy : 0,
    waitTillNextEnemy : 0,

    lives: 3,
    score: 0,
    level: 1,

    resetGame : function (man) {
        if (EngineConfig.isDead) {
            EngineConfig.isDead = false;
            Game.score = 0;
            Game.lives = 3;
            Game.level = 1;
        }

        Game.collectible = null;
        Game.allEnemies = [];
        for (i = 1; i < 10 ; i++) {
            Game.allEnemies.push(new Enemy(i % 5, 100 + 120 * Math.random(), true));
        }

        Game.player = man;
    }
}


// utility class with helpful functions
var Utils = {
    getX : function (col) {
        return col * 101;
    },

    getY : function (row) {
        if(row < 0) {
            return 60-83;
        } else if (row == 0) {
            return 60;
        } else {
            return 60 + 83 * row;
        }
    }
}


//==============================================================================
// Game Classes
//==============================================================================

//------------------------------------------------------------------------------
// Abstract class of GameObject
//------------------------------------------------------------------------------
var GameObject = function (r,c) {
    this.setRow(r);
    this.setCol(c);
}

// sets row and updates y
GameObject.prototype.setRow = function (row) {
    this.row = row;
    this.y = Utils.getY(this.row);
}

// sets col and updates x
GameObject.prototype.setCol = function (col) {
    this.col = col;
    this.x = Utils.getX(col);
}

GameObject.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};


//------------------------------------------------------------------------------
// Collectible item class
//------------------------------------------------------------------------------
// type - type of collectible item
// row, column - where item wil appear
var Collectible = function (type, row, column) {
    this.type = type;
    this.setRow(row);
    this.setCol(column);
    this.dieIn = 0;

    if (this.type == 'heart') {
        this.sprite = 'images/Heart.png';
        this.dieIn = 5000;
    } else if (this.type == 'gem-blue') {
        this.sprite = 'images/Gem Blue.png';
        this.dieIn = 5000;
    }

    var dieIn = this.dieIn;

    var resetCollectible = function () {
        // reset only in case it was not collected by player
        if(Game.collectible != null) {
            Game.waitTillNextCollectible = (dieIn + 1000) / 1000 + Math.random() * 1.0;
            Game.timeSinceLastCollectible = 0;

            Game.collectible = null;
        }
    }

    setTimeout(function() { resetCollectible(); }, this.dieIn);
};

Collectible.prototype = Object.create(GameObject.prototype);
Collectible.prototype.constructor = Collectible;

Collectible.prototype.update = function (dt) {
    this.liveTime = this.liveTime + dt;
}

Collectible.prototype.getCollected = function () {
    Game.waitTillNextCollectible = (this.dieIn + 1000) / 1000 + Math.random() * 1.0;
    Game.timeSinceLastCollectible = 0;
    Game.collectible = null;
}

// need to override because of scaling issues
Collectible.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x + 25, this.y + 65, 50, 85);
}


//------------------------------------------------------------------------------
// Enemy class
//------------------------------------------------------------------------------
// Enemies can not appear at the center of the screen, so we only control their
// starting position with row.
// use placeRandomly flag if enemy is needed to start at random point on the
// screen
var Enemy = function (row, speed, placeRandomly) {
    this.sprite = 'images/enemy-bug.png';

    this.speed = speed;
    this.x = -100;
    if (placeRandomly) {
        this.x = this.x + (EngineConfig.canvasWidth  * 0.9) * Math.random();
    }
    this.row = row;
    this.y = Utils.getY(this.row);
};

Enemy.prototype = Object.create(GameObject.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function (dt) {
    this.x = this.x + this.speed * dt;
};

Enemy.prototype.collide = function (player) {
    if (player instanceof ChuckNorris) {
        // then we have some problems
        // kill self
        for ( i = Game.allEnemies.length - 1; i >= 0; i--) {
            if (Game.allEnemies[i] == this) {
                Game.allEnemies.splice(i, 1);
            }
        }
    } else if (player instanceof Player) {
        // then everything is ok from enemy prospective
        return;
    }
}



//------------------------------------------------------------------------------
// Player class
//------------------------------------------------------------------------------
var Player = function () {
    this.sprite = 'images/char-boy.png';

    // that is second row from the bottom
    this.row = EngineConfig.gameRows - 3;
    this.setRow(this.row);
    this.setCol(5);
};

Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function (dt) {

};

Player.prototype.handleInput = function(move) {
    if (move) {
        // prevent running out of level boundaries
        if (move === 'left' && this.x >= 83) {
            this.setCol(this.col - 1);
        } else if (move === 'up' && this.y >= 51) {
            this.setRow(this.row - 1);
        } else if (move === 'right' && this.x < EngineConfig.canvasWidth - 150) {
            this.setCol(this.col + 1);
        } else if (move === 'down' && this.y < EngineConfig.canvasHeight - 250) {
            this.setRow(this.row + 1);
        }
    }

};

Player.prototype.collide = function(object) {
    if (object instanceof Enemy) {
        // ok, losing 1 life
        Game.lives = Game.lives - 1;

        // in case have 0 lives - stop the game
        if (Game.lives === 0) {
            EngineConfig.isDead = true;
        } else {
            // otherwise - just restart
            Game.resetGame(new Player());
        }
    }
}


Player.prototype.collect = function(object) {
    if (object instanceof Collectible) {
        if (object.type === 'heart') {
            Game.lives = Game.lives + 1;
            if (Game.lives > 10) {
                Game.lives = 10;
            }
        } else if (object.type === 'gem-blue') {
            Game.score = Game.score + 5000;
        }
    }
}



//------------------------------------------------------------------------------
// Did you ever want to play for Chuck Norris? Here's your chance
// Chuck Norris class. Inherits from Player.
//------------------------------------------------------------------------------
var ChuckNorris = function () {
    Player.call(this);

    this.sprite = 'images/char-horn-girl.png';
    this.superPowers = true;
}

ChuckNorris.prototype = Object.create(Player.prototype);
ChuckNorris.prototype.constructor = ChuckNorris;

ChuckNorris.prototype.collide = function(enemy) {
    if (enemy instanceof Enemy) {
        // the more we kill - the better we feel!
        Game.lives = Game.lives + 1;
        if (Game.lives > 10) {
            Game.lives = 10;
        }
    }
}




//------------------------------------------------------------------------------
// Event listners
//------------------------------------------------------------------------------
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        13: 'restart',
        49: '1',
        50: '2'
    };

    if(e.keyCode == 49) {
        Game.resetGame(new Player());
    } else if(e.keyCode == 50) {
        Game.resetGame(new ChuckNorris());
    } else if(e.keyCode == 13) {
        Game.resetGame(new Player());
    }

    Game.player.handleInput(allowedKeys[e.keyCode]);
});