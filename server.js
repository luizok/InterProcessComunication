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
	NULL_COLOR = '\033[m',
	IP_MASK = new RegExp('(([0-9]{1,3}.){3}[0-9]{1,3})');


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

	app.get('/', (req, res) => {
		res.send('main page, test /test?key0=value0&key1=value1&...&keyN=valueN');
	});

	app.get('/test', (req, res) => { 

		// MasterSlave connection
		let masterToWorker = zmq.socket('req').connect('tcp://127.0.0.1:6666');
		masterToWorker.send(JSON.stringify(req.query));

		// Will be called when one of the workers has finished their job
		masterToWorker.on('message', (data) => {

			let obj = JSON.parse(data);
			
			// Build the final json that will be sent through http
			let statusMessage = obj.code == 0 ? 'Num vai dar nao' : 'Tudo perfeitamente perfeito'
			let COLOR = obj.code == 0 ? RED_COLOR : GREEN_COLOR;

			// if the machine is the same as the server, then 127.0.0.1 is used
			obj.from_ip = req.ip.match(IP_MASK) === null ? '127.0.0.1' : req.ip.match(IP_MASK)[0];			
			// Print a colorful message
			process.stdout.write(COLOR);
			console.log(obj);
			console.log(NULL_COLOR);

			obj.statusMessage = statusMessage;
			
			res.send(obj);
		});
	});

	// Intializing the server
	app.listen(PORT, () => { console.log(`${YELLOW_COLOR}Server is running on port ${PORT}...${NULL_COLOR}`); });

} else {

	let fromMaster = zmq.socket('rep').connect('ipc://dealer_socket.ipc');

	let workerToPyProcess = zmq.socket('req').bind('ipc://' + process.pid + '_socket.ipc');
	let pyProcess = spawn('python3', ['data_processing.py', process.pid]);

	// Listeners to python process outputs
	pyProcess.stdout.on('data', (data) => { console.log(data); });
	pyProcess.stderr.on('data', (data) => { console.log(data); });

	// When the worker receives the information, it will be sent to the python process
	fromMaster.on('message', (data) => { workerToPyProcess.send(data); });

	// Will be called when python process send a response to the call above
	workerToPyProcess.on('message', (data) => {

		let obj = JSON.parse(data);
		let timestamp = Date.now();

		// Send a response to the master process
		fromMaster.send(JSON.stringify({
			pid: process.pid,
			code: obj.status_code,
			timestamp: timestamp,
			date: (new Date (timestamp)).toString(),
			processedData: obj.processed_data
		}));
	});
}
