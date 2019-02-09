from websocket_server import WebsocketServer
import threading
from threading import Thread, Event
import logging
import sys
import time
import datetime as dt
import os

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

#telnet
import telnetlib
HOST = 'telnet.reversebeacon.net'
port1 = 7000
port2 = 7001
user = os.getenv("RBN_USERNAME")

COUNT = 0
CW_COUNT = 0
FT8_COUNT = 0
CALC_INTERVAL = 5

launch_time = dt.datetime.today().timestamp()

def increment(x):
    global COUNT
    COUNT = COUNT+1

    if x == "CW":
        global CW_COUNT
        CW_COUNT = CW_COUNT+1
    elif x == "FT8":
        global FT8_COUNT
        FT8_COUNT = FT8_COUNT+1

'''    if COUNT % 10==0:
        run_time = dt.datetime.today().timestamp() - launch_time
        spot_rate = int(round(COUNT/run_time))
        cw_rate = int(round(CW_COUNT/run_time))
        ft8_rate = int(round(FT8_COUNT/run_time))
        print("spot rate: {}".format(spot_rate))
        print("cw rate: {}".format(cw_rate))
        print("ft8 rate: {}".format(ft8_rate))
 '''

def background_thread():     
    logging.warning("in background thread");
    tn = telnetlib.Telnet(HOST, port=port1)
    tn.read_until(b'Please enter your call:')
    tn.write(user.encode('ascii') + b"\r\n")
    last_time = dt.datetime.today().timestamp()
    diffs = []
    while True:
        line = tn.read_until(b'\n')  # Read one line
        if line != '':
            #logging.info('send {}'.format(line))
            server.send_message_to_all(line)
            increment("CW")
	 
def background_thread2(): 
    tn2 = telnetlib.Telnet(HOST, port=port2)
    tn2.read_until(b'Please enter your call:')
    tn2.write(user.encode('ascii') + b"\r\n")
    count = 0
    while True:
        line2 = tn2.read_until(b'\n')  # Read one line
        if line2 != '':
             #logging.info('send {}'.format(line2))
             server.send_message_to_all(line2)
             increment("FT8")

#telnet Line Reader Thread
thread = Thread(target=background_thread)
thread2 = Thread(target=background_thread2)

CW_COUNT = 0
FT8_COUNT = 0
LAST_COUNT = 0
LAST_CW_COUNT = 0
LAST_FT8_COUNT = 0

def check_stuff():
    stopFlag = Event()
    global CW_COUNT
    global FT8_COUNT
    global LAST_CW_COUNT
    global LAST_FT8_COUNT
    #logging.warning ("LAST_CW_COUNT {} CW_COUNT {}".format(LAST_CW_COUNT, CW_COUNT))
    #logging.warning ("LAST_FT8_COUNT {} FT8_COUNT {}".format(LAST_FT8_COUNT, FT8_COUNT))

    now = dt.datetime.today().timestamp() 
    sinceWhen = dt.datetime.today().timestamp() - 1 * 1000
    run_time = dt.datetime.today().timestamp() - sinceWhen #launch_time
    cw_rate = int(round((CW_COUNT/run_time * 1000)/CALC_INTERVAL))
    ft8_rate = int(round((FT8_COUNT/run_time * 1000)/CALC_INTERVAL))
 
    #logging.warning("cw spot rate: {}".format(cw_rate))
    #logging.warning("ft8 spot rate: {}".format(ft8_rate))

    logging.warning("rbnmetric {} {} {} {} {} {}".format(LAST_CW_COUNT, CW_COUNT, cw_rate, LAST_FT8_COUNT, FT8_COUNT, ft8_rate))

    if CW_COUNT == 0: #LAST_CW_COUNT:
       logging.warning ("CW ALERT!!")
       #stopFlag.set()
    if FT8_COUNT == 0: #LAST_FT8_COUNT:
       logging.warning ("FT8 ALERT!!")
       #stopFlag.set()

    LAST_CW_COUNT = CW_COUNT
    LAST_FT8_COUNT = FT8_COUNT

    CW_COUNT = 0
    FT8_COUNT = 0

class MyThread(Thread):
    def __init__(self, event):
        Thread.__init__(self)
        self.stopped = event

    def run(self):

        logging.warning ("self.stopped {}".format(self.stopped))
        while not self.stopped.wait(CALC_INTERVAL):
            check_stuff()

# Called for every client connecting (after handshake)
def new_client(client, server):
    logging.warning("New client connected and was given id %d" % client['id'])
    server.send_message_to_all("Hey all, a new client has joined us")

    #Start telnet threads only if the thread has not been started

    global thread
    logging.warning('Client connected')
    #with thread_lock:
    if not thread.isAlive():
        logging.warning("Starting Thread")
        thread = threading.Thread(target=background_thread)  
        thread.start() 


    global thread2
    #with thread_lock:
    if not thread2.isAlive():
        logging.warning("Starting Thread2")
        thread2 = threading.Thread(target=background_thread2) 
        thread2.start() 

    global thread3
    # start a timer in the background that waits 2 minutes
    #threading.Timer(10, check_stuff).start()
    stopFlag = Event()
    thread3 = MyThread(stopFlag)
    thread3.start()

# Called for every client disconnecting
def client_left(client, server):
	logging.warning("Client(%d) disconnected" % client['id'])


# Called when a client sends a message
def message_received(client, server, message):
	if len(message) > 200:
		message = message[:200]+'..'
	logging.warning("Client(%d) said: %s" % (client['id'], message))


PORT=5001
host="0.0.0.0"
server = WebsocketServer(PORT, host="0.0.0.0")
server.set_fn_new_client(new_client)
#server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()

