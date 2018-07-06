#! /usr/bin/python3

import os
import zmq
import sys
import json
import time
from pprint import pprint


def do_some_processing(data):

	obj = json.loads(data.decode('utf-8'))
	return {'status_code': 1 if obj != {} else 0, 'processed_data': obj}


def zmq_listen(process_pid):

	context = zmq.Context()
	socket = context.socket(zmq.REP)
	socket.connect('ipc://{}_socket.ipc'.format(process_pid))	

	while True:
		message = socket.recv()
		obj = do_some_processing(message)
		socket.send(bytes(json.dumps(obj), 'utf-8'))


if __name__ == '__main__':
	#TODO: Some process over the data received by JS Server
	# Why arg[0] != python3 ????
	zmq_listen(sys.argv[1])
