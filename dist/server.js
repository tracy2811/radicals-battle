"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var radicals_1 = require("./radicals");
var socket_1 = __importDefault(require("./socket"));
var compression_1 = __importDefault(require("compression"));
var helmet_1 = __importDefault(require("helmet"));
var path_1 = __importDefault(require("path"));
var app = express_1.default();
var server = http_1.default.createServer(app);
var PORT = process.env.PORT || 80;
socket_1.default(server);
app.use(helmet_1.default());
app.use(compression_1.default());
app.use(express_1.default.static(path_1.default.join(__dirname, 'frontend/public')));
app.get('/', function (req, res) {
    res.sendFile(path_1.default.join(__dirname, 'frontend/views/index.html'));
});
app.get('/radicals', function (req, res) {
    res.send(radicals_1.radicals);
});
server.listen(PORT, function () {
    console.log("Server running on port " + PORT + "...");
});
