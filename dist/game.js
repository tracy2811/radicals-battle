"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var radicals_1 = require("./radicals");
var v4_1 = __importDefault(require("uuid/v4"));
var Game = /** @class */ (function () {
    function Game(players, total, nChoices) {
        if (total === void 0) { total = 7; }
        if (nChoices === void 0) { nChoices = 4; }
        if (total <= 0) {
            throw new Error('Invalida total number of questions');
        }
        if (nChoices <= 1) {
            throw new Error('Invalid number of choices');
        }
        this.id = v4_1.default();
        this.players = players;
        this.total = total;
        this.questions = [];
        for (var i = 0; i < total; i += 1) {
            var radicals = radicals_1.randomRadicals(nChoices);
            var format = Math.floor(Math.random() * 2);
            var selectedIndex = Math.floor(Math.random() * nChoices);
            this.questions.push({ radicals: radicals, format: format, selectedIndex: selectedIndex, });
        }
    }
    Game.prototype.getQuestionFormat = function (index) {
        if (index < 0 || index >= this.total) {
            throw new Error('Invalid question index');
        }
        var question = this.questions[index];
        var selectedRadical = question.radicals[question.selectedIndex];
        var choices = question.radicals.map(function (radical) {
            return question.format === 0 ? radical.meaning : radical.radical;
        });
        return {
            question: question.format === 0 ? selectedRadical.radical : selectedRadical.meaning,
            choices: choices,
            format: question.format,
        };
    };
    Game.prototype.getAnswer = function (index) {
        if (index < 0 || index >= this.total) {
            throw new Error('Invalid question index');
        }
        return this.questions[index];
    };
    Game.prototype.getStatus = function () {
        var result = {
            totalQuestion: this.total,
            players: [],
        };
        this.players.forEach(function (player) {
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
    ;
    Game.prototype.finish = function () {
        this.players.forEach(function (player) {
            if (player.currentGame) {
                player.socket.leave(player.currentGame.game.id);
                player.currentGame = null;
            }
        });
    };
    ;
    return Game;
}());
exports.default = Game;
