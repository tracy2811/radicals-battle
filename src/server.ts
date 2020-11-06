import express, { Application, Request, Response, } from 'express';
import http, { Server, } from 'http';
import { radicals, } from './radicals';
import startSocket from './socket';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';

const app: Application = express();
const server: any = http.createServer(app);
startSocket(server);

app.use(helmet());
app.use(compression());
app.use(express.static(path.join(__dirname, 'frontend/public')));

app.get('/', function (req: Request, res: Response) {
	res.sendFile(path.join(__dirname, 'frontend/views/index.html'));
});

app.get('/radicals', function (req: Request, res: Response) {
	res.send(radicals);
});

server.listen(3000, function () {
	console.log('Server running on port 3000...');
});

