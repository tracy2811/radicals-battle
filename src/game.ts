import { Radical, randomRadicals, } from './radicals';
import { Socket, } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface QuestionFormat {
	question: string;
	choices: string[];
	format: number;
}

interface Question {
	radicals: Radical[];
	format: number; // 0: radical-meaning, 1: meaning-radical
	selectedIndex: number;
}

interface User {
	socket: Socket;
	searching: boolean;
	currentGame: {
		game: Game;
		currentQuestionIndex: number;
		nCorrect: number;
	} | null;
}

interface Result {
	totalQuestion: number;
	players: {
		id: string;
		nCorrect: number;
		currentQuestionIndex: number;
	}[];
}

export {
	QuestionFormat,
	Question,
	User,
	Result,
}

export default class Game {
	private questions: Question[];
	readonly id: string;
	readonly total: number;
	private players: User[];

	constructor(players: User[], total: number = 7, nChoices: number = 4) {
		if (total <= 0) {
			throw new Error('Invalida total number of questions');
		}
		if (nChoices <= 1) {
			throw new Error('Invalid number of choices');
		}
		this.id = uuidv4();
		this.players = players;
		this.total = total;
		this.questions = [];
		for (let i: number = 0; i < total; i += 1) {
			const radicals = randomRadicals(nChoices);
			const format = Math.floor(Math.random() * 2);
			const selectedIndex = Math.floor(Math.random() * nChoices);
			this.questions.push({ radicals, format, selectedIndex, });
		}
	}

	getQuestionFormat(index: number): QuestionFormat {
		if (index < 0 || index >= this.total) {
			throw new Error('Invalid question index');
		}
		const question: Question = this.questions[index];
		const selectedRadical: Radical = question.radicals[question.selectedIndex];
		const choices: string[] = question.radicals.map(function(radical: Radical): string {
			return question.format === 0 ? radical.meaning : radical.radical;
		});

		return {
			question: question.format === 0 ? selectedRadical.radical : selectedRadical.meaning,
			choices,
			format: question.format,
		};
	}

	getAnswer(index: number): Question {
		if (index < 0 || index >= this.total) {
			throw new Error('Invalid question index');
		}
		return this.questions[index];
	}

	getStatus(): Result {
		let result: Result = {
			totalQuestion: this.total,
			players: [],
		};
		this.players.forEach(function (player: User) {
			if (player.currentGame) {
				result.players.push({
					id: player.socket.id,
					nCorrect: player.currentGame.nCorrect,
					currentQuestionIndex: player.currentGame.currentQuestionIndex,

				});
			}
		});
		return result;

	};

	finish() {
		this.players.forEach(function (player: User) {
			if (player.currentGame) {
				player.socket.leave(player.currentGame.game.id);
				player.currentGame = null;
			}
		});
	};

}

