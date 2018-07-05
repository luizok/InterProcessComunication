#! /usr/bin/python3

import zmq
import sys
import json
from pprint import pprint

if __name__ == '__main__':
	#TODO: Some process over the data received by JS Server
	# Why arg[0] != python3 ????
	print("Current args in python: " + str(sys.argv))
	if len(sys.argv) < 2:
		print('Usage: python3 <filename> <jsonStr>');
		sys.exit(0);
	else:
		obj = json.loads(sys.argv[1])
		for k, v in obj.items():
			print("{} = {}".format(k, v))

		sys.exit(1);
