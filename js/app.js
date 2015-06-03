var allEnemies = undefined;
var player = undefined;
var collectible = undefined;

var getX = function (col) {
    return col * 101;
};

var getY = function (row) {
    if(row < 0) {
        return 60-83;
    } else if (row == 0) {
        return 60;
    } else {
        return 60 + 83 * row;
    }
};

var setRow = function (row) {
    this.row = row;
    this.y = getY(this.row);
}

var setCol = function (col) {
    this.col = col;
    this.x = getX(col);
}


var Collectible = function (type, row, column) {
    this.type = type;
    this.setRow(row);
    this.setCol(column);
    this.dieIn = 5;
    this.liveTime = 0;

    if (this.type == 'heart') {
        this.sprite = 'images/Heart.png';
    } else if (this.type == '') {

    }

    setTimeout(function () {
        waitTillNextCollectible = 5 + Math.random() * 4.0;
        timeSinceLastCollectible = 0;
        collectible = null;
        }, 4000);
};

Collectible.prototype.update = function (dt) {
    this.liveTime = this.liveTime + dt;
}

Collectible.prototype.setRow = setRow;
Collectible.prototype.setCol = setCol;

Collectible.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x + 25, this.y - 15, 50, 85);
}





var Enemy = function (row, speed, placeRandomly) {
    this.sprite = 'images/enemy-bug.png';

    this.speed = speed;
    this.x = -100;
    if (placeRandomly) {
        this.x = this.x + (EngineConfig.canvasWidth  * 0.9) * Math.random();
    }
    this.row = row;
    this.y = getY(this.row);
};

Enemy.prototype.update = function (dt) {
    this.x = this.x + this.speed * dt;
};

Enemy.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};




var Player = function () {
    this.sprite = 'images/char-boy.png';

    // rows are 0 - based, counting from ground
    this.row = EngineConfig.gameRows - 3;
    this.setRow(this.row);
    this.setCol(5);
};

Player.prototype.setRow = setRow;

Player.prototype.setCol = setCol;

Player.prototype.update = function (dt) {

};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(move) {
    // handle keyboard presses
    // prevent running out of level boundaries
    if (move == 'left' && this.x >= 83) {
        this.setCol(this.col - 1);
    } else if (move == 'up' && this.y >= 51) {
        this.setRow(this.row - 1);
    } else if (move == 'right' && this.x < EngineConfig.canvasWidth - 150) {
        this.setCol(this.col + 1);
    } else if (move == 'down' && this.y < EngineConfig.canvasHeight - 250) {
        this.setRow(this.row + 1);
    }
};


var ChuckNorris = function () {
    Player.call(this);

    this.sprite = 'images/char-horn-girl.png';
    this.superPowers = true;
}

ChuckNorris.prototype = Object.create(Player.prototype);
ChuckNorris.prototype.constructor = ChuckNorris;


var restartGame = function (man) {
    if(EngineConfig.isDead) {
        EngineConfig.isDead = false;
        EngineConfig.score = 0;
        EngineConfig.lives = 3;
        EngineConfig.level = 1;
    }

    collectible = null;
    allEnemies = [];
    for (i = 1; i < 10 ; i++) {
        allEnemies.push(new Enemy(i % 5, 100 + 120 * Math.random(), true));
    }

    player = man;
};

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
        restartGame(new Player());
    }

    if(e.keyCode == 50) {
        restartGame(new ChuckNorris());
    }

    if(e.keyCode == 13) {
        restartGame(new Player());
    }

    player.handleInput(allowedKeys[e.keyCode]);
});

restartGame(new Player());