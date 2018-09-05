"""

Demo Flask socket.io application with and without eventlet

"""

#add stuff for telnet stream
import pexpect
import subprocess

# Start with a basic flask app webpage.
from flask_socketio import SocketIO, emit
from flask import Flask, render_template, url_for, copy_current_request_context
from time import sleep
from threading import Thread, Event
import eventlet """use when eventlet is installed"""
eventlet.monkey_patch() """use when eventlet is installed"""

__author__ = 'af7ti'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = False

#turn the flask app into a socketio app
socketio = SocketIO(app, async_mode='eventlet') """use when eventlet is installed"""
#socketio = SocketIO(app') """use when eventlet not installed"""

""" telnet specific stuff """
child = pexpect.spawn('telnet telnet.reversebeacon.net 7000')
child.expect ('Please enter your call:')
child.sendline ('XXXXX')
child.maxsize = 1 #turns off buffering
timeout = None

def background_thread(): """use when eventlet is installed"""
    count = 0
    while True:
        #socketio.sleep(10)
        line = child.readline()
        if line != '':
              print (line)
              socketio.emit('newline', {'line': line}, namespace='/test')


thread = Thread()
thread_stop_event = Event()
class TelnetThread(Thread): """use when eventlet not installed"""
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
              print (line)
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

    #Start the random number generator thread only if the thread has not been started before.
    if not thread.isAlive():
        print("Starting Thread")
        thread = socketio.start_background_task(target=background_thread) """use when eventlet is installed""" 
        #thread = TelnetThread() """use when eventlet not installed"""
        #thread.start() """use when eventlet not installed"""

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    #socketio.run(app)
    socketio.run(app, host='0.0.0.0', port=5000) 
