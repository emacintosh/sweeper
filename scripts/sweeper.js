
// GLOBAL VARIABLE DECLARATIONS
var NUM_ROWS, NUM_COLS, NUM_MINES, MINE_COUNT;
var GAME_STATUS, GAME_TIMER,TILE_MATRIX;

// ENUMERATION FOR STATES OF A TILE
var STATES = {
  COVERED: 0,
  FLAGGED: 1,
  EMPTY: 2,
  PROXY: 3,
  MINE: 4
};

// ENUMERATION FOR GAME STATUS
var GAME = {
  STOPPED: 0,
  STARTED: 1
};

// ENUMERATION FOR TIMER STATUS
var TIMER = {
  STOPPED: 0,
  STARTED: 1
};

// Matrix object can be used to instantiate a 2-dimentional array
// which is how we'll store the info about the sweeper board
// Borrowed from the internet
var Matrix = function (rows, columns)  {
    this.rows = rows;
    this.columns = columns;
    this.myarray = new Array(this.rows);
    for (var i=0; i < this.rows; i++) {
        this.myarray[i] = new Array(this.columns)
    }
    return this.myarray;
  }

// Tile object will represent one tile on the board
// We will create a matrix of these tiles
function Tile() {
  this.isMine = false;
  this.proxyMines = 0;
  this.state = STATES.COVERED;
  }

// The timer object will be used to keep time during the game
// We use the reset function for a new game and so set ticks to -1
function Timer() {
  this.ticks = -1;
  this.status = TIMER.STOPPED;
  this.start = function() { this.timer = setInterval('OnTick()',1000); this.status = TIMER.STARTED;};
  this.stop = function() {clearInterval(this.timer); this.status = TIMER.STOPPED};
  this.reset = function() {this.stop();this.ticks=-1;OnTick();}
  }

// Each tile is a unique div and its id
// represents where it is in the matrix
// The following function get the div or its associated Tile
function GetDivFromRowCol(r,c) {
  var divId;
  divId = r*NUM_COLS + c;
  return document.getElementById(divId);
}

function GetRowFromDiv(d) {
  return Math.floor(d.getAttribute('id')/NUM_COLS);
}

function GetColFromDiv(d) {
  return d.getAttribute('id') % NUM_COLS;
}

// Increment the mine counter
// The i parameter can be negative to
// allow for decrements too
function IncrementMineCount(i) {
  MINE_COUNT += i;
  document.getElementById('mine-count').value = MINE_COUNT;
}

// Simple function to return
// true if the game is over, otherwise false
function GameIsOver() {
  return (GAME_STATUS == GAME.STOPPED);
}

// After each click or double click, the
// user could have won
// This function checks if they did
// If the only tiles left are covered or flagged
// and that matches the number of mines, the user has won
function CheckForWin() {
  var r,c,count;

  count = 0;
  for(r=0;r<NUM_ROWS;r++) {
    for(c=0;c<NUM_COLS;c++) {
      if(TILE_MATRIX[r][c].state == STATES.FLAGGED || TILE_MATRIX[r][c].state == STATES.COVERED)
        count++;
      }
    }

  if(count == NUM_MINES) {
    GameOver(true);
  }
}

// Increment the game timer and update timer display
function OnTick() {
  document.getElementById('timer').value = ("00" + ++GAME_TIMER.ticks).slice(-3);
}

// If a user right clicks on a tile
// set or remove the flag accordingly
// and update the mine count and its div
// Right-click is only valid on a covered or flagged tile
function OnRightClick(e) {
  var r,c;
  var currentState, theDiv;

  theDiv = e.target
  c = GetColFromDiv(theDiv);
  r = GetRowFromDiv(theDiv);
  currentState = TILE_MATRIX[r][c].state;

  e.preventDefault();

  if(GameIsOver())
    return;

  if(currentState!= STATES.COVERED && currentState != STATES.FLAGGED)
    return;

  if(currentState == STATES.COVERED) {
    e.target.setAttribute('class','tile flagged');
    TILE_MATRIX[r][c].state = STATES.FLAGGED;
    IncrementMineCount(-1);
  }
  else {
    e.target.setAttribute('class','tile new_tile');
    TILE_MATRIX[r][c].state = STATES.COVERED;
    IncrementMineCount(1);
  }
}

// If a user left clicks a tile
// determine the appropriate action
function OnClick(e) {
  var r,c,theDiv;
  var currentState, proxyMines, isMine;

  theDiv = e.target;
  c = GetColFromDiv(theDiv);
  r = GetRowFromDiv(theDiv);
  proxyMines = TILE_MATRIX[r][c].proxyMines;
  isMine = TILE_MATRIX[r][c].isMine;
  currentState = TILE_MATRIX[r][c].state;

  if(GameIsOver())
    return;

  // timer shouldn't start until first click
  if(GAME_TIMER.status == TIMER.STOPPED)
    GAME_TIMER.start();

  // left click only valid on covered tiles
  if(currentState != STATES.COVERED)
    return;

  // they clicked a mine
  if (isMine) {
    MineHit(theDiv);
    return;
  }

  // they clicked an empty tile
  // expand the board appropriately
  // and check to see if that ended up in a win
  if(proxyMines == 0) {
    ExpandFromTile(theDiv);
    CheckForWin();
    return;
  }

  // they clicked a regular old numbered tile
  // set the background appropriated and update
  // state of this tile
  theDiv.setAttribute('class', 'tile mine' + proxyMines);
  TILE_MATRIX[r][c].state = STATES.PROXY;

  // still could have been the last click in a win
  // so go check
  CheckForWin();
}

// The double-click action is valid on
// numbered tiles where all of its mines are flagged
// The action will expand the empty tiles around it
// but if a mine isn't flagged right, game over
function OnDblClick(e) {
  var r,c,rs,cs,theDiv;
  var currentState, proxyMines, isMine;
  var numFlags, isWrongMine, mineDiv;

  theDiv = e.target
  c = GetColFromDiv(theDiv);
  r = GetRowFromDiv(theDiv);

  currentState = TILE_MATRIX[r][c].state;
  proxyMines = TILE_MATRIX[r][c].proxyMines
  isMine = TILE_MATRIX[r][c].isMine

  numFlags = 0;
  isWrongMine = false;

  if(GameIsOver())
    return;

  // only valid on numbered tiles
  if(currentState != STATES.PROXY)
    return;

  // get a count of the flagged tiles
  // surrounding this one but also
  // note any unflagged mines too
  for(rs=r-1;rs < r+2; rs++) {
    for(cs=c-1;cs < c+2; cs++) {
      if(rs >=0 && rs < NUM_ROWS && cs >=0 && cs < NUM_COLS && !(rs==r && cs==c)) {
        if(TILE_MATRIX[rs][cs].state == STATES.FLAGGED) {
          numFlags++;
        }
        else {
          if(TILE_MATRIX[rs][cs].isMine) {
            mineDiv = GetDivFromRowCol(rs,cs);
            isWrongMine = true;
          }
        }
      }
    }
  }

  // if the number of surrounding flags is
  // less than number of surrounding mines,
  // then take no action
  if(numFlags != proxyMines)
    return;

  // if the number of flags are right, but there
  // is an unflagged mine, then they lost
  // Otherwise, they're good..expand the tiles and
  // check for a win
  if(isWrongMine) {
    MineHit(mineDiv);
  }
  else {
    ExpandFromTile(theDiv,false);
    CheckForWin();
  }
}

// The UpdateProxyMines function is used while building
// the board.  When a mine is placed, all valid surrounding
// tiles increment their proxy counts
function UpdateProxyMines(r,c) {
  var rs, cs;

  for(rs=r-1;rs < r+2; rs++) {
    for(cs=c-1;cs < c+2; cs++) {
      if(rs >=0 && rs < NUM_ROWS && cs >=0 && cs < NUM_COLS && !(rs==r && cs==c)) {
          if(!TILE_MATRIX[rs][cs].isMine)
            TILE_MATRIX[rs][cs].proxyMines++;
        }
    }
  }
}

// They hit a mine, specifically the one passed
// Set the hit mine to the hit mine background
// and then show all the mines...game's over
function MineHit(theDiv) {
  var r,c;
  r = GetRowFromDiv(theDiv);
  c = GetColFromDiv(theDiv);

  TILE_MATRIX[r][c].state = STATES.MINE;
  theDiv.setAttribute('class','tile mine_hit');
  ShowAllMines();
  GameOver(false);
}

// The ExpandFromTile() function will recursively
// expand through empty tiles surround the passed tile
// uncovering surrounding tiles appropriately
function ExpandFromTile(theDiv, verifyEmpty=true) {
  var r,c,rs,cs;
  var currentState, proxyMines, isMine;

  r = GetRowFromDiv(theDiv);
  c = GetColFromDiv(theDiv);
  currentState = TILE_MATRIX[r][c].state;
  proxyMines = TILE_MATRIX[r][c].proxyMines;
  isMine = TILE_MATRIX[r][c].isMine;

  // if the passed tile is a mine, stop expanding
  // if verifyEmpty is true and the tiles is uncovered, stop expanding
  if((isMine || currentState != STATES.COVERED) && verifyEmpty) {
    return;
  }

  // set the div background and tile state appropriately
  theDiv.setAttribute('class', 'tile mine' + proxyMines);
  if(proxyMines == 0)
    TILE_MATRIX[r][c].state = STATES.EMPTY;
  else
    TILE_MATRIX[r][c].state = STATES.PROXY;

  // typically if the tile is not empty, we return
  // to stop the expansion in this direction
  //
  // However, on double click, we know the tile
  // won't be empty so, allow it to expand initially
  // from the numbered tile
  if(proxyMines>0 && verifyEmpty)
        return;

  // (recursion(recursion(recursion(...))))
  for(rs=r-1;rs < r+2; rs++) {
    for(cs=c-1;cs < c+2; cs++) {
      if(rs >=0 && rs < NUM_ROWS && cs >=0 && cs < NUM_COLS && !(rs==r && cs==c)) {
        ExpandFromTile(GetDivFromRowCol(rs,cs));
      }
    }
  }
}

// troubleshooting stuff
function OutputTileArray() {
  var r,c;

  for(r=0;r<NUM_ROWS;r++) {
    for(c=0;c<NUM_COLS;c++) {
      console.log("[" + r + "," + c + "]: " + TILE_MATRIX[r][c].isMine + "," + TILE_MATRIX[r][c].proxyMines);
    }
  }
}

// Called when the game is lost
// loop through all tiles
// if it's an uncovered mine or incorrect flag
// set the div appropriately
function ShowAllMines() {
  var r,c;

  for(r=0;r<NUM_ROWS;r++) {
    for(c=0;c<NUM_COLS;c++) {
      if(TILE_MATRIX[r][c].isMine && TILE_MATRIX[r][c].state == STATES.COVERED) {
        TILE_MATRIX[r][c].state = STATES.MINE;
        GetDivFromRowCol(r,c).setAttribute('class','tile mine');
      }
      if(TILE_MATRIX[r][c].state == STATES.FLAGGED && !TILE_MATRIX[r][c].isMine) {
        GetDivFromRowCol(r,c).setAttribute('class','tile wrong_mine');
      }
    }
  }
}

// do some stuff when the game ends
function GameOver(isGameWon) {
  GAME_STATUS = GAME.STOPPED;
  GAME_TIMER.stop();

  if(isGameWon) {
    document.getElementById("smiley").setAttribute('class','smiley-win');
    alert("YOU WON!  WAY TO GO!!");
  }
  else {
    document.getElementById("smiley").setAttribute('class','smiley-lose');
  }
}

// Called when a new game starts
function LoadBoard() {
  var r, c;
  var tmp,mines,rnd_row,rnd_col;

  // Create all of the tiles consisting
  // of a div with some attributes as well
  // as a Tile object in the matrix
  for(r=0;r<NUM_ROWS;r++) {
    for(c=0;c<NUM_COLS;c++) {
      tmp = document.createElement('div');
      tmp.setAttribute('class','tile new_tile');
      tmp.setAttribute('oncontextmenu','OnRightClick(event)');
      tmp.setAttribute('onclick','OnClick(event)')
      tmp.setAttribute('ondblclick','OnDblClick(event)')
      tmp.setAttribute('id',r*NUM_COLS + c);
      document.getElementById("minefield").appendChild(tmp);
      TILE_MATRIX[r][c] = new Tile();
    }
    tmp = document.createElement('div');
    tmp.setAttribute('class','clear');
    document.getElementById("minefield").appendChild(tmp);
  }

  // Now place all of the mines
  mines=0;
  do {
    rnd_row = Math.floor(Math.random() * NUM_ROWS);
    rnd_col = Math.floor(Math.random() * NUM_COLS);
    if(TILE_MATRIX[rnd_row][rnd_col].isMine == false) {
        TILE_MATRIX[rnd_row][rnd_col].isMine = true;
        mines++;
        UpdateProxyMines(rnd_row, rnd_col);
    }
  } while (mines < NUM_MINES);
}

// Called on load or when smiley is clicked
// Sets up a game then loads the board
function NewGame() {
  NUM_ROWS=15, NUM_COLS =30, NUM_MINES=100, MINE_COUNT=0;
  GAME_STATUS = GAME.STARTED;
  GAME_TIMER = new Timer();
  GAME_TIMER.reset();
  TILE_MATRIX = new Matrix(NUM_ROWS, NUM_COLS);

  IncrementMineCount(NUM_MINES);
  document.getElementById("minefield").innerHTML = '';
  document.getElementById("smiley").setAttribute('class','smiley-start');

  LoadBoard();
}
