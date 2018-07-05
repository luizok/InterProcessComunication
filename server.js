const
	zmq = require('zeromq'),
	cluster = require('cluster'),
	express = require('express'),
	app = express(),
	spawn = require('child_process').spawn,
	CPU_NUM = require('os').cpus().length;


if(cluster.isMaster) {

	console.log("\033[1;36mTotal cpu's = " + CPU_NUM + '\033[m');
	for(let i=0; i < CPU_NUM; i++)
		cluster.fork();

	cluster.on('online', (worker) => {
		console.log('\033[1;32m' + worker.process.pid + ' is online\033[m');
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
		let obj = JSON.stringify(req.query);

		pyProcess = spawn('python3', ['data_processing.py', obj]);

		pyProcess.stdout.on('data', (data) => { console.log(data.toString('utf8')); });
		pyProcess.stderr.on('data', (data) => { console.log(data.toString('utf8')); });
		pyProcess.on('close', (code) => {
			console.log("Python process ended with code " + code);
			if(code == 0)
				res.send('Houve um erro durante o processamento');
			else
				res.send('Tudo sussa, meu parca :D');
		});
	});

	app.listen(3000, () => { console.log('\033[1;36mServer is running on port 3000\033[m'); });

} else {

	let response = zmq.socket('rep').connect('ipc://dealer_socket.ipc');

	response.on('message', function(data) {

		let obj = JSON.parse(data);
		
		response.send(JSON.stringify({
			pid: process.pid,
			timestamp: Date.now(),
			date: (Date (Date.now())).toString(),
			processed_data: obj
		}));
	});
}















