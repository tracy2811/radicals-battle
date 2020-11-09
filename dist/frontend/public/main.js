(function start() {
    const socket = io();
    const root = document.querySelector('#root');
    const startButton = document.querySelector('#start');
    const warrior = document.querySelector('#warrior');
    const createMessage = function(msg, path, loop, autoplay) {
        const message = document.createElement('div');
        const animationContainer = document.createElement('div');
        const text = document.createElement('p');
        const animation = bodymovin.loadAnimation({
            container: animationContainer,
            path,
            renderer: 'svg',
            loop,
            autoplay,
        });
        message.appendChild(animationContainer);
        animationContainer.classList.add('animation');
        message.classList.add('message');
        text.textContent = msg;
        if (msg) {
            message.appendChild(text);
        }
        return { message, animation, animationContainer };
    };
    const {
        message: searchingMessage,
        animationContainer: messageAnimationContainer,
    } = createMessage('Finding opponent...', 'search.json', true, true);
    const {
        message: winMessage,
        animation: winAnimation,
        animationContainer: winAnimationContainer,
    } = createMessage('You win!', 'win.json', true, false);
    const {
        message: drawMessage,
        animation: drawAnimation,
        animationContainer: drawAnimationContainer,
    } = createMessage('It\'s a tie!', 'draw.json', true, false);
    const {
        message: loseMessage,
        animation: loseAnimation,
        animationContainer: loseAnimationContainer,
    } = createMessage('You lose!', 'lose.json', true, false);
    const {
        message: leaveMessage,
        animation: leaveAnimation,
        animationContainer: leaveAnimationContainer,
    } = createMessage('Opponent left!', 'leave.json', true, false);

    let playing = false;
    let info;
    let question;

    bodymovin.loadAnimation({
        container: warrior,
        path: 'warrior.json',
        renderer: 'svg',
        loop: true,
        autoplay: true,
    });

    const Question = function (question, choices) {
        const wrapper = document.createElement('div');
        const ques = document.createElement('h2');
        const chosWrapper = document.createElement('div');
        const chos = [];
        let selected;

        ques.textContent = question;
        wrapper.appendChild(ques);
        wrapper.appendChild(chosWrapper);
        wrapper.id = 'question';
        chosWrapper.id = 'ops';

        for (let i = 0; i < choices.length; i += 1) {
            const choice = document.createElement('button');
            chos.push(choice);
            chosWrapper.appendChild(choice);
            choice.addEventListener('click', function (e) {
                if (selected === undefined || selected === null) {
                    choice.classList.add('selected');
                    socket.emit('answer', i);
                    selected = i;
                }
            });
        };

        const selectSolution = function(index) {
            chos[index].click();
        }

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
            chos[selectedIndex].classList.remove('selected');
            if (selectedIndex !== selected) {
                chos[selected].classList.add('incorrect');
            }
            selected = null;
        };

        updateQuestion(question, choices);
        return {
            dom: wrapper,
            updateQuestion,
            updateSolution,
            selectSolution,
        };
    };

    const GameInfo = function (totalQuestion, player, playerOpponent) {
        const wrapper = document.createElement('div');
        const total = document.createElement('p');
        const you = document.createElement('p');
        const opponent = document.createElement('p');

        wrapper.appendChild(total);
        wrapper.appendChild(you);
        wrapper.appendChild(opponent);
        wrapper.id = 'info'

        const updateScore = function (totalQuestion, player, playerOpponent) {
            total.textContent = `Total:   ${totalQuestion}`;
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
            clearDOM();
            if (warrior.parentNode) {
                warrior.parentNode.removeChild(warrior);
            }
            root.appendChild(searchingMessage);
        }
    });

    socket.on('start', function (data) {
        root.removeChild(searchingMessage);
        playing = true;
        let playerIndex = data.players[0].id === socket.id ? 0 : 1;
        if (!info) {
            info = GameInfo(data.totalQuestion, data.players[playerIndex], data.players[1-playerIndex]);
            root.appendChild(info.dom);
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
            root.appendChild(question.dom);
        } else {
            setTimeout(function () {
                if (question) {
                    question.updateQuestion(data.question, data.choices);
                }
            }, 1700);
        }
    });

    socket.on('leave', function (data) {
        playing = false;
        clearDOM();
        root.appendChild(leaveMessage);
        leaveAnimation.goToAndPlay(0, false);
        restartState();
    });

    socket.on('finish', function (data) {
        playing = false;
        let playerIndex = data.players[0].id === socket.id ? 0 : 1;
        clearDOM();
        if (data.players[playerIndex].nCorrect > data.players[1-playerIndex].nCorrect) {
            root.appendChild(winMessage);
            winAnimation.goToAndPlay(0, false);
        } else if (data.players[playerIndex].nCorrect < data.players[1-playerIndex].nCorrect) {
            root.appendChild(loseMessage);
            loseAnimation.goToAndPlay(0, false);
        } else {
            root.appendChild(drawMessage);
            drawAnimation.goToAndPlay(0, false);
        }
        restartState();
    });

    socket.on('solution', function (data) {
        if (question) {
            question.updateSolution(data.radicals, data.selectedIndex);
        }
    });

    const restartState = function () {
        info = null;
        question = null;
        root.appendChild(startButton);
    };

    const clearDOM = function () {
        if (searchingMessage.parentNode) {
            searchingMessage.parentNode.removeChild(searchingMessage);
        }
        if (startButton.parentNode) {
            startButton.parentNode.removeChild(startButton);
        }
        if (info && info.dom.parentNode) {
            info.dom.parentNode.removeChild(info.dom)
        };
        if (question && question.dom.parentNode) {
            question.dom.parentNode.removeChild(question.dom);
        }
        if (winMessage.parentNode) {
            winMessage.parentNode.removeChild(winMessage);
        }
        if (loseMessage.parentNode) {
            loseMessage.parentNode.removeChild(loseMessage);
        }
        if (drawMessage.parentNode) {
            drawMessage.parentNode.removeChild(drawMessage);
        }
        if (leaveMessage.parentNode) {
            leaveMessage.parentNode.removeChild(leaveMessage);
        }
    };

    document.addEventListener('keyup', (event) => {
        const keyName = event.key;
        if (root.contains(startButton)) {
            startButton.click();
        } else if (playing && question) {
            if (keyName === '1' || keyName.toLowerCase() === 'a') {
                question.selectSolution(0);
            } else if (keyName === '2' || keyName.toLowerCase() === 'b') {
                question.selectSolution(1);
            } else if (keyName === '3' || keyName.toLowerCase() === 'c') {
                question.selectSolution(2);
            } else if (keyName === '4' || keyName === 'd') {
                question.selectSolution(3);
            }
        }
    });
})();

