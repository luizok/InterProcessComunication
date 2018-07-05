const
	zmq = require('zeromq'),
	cluster = require('cluster'),
	express = require('express'),
	app = express(),
	spawn = require('child_process').spawn,
	PORT = process.argv[2],
	CPU_NUM = require('os').cpus().length,
	RED_COLOR = '\033[1;31m',
	GREEN_COLOR = '\033[1;32m',
	YELLOW_COLOR = '\033[1;33m',
	BLUE_COLOR = '\033[1;36m',
	NULL_COLOR = '\033[m',
	stdFlowControl = function(data) {
		console.log(`${data}`);
	};


if(cluster.isMaster) {

	console.log(`${YELLOW_COLOR}Total cpus = ${CPU_NUM}${NULL_COLOR}`);
	for(let i=0; i < CPU_NUM; i++)
		cluster.fork();

	cluster.on('online', (worker) => {
		console.log(`${YELLOW_COLOR}${worker.process.pid} is online${NULL_COLOR}`);
	});

	// bi-directional local connection router <==> dealer
	let router = zmq.socket('router').bind('tcp://127.0.0.1:6666'); // >:)
	let dealer = zmq.socket('dealer').bind('ipc://dealer_socket.ipc');

	router.on('message', function() {
		let frames = Array.prototype.slice.call(arguments);
		dealer.send(frames);
	});

	dealer.on('message', function() {
		let frames = Array.prototype.slice.call(arguments);
		router.send(frames);
	});

	//Intializing server
	app.get('/', (req, res) => {
		res.send('main page, test /test?key0=value0&key1=value1&...&keyN=valueN');
	});

	app.get('/test', (req, res) => {
		//let str = 'Era essa a peca que voce queria ?\n ' + JSON.stringify(req.query);
		//let request = zmq.socket('req').connect('tcp://127.0.0.1:6666');

		//request.send(JSON.stringify(req.query));

		//request.on('message', function(data) {
		//	let obj = JSON.parse(data);
		//	console.log(
		//		'\033[1;33m' + obj.pid + ' did his job working on json \n' 
		//		   + JSON.stringify(obj.processed_data) + '\033[m'
		//	);
		//	console.log();
		//	res.send(obj);
		//});

		let request = zmq.socket('req').connect('tcp://127.0.0.1:6666');
		request.send(JSON.stringify(req.query));

		request.on('message', (data) => {

			let obj = JSON.parse(data);
			let ipMask = new RegExp('(([0-9]{1,3}.){3}[0-9]{1,3})');

			let statusMessage = obj.code == 0 ? 'Num vai dar nao' : 'Tudo perfeitamente perfeito'
			let COLOR = obj.code == 0 ? RED_COLOR : GREEN_COLOR;

			obj.from_ip = req.ip.match(ipMask) === null ? '127.0.0.1' : req.ip.match(ipMask)[0];			

			process.stdout.write(COLOR);
			console.log(obj);
			console.log(NULL_COLOR);
			obj.statusMessage = statusMessage;
			
			res.send(obj);
		});
	});

	app.listen(PORT, () => { console.log(`${YELLOW_COLOR}Server is running on port ${PORT}...${NULL_COLOR}`); });

} else {

	let response = zmq.socket('rep').connect('ipc://dealer_socket.ipc');

	response.on('message', (data) => {

		let pyProcess = spawn('python3', ['data_processing.py', data, process.pid]);

		pyProcess.stdout.on('data', (data) => { stdFlowControl(data); });
		pyProcess.on('close', (code) => {
			response.send(JSON.stringify({
				pid: process.pid,
				code: code,
				timestamp: Date.now(),
				date: (Date (Date.now)).toString(),
				processed_data: JSON.parse(data)
			}));
		});
	});
}















