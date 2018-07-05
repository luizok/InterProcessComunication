#! /usr/bin/python3

import os
import zmq
import sys
import json
from pprint import pprint

if __name__ == '__main__':
	#TODO: Some process over the data received by JS Server
	# Why arg[0] != python3 ????
	print('\033[1;33mPython\' father process pid: ' + str(sys.argv[2]))
	obj = json.loads(sys.argv[1])
	objUpperCase = {}	

	if obj == {}:
		print('Error while handling json')
		sys.exit(0);
	
	#TODO: Receive the json  and turn all the keys in values and all the values in keys
	print('Json was successfully handled by python\033[m');
	sys.exit(1);
