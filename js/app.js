/**      _  _____   __  __ _                                                   
 *      | |/ ____| |  \/  (_)                                                  
 *      | | (___   | \  / |_ _ __   ___  _____      _____  ___ _ __   ___ _ __ 
 *  _   | |\___ \  | |\/| | | '_ \ / _ \/ __\ \ /\ / / _ \/ _ \ '_ \ / _ \ '__|
 * | |__| |____) | | |  | | | | | |  __/\__ \\ V  V /  __/  __/ |_) |  __/ |   
 *  \____/|_____/  |_|  |_|_|_| |_|\___||___/ \_/\_/ \___|\___| .__/ \___|_|   
 *                                                            | |              
 *                                                            |_|              
 * Írta: Nahimi Selim Krisztián
 */

var width = 9;		// szélesség (x)
var height = 9;		// magasság (y)
var bombs = 0;		// bombák száma

var playField = [];		// Játék cellák
var revealed = [];		// A cella fel van fedve? (logikai)

// [x,y]-hoz képest merre vannak a szomszédos cellák
var additions = [
	[1, 0], [0, 1], [-1,0], [0,-1],
	[1, 1], [1,-1], [-1,1], [-1,-1]
];

var timer = 0;			// Időzítő értéke
var flags = bombs;		// Elérhető zászlók

var timerInterval; // Időzítő

// Tartsuk meg a táblázat képarányát
$(window).resize(function(){
	var divWidth = $('#gamewrapper').width(); 
    $('#gamewrapper').height(divWidth);
}).resize();

/**
 * A dokumentum betöltése után lefutó eljárás
 */
$(document).ready(function(){

	// Eltávolítjuk a "JS bekapcsolása szükséges" szöveget
	$("#enablejs").remove();

	$("#newgamewindow").show(500);

	// Táblázat képarányának megtartása
	// A magasság = szélesség
	$("#gamewrapper").height(
		Math.floor($("#gamewrapper").width())
	);

	// Új játék ablak gombok
	$("#easy").click(function() {
		NewGame(9, 9, 10);
	});

	$("#hard").click(function() {
		NewGame(16, 16, 40);
	});
});

/**
 * Új játék kezdése
 * @param {number} cwidth A játék szélessége (x)
 * @param {number} cheight A játék magassága (y)
 * @param {number} cbombs Hány bomba
 */
function NewGame(cwidth, cheight, cbombs) {
	width = cwidth;
	height = cheight;
	bombs = cbombs;

	timer = 0;
	flags = bombs;

	playField = [];
	revealed = [];

	// Időzítő beállítása
	timerInterval = setInterval(function() {
		timer++;
		$("#timer span").text(timer);
	}, 1000);

	// Az új játék ablak elrejtése
	$("#newgamewindow").hide(500);

	// Összes meglévő cella eltávolítása
	$("#playfield").empty();

	// Feltöltjük a táblázatot cellákkal
	for (var i = 0; i < height; i++) {
		var tdCurrent = $("#playfield").append('<tr class="row" id="row-'+i+'"></tr>');
		
		for (var j = 0; j < width; j++) {
			var cellCurrent = GetCellNum(j, i, width);

			// Minden cella kap egy azonosítószámot
			$("#row-"+i).append('<td class="cell" id="cell-'+cellCurrent+'"> </td>');
		}
	}

	// Feltöltjük a cellákat nullákkal
	for (var y = 0; y < height; y++) {
		var playFieldRow = [];	// cellák
		var revealedRow = [];	// A cellák fel vannak fedve?

		// Feltöltés
		for (var x = 0; x < width; x++) {
			playFieldRow.push(0);
			revealedRow.push(false);
		}
		playField.push(playFieldRow);
		revealed.push(revealedRow);
	}

	// Random helyeken (ahol még nincs bomba)
	// tegyünk le bombákat
	for (var i = 0; i < bombs; i++) {
		var randX, randY;

		// Addig megyünk, amíg van bomba a kisorsolt cellán.
		do {
			randX = Math.floor( Math.random() * width );
			randY = Math.floor( Math.random() * height );
		} while(playField[randY][randX] == "B");

		// B-re állítjuk a cella értékét, amely bombát jelent
		playField[randY][randX] = "B";
	}

	// Környező mezőkből a bombák összeszámolása
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			if(playField[y][x] != "B")
				playField[y][x] = CountBombs(x, y);
		}
	}

	// Jelenlegi cella objektuma, későbbre
	var $currentCell;

	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {

			// Jelenlegi cella
			$currentCell = $("#cell-"+GetCellNum(x, y, width));

			// Bal klikk figyelése
			$currentCell.click(function() {
				var cellID = $(this).attr('id').substring(5);
				var xy = GetCellDimensions(cellID, width);
				RevealNearby(xy[0], xy[1], true);
			});

			// Jobb klikk figyelése
			$currentCell.contextmenu(function() {
				// Cella azonosítójának lekérése
				var cellID = $(this).attr('id').substring(5);
				
				// x,y koordináták lekérése a cella azonosítójából
				var xy = GetCellDimensions(cellID, width);

				// Tegyünk le/Vegyünk fel egy zászlót a celláról
				FlagCell(xy[0], xy[1], $(this));

				return false;
			});
		}
	}

	// Számolók beállítása
	$("#counter span").text(flags);
	$("#timer span").text(timer);
}

/**
 * Cellára zászló letétele vagy felvétele, ha lehetséges
 * @param {number} x A cella X koordinátája
 * @param {number} y A cella Y koordinátája
 * @param {number} elem A cella jQuery objektuma
 * @param {bool} removeFlagOnly Csak eltávolítás, ne rakjon le zászlót ha nincs
 */
function FlagCell(x, y, elem, removeFlagOnly=false) {
	if (!revealed[y][x]) {
		if (elem.hasClass("flag")) {
			elem.html('');
			elem.removeClass("flag");
			flags++;
		} else if (flags > 0) {
			if (!removeFlagOnly) {
				elem.html('<i class="far fa-flag"></i>');
				elem.addClass('flag');
				flags--;
			}
		}
	}

	$("#counter span").text(flags);
}

/**
 * Egy cella azonosítóját adja vissza x,y koordináták alapján
 * @param {number} x A cella X koordinátája
 * @param {number} y A cella Y koordinátája
 * @param {number} width Egy sorban hány cella van
 * @return {number} A cella azonosítója
 */
function GetCellNum(x, y, width) {
	return (y * width) + x;
}

/**
 * Egy cella koordinátáinak visszafejtése az azonosítóból (a GetCellNum ellentettje)
 * @param {number} cellNum A cella azonosítója
 * @param {number} width Egy sorban hány cella van
 * @return {array} A cella x és y koordinátája, [x,y] tömb formátumban
 */
function GetCellDimensions(cellNum, width) {
	return [cellNum % width, Math.floor(cellNum / width)];
}

/**
 * Bombák megszámolása a környező cellákból
 * @param {number} x A cella X koordinátája
 * @param {number} y A cella Y koordinátája
 * @return {number} Hány bomba van a cella körül
 */
function CountBombs(x, y) {
	var cell = playField[y][x];
	var height = playField.length;
	var width = playField[y].length;

	var amount = 0;

	// Környező cellák ellenőrzése
	var newX, newY;
	additions.forEach(add => {

		// Új koordináták
		newX = x + add[0];
		newY = y + add[1];

		// Ha egy létező cellába esik,
		// nézzük meg, hogy egy bomba-e
		if (IsInPlayField(newX, newY)) {
			if (playField[newY][newX] == "B") amount++;
		}
	});

	return amount;
}

/**
 * Rekurzívan feltárja a szomszédos cellákat
 * @param {number} x A cella X koordinátája
 * @param {number} y A cella Y koordinátája
 */
function RevealNearby(x, y) {
	// Jelenlegi cella
	$currentCell = $("#cell-"+GetCellNum(x, y, width));

	// Ha már fel van tárva vagy bomba, ne csináljunk semmit
	if (RevealCell(x, y) == false) return;

	// Ha ez a cella körül nincs bomba
	if (playField[y][x] == 0) {

		// Tárjuk fel a környező celákat rekurzívan
		var newX, newY;
		additions.forEach(add => {
			newX = x + add[0];
			newY = y + add[1];

			if (IsInPlayField(newX, newY))
				RevealNearby(newX, newY);
		});

	}

	// Megnézzük, hogy az összes bomba
	// mentes cella fel van e fedve
	var found = false

	for (var y2 = 0; y2 < height; y2++) {
		for (var x2 = 0; x2 < width; x2++) {
			if (playField[y2][x2] != "B") {
				if (!revealed[y2][x2]) {
					found = true;
					return;
				}
			}
		}
	}

	if (!found) {
		flags = 0;
		$("#counter span").text(flags);

		for (var y2 = 0; y2 < height; y2++) {
			for (var x2 = 0; x2 < width; x2++) {
				if (playField[y2][x2] == "B") {
					$currentCell2 = $("#cell-"+GetCellNum(x2, y2, width));

					$currentCell2.addClass("flag");
				}
			}
		}

		EndGame("Gratulálunk, nyertél!", "#0A0");
	}
}

/**
 * Egy cella feltárása
 * @param {number} x A cella X koordinátája
 * @param {number} y A cella Y koordinátája
 * @param {bool} removeFlag A zászló class eltávolítása
 * @param {bool} clicked Ha kattintás miatt indult ez az eljárás
 * @return {bool} True ha tiszta, false ha bomba vagy már feltárt mező
 */
function RevealCell(x, y, removeFlag=true, clicked=true) {
	$currentCell = $("#cell-"+GetCellNum(x, y, width));

	if (playField[y][x] == 0) $currentCell.empty();

	if ($currentCell.hasClass("flag")) {
		if (removeFlag) FlagCell(x, y, $currentCell, true);
	}

	if (playField[y][x] == "B") {
		// Fontawesome halálfej
		if(!clicked && $currentCell.hasClass('flag'))
			$currentCell.html('<i class="fas fa-check"></i>');
		else
			$currentCell.html('<i class="fas fa-skull-crossbones"></i>');

		$currentCell.addClass("revealed bomb");

		if (clicked) EndGame("Legközelebb talán nagyobb szerencséd lesz!");

		return false;
	}

	if (revealed[y][x] == true) return false;
	
	if (playField[y][x] != 0) {
		$currentCell.text(playField[y][x]);
	}

	// Feltárt class hozzáadása CSS-ben
	$currentCell.addClass("revealed");

	revealed[y][x] = true;

	return true;
}

/**
 * Játék vége, mezők felfedése
 * @param {string} message Üzenet az új játék ablakban
 * @param {string} color Üzenet szövegének a színe
 */
function EndGame(message="", color="#700") {
	// Az összes cella felfedése
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			RevealCell(x, y, false, false);
		}
	}

	clearInterval(timerInterval);

	$("#failmessage").text(message);
	$("#failmessage").css("color", color);

	$("#newgamewindow").show(500);
}

/**
 * Megnézi, hogy egy adott X-Y koordináta pár létezik-e
 * @param {number} x A cella X koordinátája
 * @param {number} y A cella Y koordinátája
 * @return {bool} True ha igen, false ha nem
 */
function IsInPlayField(x, y) {
	if (x >= 0 && x < width) {
		if (y >= 0 && y < height) {
			return true;
		}
	}

	return false;
}