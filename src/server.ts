import express, { Application, Request, Response, } from 'express';
import http, { Server, } from 'http';
import { radicals, } from './radicals';
import startSocket from './socket';

const app: Application = express();
const server: Server = http.createServer(app);
startSocket(server);

app.get('/', function (req: Request, res: Response) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/radicals', function (req: Request, res: Response) {
	res.send(radicals);
});

server.listen(3000, function () {
	console.log('Server running...');
});

