import socketIO, { Socket, } from 'socket.io';
import Game, { User, Result, } from './game';
import { Server, } from 'http';

const startSocket = function (server: Server) {
	const io = socketIO(server);
	let onlineUsers: User[] = []; // All connected users

	io.on('connection', function (socket: Socket) {
		const user: User = {
			socket: socket,
			searching: false,
			currentGame: null,
		};
		onlineUsers.push(user);
		socket.on('disconnect', function () {
			onlineUsers = onlineUsers.filter((u) => u !== user);
			if (user.currentGame) {
				io.to(user.currentGame.game.id).emit('leave', user.currentGame.game.getStatus());
				user.currentGame.game.finish();
			}
		});

		socket.on('search', function() {
			let opponent = onlineUsers.find((u) => u.searching);
			if (opponent) {
				// Create game
				let game = new Game([user, opponent]);

				user.currentGame = { game, currentQuestionIndex: 0, nCorrect: 0, };
				opponent.currentGame = { game, currentQuestionIndex: 0, nCorrect: 0, };
				opponent.searching = false;

				// Join room
				socket.join(game.id);
				opponent.socket.join(game.id);

				// Emit question
				io.in(game.id).emit('start', game.getStatus());
				io.in(game.id).emit('question', game.getQuestionFormat(0));
				return;
			} 
			user.searching = true;
		});

		socket.on('answer', function(index) {
			if (user.currentGame) {
				let game = user.currentGame.game;
				let answer = game.getAnswer(user.currentGame.currentQuestionIndex);
				let correct = answer.selectedIndex === index;

				io.to(socket.id).emit('solution', game.getAnswer(user.currentGame.currentQuestionIndex));

				// Update nCorrect and currentQuestionIndex
				if (correct) {
					user.currentGame.nCorrect += 1;
				}
				user.currentGame.currentQuestionIndex += 1;

				let result: Result = game.getStatus();
				if (user.currentGame.currentQuestionIndex === game.total) {
					io.in(game.id).emit('finish', result);
					game.finish();
				} else {
					io.in(game.id).emit('update', result);
					io.to(socket.id).emit('question', game.getQuestionFormat(user.currentGame.currentQuestionIndex));
				}
			}
		});
	});
};

export default startSocket;

