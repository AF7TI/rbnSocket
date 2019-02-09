# rbnSocket

Python WebSocket server sending Reverse Beacon Network telnet streams. Consume and geocode with [qrzSocket](https://github.com/AF7TI/qrzSocket).

## Installation
Build image from Dockerfile, tag with rbnsocket   
    `docker build -t rbnsocket .`
 
## Configuration
Pass callsign through environment variables       
    `docker run -e "RBN_USERNAME=xxxxx" -p 5001:5001 -d rbnsocket`

## Running Code
Service online at ws://rbnsocket.af7ti.com:5001

## Contributing
Contributions welcome! Fork the project and open a pull request.

## Thank you
Thanks to [Reverse Beacon Network](http://www.reversebeacon.net/) infrastructure providers and skimmers for making the data flow
