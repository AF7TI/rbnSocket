// use d3 to display real-time data from reversebeacon network. see application.py for server side

var data = [];
var spot = [];
const parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%S%Z");

$(document).ready(function(){
    //connect to the socket server.
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/test');
    socket.on('newline', function(msg) {
        var enc = new TextDecoder(); // always utf-8
        var string = enc.decode(msg.line);
        string = string.split(/[ ,]+/).filter(Boolean);
        //console.log("Received line " + string);
        de = string[2].replace(/-/g, "").replace(/#/g, "");
        dx = string[4].replace(/-/g, "").replace(/#/g, "");
	freq = string[3];
        time = parseDate(moment().format()); //parseDate(time)
        spot = {};
	mykey = Date.now(); //for d3 key function since shifting array modifies index
	spot.dx = dx, spot.mykey = mykey, spot.time = time, spot.freq = +freq;
         
       	//add spot to array if freq is legit
	if (!isNaN(spot.freq)) {data.push(spot)};
        
	//filter out falsy values to handle weak parsing
	//data = data.filter(Boolean);

        tick();
    });

    setInterval(tick, 1000); //tick every second to keep animation smooth
   
    setInterval(clean, 300);
    
    const margin = {
    top: 80,
    right:40,
    left: 50,
    bottom: 200
     };
    const width = 1000 - margin.right - margin.left;
    const height = 800 - margin.top - margin.bottom;

    var svg = d3.select("svg")
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
 
    //Mike Bostock "If you want a real-time axis, you probably donâ€™t want transitions. Instead, use d3.timer and redraw the axis with every tick."
    
    var x = d3.scaleTime().range([0, width]);
    var xAxis = d3.axisBottom(x);

    var xG = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
	.call(xAxis);

    d3.timer(function() {
        var now = Date.now();
	x.domain([now - 10 * 6000, now]);
	xG.call(xAxis);
    });
   
    var y = d3.scaleLinear().domain([0, 100000]).range([height, 0]);
                             
    var yAxis = d3.axisLeft(y)
       .tickSize(-width);
    
    var yG = svg.append("g")
        .attr("class", "axis axis--y")
          .call(yAxis);
    
    svg.selectAll('circle').data(data, d => d.mykey)
          .enter().append('circle')
            .attr('cx', d => x(d.time))
            .attr('cy', d => y(d.freq))
	    .attr('fill-opacity', 0.6)
	    .attr('r', 8);

    function clean() {
      //remove oldest matching spot
      var now = new Date();
        var maxAge = new Date(now.getTime() - 60000); 
        if (data.length > 0) {
                if(data[0].time < maxAge) data.shift();
        }
    }

    function tick() {

      console.log(spot.dx + ' ' + spot.freq);
      
      //filter out falsy values to handle weak parsing
      data = data.filter(Boolean);

      // Update y axis 
      y.domain([0, d3.max(data, d => +d.freq )]);
        
      d3.select(".axis.axis--y").transition().duration(1000).ease(d3.easeLinear)
          .call(yAxis);
      
      // Update data
      var updateSel = svg.selectAll("circle")
          .data(data, d => d.mykey);

      // Remove old items
      updateSel.exit().remove();

      // Add new items 
      updateSel.enter().append('circle')
          .attr('cx', d => x(d.time))
          .attr('cy', d => y(d.freq))
          .attr('fill-opacity', 0.6)
          .attr('r', 8)
	  .attr("clip-path", "url(#clip)");

      // Transition Selections
      updateSel //.attr('cx', d=>x(d.time))
          .transition().duration(1000).ease(d3.easeLinear)
	  .attr('cx', d => x(d.time))
	  .attr('cy', d => y(d.freq));
       
    } 
});
