FROM python:latest

WORKDIR /usr/local/rbnsocket

COPY * ./

RUN pip install git+https://github.com/Pithikos/python-websocket-server

CMD [ "python", "./application.py" ]
