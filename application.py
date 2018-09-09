"""
Flask socket.io using eventlet as daemon 

"""
import os, time

def daemon(func):
    def wrapper(*args, **kwargs):
        if os.fork(): return
        func(*args, **kwargs)
        os._exit(os.EX_OK)
    return wrapper

# Start with a basic flask app webpage.
from flask_socketio import SocketIO, emit
from flask import Flask, render_template, url_for, copy_current_request_context
from time import sleep
from threading import Thread, Event
import eventlet
eventlet.monkey_patch()

__author__ = 'af7ti'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = False
#turn the flask app into a socketio app
socketio = SocketIO(app, async_mode='eventlet') #"""use when eventlet is installed"""
#socketio = SocketIO(app') """use when eventlet not installed"""

#telnet
import telnetlib
HOST = 'telnet.reversebeacon.net'
port1 = 7000
port2 = 7001
user = 'XXXXX'

def background_thread(): #"""use when eventlet is installed"""    
    tn = telnetlib.Telnet(HOST, port=port1)
    tn.read_until(b'Please enter your call:')
    tn.write(user.encode('ascii') + b"\r\n")
    count = 0
    while True:
        line = tn.read_until(b'\n')  # Read one line
        if line != '':
              print (line)
              socketio.emit('newline', {'line': line}, namespace='/test')

def background_thread2(): #"""use when eventlet is installed"""
    tn2 = telnetlib.Telnet(HOST, port=port2)
    tn2.read_until(b'Please enter your call:')
    tn2.write(user.encode('ascii') + b"\r\n")
    count = 0
    while True:
        line2 = tn2.read_until(b'\n')  # Read one line
        if line2 != '':
              print (line2)
              socketio.emit('newline', {'line': line2}, namespace='/test')

class TelnetThread(Thread): #"""use when eventlet not installed"""
    def __init__(self):
        #self.delay = 1
        super(TelnetThread, self).__init__()

    def telnetLineReader(self):
        """
        Emit input to a socketio instance (broadcast)
        Ideally to be run in a separate thread?
        """
        #infinite loop of readLine attempts
        print("Emitting spots")
        while not thread_stop_event.isSet():
            line = child.readline()
            if line != '':
              #print (line)
              socketio.emit('newline', {'line': line}, namespace='/test')
            #sleep(self.delay)

    def run(self):
        self.telnetLineReader()

@app.route('/')
def index():
    #only by sending this page first will the client be connected to the socketio instance
    return render_template('index.html')

@socketio.on('connect', namespace='/test')
def test_connect():
    # need visibility of the global thread object
    global thread
    print('Client connected')
    #with thread_lock:

    #Start the thread only if the thread has not been started before.
    if not thread.isAlive():
        print("Starting Thread")
        thread = socketio.start_background_task(target=background_thread) #"""use when eventlet is installed""" 
        #thread = TelnetThread() """use when eventlet not installed"""
        #thread.start() """use when eventlet not installed"""


    global thread2
    #with thread_lock:
    if not thread2.isAlive():
        print("Starting Thread2")
        thread2 = socketio.start_background_task(target=background_thread2) #"""use when eventlet is installed""" 

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')

@daemon
def my_func():
    #if __name__ == '__main__':
    #socketio.run(app)
    socketio.run(app, host='0.0.0.0', port=5000)

my_func()
