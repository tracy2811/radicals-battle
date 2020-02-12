(function start() {
	const socket = io();
	const startButton = document.querySelector('#start');
	const searchingMessage = document.createElement('p');
	let playing = false;
	let info;
	let question;

	searchingMessage.textContent = 'Finding opponent...';

	const Question  = function (question, choices) {
		const wrapper = document.createElement('div');
		const ques = document.createElement('h3');
		const chos = [];
		let selected;

		wrapper.appendChild(ques);
		for (let i = 0; i < choices.length; i += 1) {
			const choice = document.createElement('button');
			chos.push(choice);
			wrapper.appendChild(choice);
			choice.addEventListener('click', function (e) {
				choice.classList.add('selected');
				socket.emit('answer', i);
				selected = i;
			});
		};

		const updateQuestion = function (question, choices) {
			ques.textContent = question;
			for (let i = 0; i < choices.length; i += 1) {
				chos[i].textContent = choices[i];
				chos[i].classList.remove('selected');
				chos[i].classList.remove('correct');
				chos[i].classList.remove('incorrect');
			}
		};

		const updateSolution = function (radicals, selectedIndex) {
			for (let i = 0; i < radicals.length; i += 1) {
				chos[i].textContent = `${radicals[i].radical} ${radicals[i].meaning}`;
			}

			chos[selectedIndex].classList.add('correct');
			if (selected && selectedIndex !== selected) {
				chos[selected].classList.add('incorrect');
			}
			selected = null;
		};

		updateQuestion(question, choices);
		return {
			dom: wrapper,
			updateQuestion,
			updateSolution,
		};
	};

	const GameInfo = function (totalQuestion, player, playerOpponent) {
		const wrapper = document.createElement('div');
		const total = document.createElement('h2');
		const you = document.createElement('h3');
		const opponent = document.createElement('h3');

		wrapper.appendChild(total);
		wrapper.appendChild(you);
		wrapper.appendChild(opponent);

		const updateScore = function (totalQuestion, player, playerOpponent) {

			total.textContent = `Total: ${totalQuestion}`;
			you.textContent = `You: ${player.nCorrect}/${player.currentQuestionIndex}`;
			opponent.textContent = `Opponent: ${playerOpponent.nCorrect}/${playerOpponent.currentQuestionIndex}`;

		};

		updateScore(totalQuestion, player, playerOpponent);

		return {
			dom: wrapper,
			updateScore,
		};
	};


	startButton.addEventListener('click', function () {
		if (!playing) {
			socket.emit('search');
			document.body.appendChild(searchingMessage);
			document.body.removeChild(startButton);
		}
	});

	socket.on('start', function (data) {
		document.body.removeChild(searchingMessage);
		playing = true;
		let playerIndex = data.players[0].id === socket.id ? 0 : 1;
		if (!info) {
			info = GameInfo(data.totalQuestion, data.players[playerIndex], data.players[1-playerIndex]);
			document.body.appendChild(info.dom);
		} else {
			info.updateScore(data.totalQuestion, data.players[playerIndex], data.players[1-playerIndex]);
		}
	});

	socket.on('update', function (data) {
		if (info) {
			let playerIndex = data.players[0].id === socket.id ? 0 : 1;
			info.updateScore(data.totalQuestion, data.players[playerIndex], data.players[1-playerIndex]);
		}
	});

	socket.on('question', function (data) {
		if (!question) {
			question = Question(data.question, data.choices);
			document.body.appendChild(question.dom);
		} else {
			setTimeout(function () {
				if (question) {
					question.updateQuestion(data.question, data.choices);
				}
			}, 1000);
		}
	});

	socket.on('leave', function (data) {
		playing = false;
		alert('Opponent left');
		clearDOM();
	});

	socket.on('finish', function (data) {
		playing = false;
		let playerIndex = data.players[0].id === socket.id ? 0 : 1;
		if (data.players[playerIndex].nCorrect > data.players[1-playerIndex].nCorrect) {
			alert('You win!');
		} else if (data.players[playerIndex].nCorrect < data.players[1-playerIndex].nCorrect) {
			alert('You lose!');
		} else {
			alert('It\'t a tie!');
		}
		clearDOM();
	});

	socket.on('solution', function (data) {
		if (question) {
			question.updateSolution(data.radicals, data.selectedIndex);
		}
	});

	const clearDOM = function () {
		if (info) {
			document.body.removeChild(info.dom);
			info = null;
		}
		if (question) {
			document.body.removeChild(question.dom);
			question = null;
		}
		document.body.appendChild(startButton);

	};
})();

