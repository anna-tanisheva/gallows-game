'use strict';
const gameImg = document.querySelectorAll('.game-img');
const gallows = document.querySelector('.img-gallows');
const alphabet = document.querySelector('.alphabet-container');
const yandexDictKey = `dict.1.1.20220205T075301Z.9c1d893405ec6b0d.8610c751858f7d8ce9fe783062170397d1a25221`
const wordContainer = document.querySelector('.word-container');
const startButton = document.querySelector('.start-game');
const rules = document.querySelector('.rules-section')
const wordLength = document.querySelector('.word-length');
const overlayLose = document.querySelector('.overlay-lose');
const overlayWin = document.querySelector('.overlay-win');
const restartButtons = document.querySelectorAll('.restart');
const alphabetLetters = alphabet.querySelectorAll('.alph-letter');
const correctAnswer = overlayLose.querySelector('.correct-answer');
const result = overlayWin.querySelector('.result');
const topResults = overlayWin.querySelector('.top-results');
const sadSound = document.querySelector('.sad-sound');
const sadSoundTwo = document.querySelector('.sad-sound-2');
const inCorrectGuessSound = document.querySelector('.incorrect-guess');
const winSound = document.querySelector('.win-sound');


let letterNodes;
let clickCounter = 0;


let indexImg = 0;
let wordInRussian;


const resultStorage = window.localStorage;
//get array of results from storage.
let arrayFromStorage = [];
for (let item in resultStorage) {
	if (Number(item) && typeof Number(item) === 'number') {
		arrayFromStorage.push({ [item]: resultStorage[item] })
	}
};
arrayFromStorage.sort(function (a, b) {
	return Object.keys(a) - Object.keys(b);
});

function setResultToStorage() {
	resultStorage.clear();
	arrayFromStorage.forEach((item) => {
		resultStorage.setItem(Object.keys(item), Object.values(item))
	})
}

function addToResults(res, array) {
	console.log(array.length)
	let lastKey = array.length;
	if (array.length < 10) {
		array.push({ [lastKey + 1]: res });
	} else {
		array.shift();
		array.map(item => {
			let oldKey = (Object.keys(item))
			let newKey = +(Object.keys(item) - 1)
			if (oldKey !== newKey) {
				Object.defineProperty(item, newKey,
					Object.getOwnPropertyDescriptor(item, oldKey));
				delete item[oldKey];
			}
		})
		array.push({ [array.length + 1]: res });
	}
}


(async function getRandomWord() {
	const url = `https://random-word-form.herokuapp.com/random/noun`;
	const res = await fetch(url);
	const data = await res.json();
	const yandexTranslate = await fetch(`https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${yandexDictKey}&lang=en-ru&text=${data[0]}`)
	const translated = await yandexTranslate.json();
	if (translated.def[0]) {
		wordInRussian = translated.def[0].tr[0].text;
		if (wordInRussian && wordInRussian.indexOf(' ') === -1 && wordInRussian.length >= 7 && wordInRussian.indexOf('-') === -1 && translated.def[0].pos === 'noun') {
			parseWord(wordInRussian);
			wordLength.textContent = `Длина слова: ${wordInRussian.length}`;
		} else {
			getRandomWord()
		}
	} else {
		getRandomWord()
	}
})();



function letterCard(letter) {
	let letterCard = document.createElement('div');
	letterCard.classList.add('letter-card');
	let letterParagraph = document.createElement('p');
	let headImg = document.createElement('div');
	letterParagraph.classList.add('letter');
	letterParagraph.textContent = letter.toUpperCase();
	headImg.classList.add('head-img');
	letterCard.append(letterParagraph, headImg);
	wordContainer.append(letterCard);
}

function parseWord(word) {
	console.log(`Для удобства проверки, правильный ответ: ${word}`)
	let lettersArr = word.toUpperCase().split('');
	wordContainer.innerHTML = '';
	lettersArr.forEach((letter) => {
		letterCard(letter)
	})
	letterNodes = wordContainer.querySelectorAll('.letter-card');
}

function clickLetterHandler(e) {

	if (wordInRussian.toUpperCase().indexOf(e.target.textContent) === -1) {
		//logic for incorrect guess

		if (indexImg < gameImg.length - 1) {
			gameImg[indexImg].classList.toggle('visible');
			indexImg += 1;

		} else {
			correctAnswer.textContent += wordInRussian;
			gameImg[indexImg].classList.add('visible');
			gameImg.forEach((img) => {
				img.classList.add('animation');
			})
			alphabetLetters.forEach((letter) => {
				letter.removeEventListener('click', clickLetterHandler);
			})
			setResultToStorage();
			sadSound.play();
			sadSoundTwo.play()
			setTimeout(() => {
				overlayLose.classList.remove('hidden')
			}, 3500);
		}
		if (!e.target.classList.contains('incorrect-letter') && e.target.classList.contains('alph-letter')) {
			inCorrectGuessSound.play();
			e.target.classList.add('incorrect-letter');
			e.target.classList.add('clicked');
			e.target.removeEventListener('click', clickLetterHandler);
			clickCounter += 1;
		}
	} else if (wordInRussian.toUpperCase().indexOf(e.target.textContent) !== -1) {
		//logic for correct guess

		let flippedCounter = 0;
		letterNodes.forEach((element) => {
			if (element.firstElementChild.textContent === e.target.textContent) {
				element.classList.toggle('flip');
				e.target.classList.add('invisible');
				e.target.removeEventListener('click', clickLetterHandler);
			}
		})
		clickCounter += 1;
		letterNodes.forEach(element => {
			if (element.classList.contains('flip')) {
				flippedCounter += 1;
			}
		})
		if (flippedCounter === letterNodes.length) {
			window.setTimeout(() => {
				overlayWin.classList.remove('hidden');
			}, 4000)

			gallows.classList.add('hidden');
			gameImg.forEach((img) => {
				img.style.left = `${(window.getComputedStyle(img).left.split('p')[0]) - 100}px`;
				img.classList.add('visible');
				img.classList.add('animation-win');
			})
			winSound.play();
			result.textContent = `Вы открыли слово за: ${clickCounter} ${clickCounter > 4 ? 'ходов' : 'хода'}`;
			addToResults(clickCounter, arrayFromStorage);
			setResultToStorage();
			arrayFromStorage.forEach((item) => {
				topResults.innerHTML += `<br> ${Object.keys(item)} - ${Object.values(item)}`;
			})
			if (arrayFromStorage.length < 10) {
				topResults.innerHTML += `<br> Вы еще не выиграли 10 игр <br>`
			}
		}
	}
}

//listeners
alphabetLetters.forEach((letter) => {
	letter.addEventListener('click', clickLetterHandler);
})
restartButtons.forEach((button) => {
	button.addEventListener('click', function () {
		location.reload();
	})
})
window.addEventListener('load', () => {
	if (arrayFromStorage.length === 0) {
		rules.classList.remove('hidden');
		startButton.addEventListener('click', () => {
			rules.classList.add('hidden')
		})
	}

})


console.log(`1. Вёрстка +10
2. Логика игры. Ходы, перемещения фигур, другие действия игрока подчиняются определённым свойственным игре правилам +10
3. Реализовано завершение игры при достижении игровой цели +10
4. По окончанию игры выводится её результат, например, количество ходов, время игры, набранные баллы, выигрыш или поражение и т.д +10
5. Результаты последних 10 игр сохраняются в local storage. Есть таблица рекордов, в которой сохраняются результаты предыдущих 10 игр +10
6. Анимации или звуки, или настройки игры: звуки и немного анимации. Баллы начисляются за любой из перечисленных пунктов +10
7. Очень высокое качество оформления приложения и/или дополнительный не предусмотренный в задании функционал, улучшающий качество приложения +10
 - оригинальная игра, не было в предложенных в демо
 - адаптировано под различные экраны`)