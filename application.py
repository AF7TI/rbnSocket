from websocket_server import WebsocketServer
import threading
from threading import Thread, Event

#telnet
import telnetlib
HOST = 'telnet.reversebeacon.net'
port1 = 7000
port2 = 7001
user = 'xxxx'

def background_thread(): 
    print("in background thread");
    tn = telnetlib.Telnet(HOST, port=port1)
    tn.read_until(b'Please enter your call:')
    tn.write(user.encode('ascii') + b"\r\n")
    count = 0
    while True:
        line = tn.read_until(b'\n')  # Read one line
        if line != '':
              #print (line)
              server.send_message_to_all(line)

def background_thread2(): 
    tn2 = telnetlib.Telnet(HOST, port=port2)
    tn2.read_until(b'Please enter your call:')
    tn2.write(user.encode('ascii') + b"\r\n")
    count = 0
    while True:
        line2 = tn2.read_until(b'\n')  # Read one line
        if line2 != '':
             #print (line2)
             server.send_message_to_all(line2)

#telnet Line Reader Thread
thread = Thread(target=background_thread)
thread2 = Thread(target=background_thread2)


# Called for every client connecting (after handshake)
def new_client(client, server):
    print("New client connected and was given id %d" % client['id'])
    server.send_message_to_all("Hey all, a new client has joined us")

    #Start telnet threads only if the thread has not been started

    global thread
    print('Client connected')
    #with thread_lock:

    if not thread.isAlive():
        print("Starting Thread")
        thread = threading.Thread(target=background_thread) 
        #thread = TelnetThread() 
        thread.start() # 

    global thread2
    #with thread_lock:
    if not thread2.isAlive():
        print("Starting Thread2")
        thread2 = threading.Thread(target=background_thread2) 
        thread2.start() 

# Called for every client disconnecting
def client_left(client, server):
        print("Client(%d) disconnected" % client['id'])


# Called when a client sends a message
def message_received(client, server, message):
        if len(message) > 200:
                message = message[:200]+'..'
        print("Client(%d) said: %s" % (client['id'], message))


PORT=5001
host="0.0.0.0"
server = WebsocketServer(PORT, host)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()
