"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var radicals_1 = require("./radicals");
var socket_1 = __importDefault(require("./socket"));
var app = express_1.default();
var server = http_1.default.createServer(app);
socket_1.default(server);
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/radicals', function (req, res) {
    res.send(radicals_1.radicals);
});
server.listen(3000, function () {
    console.log('Server running...');
});