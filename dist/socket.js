"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = __importDefault(require("socket.io"));
var game_1 = __importDefault(require("./game"));
var startSocket = function (server) {
    var io = socket_io_1.default(server);
    var onlineUsers = []; // All connected users
    io.on('connection', function (socket) {
        var user = {
            socket: socket,
            searching: false,
            currentGame: null,
        };
        onlineUsers.push(user);
        socket.on('disconnect', function () {
            onlineUsers = onlineUsers.filter(function (u) { return u !== user; });
            if (user.currentGame) {
                io.to(user.currentGame.game.id).emit('leave', user.currentGame.game.getStatus());
                user.currentGame.game.finish();
            }
        });
        socket.on('search', function () {
            var opponent = onlineUsers.find(function (u) { return u.searching; });
            if (opponent) {
                // Create game
                var game = new game_1.default([user, opponent]);
                user.currentGame = { game: game, currentQuestionIndex: 0, nCorrect: 0, };
                opponent.currentGame = { game: game, currentQuestionIndex: 0, nCorrect: 0, };
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
        socket.on('answer', function (index) {
            if (user.currentGame) {
                var game = user.currentGame.game;
                var answer = game.getAnswer(user.currentGame.currentQuestionIndex);
                var correct = answer.selectedIndex === index;
                io.to(socket.id).emit('solution', game.getAnswer(user.currentGame.currentQuestionIndex));
                // Update nCorrect and currentQuestionIndex
                if (correct) {
                    user.currentGame.nCorrect += 1;
                }
                user.currentGame.currentQuestionIndex += 1;
                var result = game.getStatus();
                if (user.currentGame.currentQuestionIndex === game.total) {
                    io.in(game.id).emit('finish', result);
                    game.finish();
                }
                else {
                    io.in(game.id).emit('update', result);
                    io.to(socket.id).emit('question', game.getQuestionFormat(user.currentGame.currentQuestionIndex));
                }
            }
        });
    });
};
exports.default = startSocket;
