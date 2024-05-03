var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var colors = [0xff0000, 0xffa500, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x8a2be2];
var currentColorIndex = 0;
var starsCollected = 0;
var scaleFactor = 1.0;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('sky', 'assets/background.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/coin.png');
    this.load.image('bomb', 'assets/slime_green.png');
    this.load.spritesheet('dude', 'assets/knight(1).png', { frameWidth: 32  , frameHeight: 25 });
}

function create ()
{
    //  A simple background for our game
    this.add.image(400, 300, 'sky');
    
    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //  Now let's create some ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {

        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    bombs = this.physics.add.group();

    //  The score
    scoreText = this.add.text(config.width - 16, 16, 'Coins: 0', { fontSize: '32px', fill: '#FFFFFF' }).setOrigin(1, 0);

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    // Add collision detection between slime and platforms
    bombs.children.iterate(function (child) {
        this.physics.add.collider(child, platforms);
    }, this);
}

function update ()
{
    if (gameOver)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);

    // Add and update the score
    score += 1;
    scoreText.setText('Coins: ' + score);

    // Change the player's tint to the next color in the array
    player.setTint(colors[currentColorIndex]);

    // Increment the color index for the next star collection
    currentColorIndex = (currentColorIndex + 1) % colors.length;

    // Increment stars collected
    starsCollected++;

    // If stars collected is a multiple of 5, increase the player's scale by 10%
    if (starsCollected % 5 === 0) {
        scaleFactor += 0.1;
        player.setScale(scaleFactor);
    }

    // If stars collected is a multiple of 5, spawn a slime
    if (starsCollected % 5 === 0) {
        spawnSlime();
    }

    // Spawn a new star
    spawnNewStar();
}

function spawnNewStar() {
    var x = Phaser.Math.Between(0, 800); // Random x position within the game width
    var y = Phaser.Math.Between(0, 600); // Random y position within the game height
    var newStar = stars.create(x, y, 'star');
    newStar.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Set bounce for the new star
}

function spawnSlime() {
    // Randomly generate the position of the slime
    var x = Phaser.Math.Between(0, 800);
    var y = Phaser.Math.Between(0, 600);

    // Create the slime
    var slime = bombs.create(x, y, 'bomb');

    // Set slime properties
    slime.setBounce(1);
    slime.setCollideWorldBounds(true);
    slime.setVelocity(Phaser.Math.Between(-200, 200), 20);
    slime.allowGravity = false;
}

function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;

    // Display "Game Over" message
    var gameOverText = this.add.text(config.width / 2, config.height / 2, 'Game Over', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);

    // Make the "Game Over" message disappear after a delay
    this.time.delayedCall(2000, function() {
        gameOverText.destroy();
    }, null, this);
}
