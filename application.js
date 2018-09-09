// my dev socket server lacks a cert so you may need to click thru to see chart
// use d3 to display real-time data from reversebeacon network. see application.py for server side

var data = [];
var color = d3.scaleOrdinal()
    .domain(["CW", "FT8"])
    .range(["#377eb8","#4daf4a"]);
var filterdata = data;
var qryActive = false;
var query;
const parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

$(document).ready(function(){
    //connect to the socket server.
    var socket = io.connect('http://34.219.0.24:5000/test');
    socket.on('newline', function(msg) {
        var enc = new TextDecoder(); // always utf-8
        var string = enc.decode(msg.line);
        string = string.split(/[ ,]+/).filter(Boolean);
        //console.log("Received line " + string);
        de = string[2].replace(/-/g, "").replace(/#/g, "").replace(/:/g, "");
        dx = string[4].replace(/-/g, "").replace(/#/g, "");
	freq = string[3];
        //time = parseDate(moment().format());
        time = parseDate(new Date().toISOString());
	mode = string[5];
	spot = {};
	mykey = Date.now(); //for d3 key function since shifting array modifies index
	spot.de = de, spot.dx = dx, spot.mykey = mykey, spot.time = time, spot.freq = +freq, spot.mode = mode;
         
       	//add spot to array if freq is legit
	if (!isNaN(spot.freq)) {data.push(spot)};
        
        tick(caller='newspot'); //as tick is also being called with setInterval need to pass key to tick so we can determine if spot is new to avoid excess logging and stuff
    });

    //setInterval(tick, 1000); //tick every second to keep animation smooth
   
    setInterval(function(){tick(caller='timer')}, 1000);

    setInterval(clean,100);
    
    const margin = {
    top: 40,
    right:50,
    left: 50,
    bottom: 40
     };
    //const width = 1000 - margin.right - margin.left;
    //const height = 800 - margin.top - margin.bottom;
    var width = window.innerWidth - margin.right - margin.left;
    height = .7 * window.innerHeight - margin.top - margin.bottom; //aspect ratio is 0.7

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
 
    //Mike Bostock "If you want a real-time axis, you probably don't want transitions
    //Instead, use d3.timer and redraw the axis with every tick."
    
    var x = d3.scaleTime().range([0, width]);
    var xAxis = d3.axisBottom(x);

    var xG = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
	.call(xAxis);
   
    var txtfilter =  d3.select('#legend')
        .append('input')
        .attr('type','text')
        .attr('name','textInputfilter')
        .attr('id', 'filtertxt')
        .attr('size', 100)
        .attr('label', 'filter')
        .attr('value','Filter');

    const txtReadMe = d3.select('#legend')
	.append('div')
	.text('Filter uses JSON format. To filter mode and only show CW: {"mode" : "CW"}. Filter by CW and DX  {"mode" : "CW", "dx" : "AF7TI"} . Filter by FT8, DX and DE {"mode": "FT8", "dx" : "AF7TI", "de" : "WZ7I"}');

    var inputElems = d3.selectAll("input");

    query = {};
    txtFilter ={};

    function inputChange()  {
        
	//var printError = function(error, explicit) {
        //console.log(`[${explicit ? 'EXPLICIT' : 'INEXPLICIT'}] ${error.name}: ${error.message}`);
	//}    
    	
	if (this.id == 'filtertxt' && this.value != '') {txtFilter = this.value;
       
        qryActive = true; 
	query = JSON.parse(txtFilter);  //.mode; //`{${txtFilter}}`;
        
	console.log ('query is ' + query);
	filterdata = data.filter(search, query);
	} else {
        filterdata = data;
        qryActive = false;}

	//function search(data){
  	 // return Object.keys(this).every((key) => data[key] === this[key]);
	//}
    }
   
    function search(data){
          return Object.keys(this).every((key) => data[key] === this[key]);
    }
  
    inputElems.on("change", inputChange);

    d3.timer(function() {
        var now = Date.now();
	x.domain([now - 10 * 6000, now]);
	xG.call(xAxis);
    });
   
    var y = d3.scaleLinear().domain([0,  d3.max(filterdata, d => +d.freq )]).range([height, 0]);
                             
    var yAxis = d3.axisLeft(y)
       .tickSize(-width);
    
    var yG = svg.append("g")
        .attr("class", "axis axis--y")
          .call(yAxis);
    
    var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    svg.selectAll('circle').data(filterdata, d => d.mykey)
          .enter().append('circle')
            .attr('cx', d => x(d.time))
            .attr('cy', d => y(d.freq))
	    .attr('fill-opacity', 0.6)
	    .attr('r', 8)
            .attr('class', d => d.mode)
            .attr("fill", function(d) { return color(d.mode); })
            .on("mouseover", function(d) {
       div.transition()
         .duration(200)
         .style("opacity", 1);
       div.html("dx " + d.dx  + " de " + d.de + " " + d.freq + " " + d.mode) 
         .style("left", (d3.event.pageX - 100) + "px")
         .style("top", (d3.event.pageY - 50) + "px");
       })
     .on("mouseout", function(d) {
       div.transition()
         .duration(500)
         .style("opacity", 0);
       });
	    

    function clean() {

      //if (qryActive == true) {filterdata = data.filter(search, query);}
      //remove oldest matching spot
      var now = new Date();
        var maxAge = new Date(now.getTime() - 60000); 
        if (data.length > 0) {
                if(data[0].time < maxAge) data.shift();
        }
	if (filterdata.length > 0) {
                if(filterdata[0].time < maxAge) filterdata.shift();
        }

    }

    function tick(caller) {
      
      if (qryActive == true) {filterdata = data.filter(search, query);}
      //console.log ('caller ' + caller);
      if (caller != 'timer') {
          //put stuff here that doesnt need to tick on the reg
          console.log('de: ' + spot.de + ' dx:' + spot.dx + ' ' + spot.freq + ' ' + spot.mode);
           
          //lines_string = '';
          //  for (var i = 0; i < data.length; i++){
          //  lines_string = lines_string + '<p>' + data[i].dx + ',' + data[i].freq + ',' + data[i].time + '</p>';
          }
       // $('#log').html(lines_string);

      //update spot rate text
          d3.select("#CW").text("CW " + filterdata.filter(d => d.mode == 'CW').length);
          d3.select("#FT8").text("FT8 " + filterdata.filter(d => d.mode == 'FT8').length);

      // Update y axis 
      y.domain([0, d3.max(filterdata, d => +d.freq )]);
        
      d3.select(".axis.axis--y").transition().duration(1000).ease(d3.easeLinear)
          .call(yAxis);
      
      // Update data
      var updateSel = svg.selectAll("circle")
          .data(filterdata, d => d.mykey);

      // Remove old items
      updateSel.exit().remove();

      // Add new items 
      updateSel.enter().append('circle')
          .attr('cx', d => x(d.time))
          .attr('cy', d => y(d.freq))
          .attr('fill-opacity', 0.6)
          .attr('r', 8)
	  .attr("clip-path", "url(#clip)")
          .attr('class', d => d.mode)
          .attr("fill", function(d) { return color(d.mode); })
          .on("mouseover", function(d) {
       div.transition()
         .duration(200)
         .style("opacity", 1);
       div.html("dx " + d.dx + " de " + d.de + " " + d.freq + " " + d.mode)
         .style("left", (d3.event.pageX - 100) + "px")
         .style("top", (d3.event.pageY - 50) + "px");
       })
     .on("mouseout", function(d) {
       div.transition()
         .duration(500)
         .style("opacity", 0);
       });
      // Transition Selections
      updateSel //.attr('cx', d=>x(d.time))
          .transition().duration(1000).ease(d3.easeLinear)
	  .attr('cx', d => x(d.time))
	  .attr('cy', d => y(d.freq));
    }
}); 
