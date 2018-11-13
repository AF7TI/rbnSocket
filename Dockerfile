FROM python:latest

WORKDIR /usr/local/rbnsocket

COPY * ./

RUN pip install --no-cache-dir -r requirements.txt

CMD [ "python", "./application.py" ]
