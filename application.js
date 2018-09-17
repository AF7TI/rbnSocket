// my dev socket server lacks a cert so you may need to click thru to see chart
// use d3 to display real-time data from reversebeacon network. see application.py for server side

var data = [];
var color = d3.scaleOrdinal()
    .domain(["CW", "FT8"])
    .range(["#377eb8","#4daf4a"]);
var filterdata = data; //= data;
var filterdata2 = []; // = data;
var qryActive = false;
var query;
const parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
var focus, context;
var paused = false;
var brushing = false;

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
        var band = '';
        if (7000 < freq && freq < 8000) { band = '40';} else
        if (14000 < freq && freq < 15000) { band = '20';} else
        if (10000 < freq && freq < 11000) { band = '30';} else
        if (3500 < freq && freq < 4000) { band = '80';} else
        if (1800 < freq && freq < 2000) { band = '160';} else
        if (5000 < freq && freq < 6000) { band = '60';} else
        if (18000 < freq && freq < 19000) { band = '17';} else
        if (21000 < freq && freq < 22000) { band = '15';} else
        if (24000 < freq && freq < 25000) { band = '12';} else
        if (28000 < freq && freq < 30000) { band = '10';} else
        if (50000 < freq && freq < 55000) { band = '6';} else
        if (144000 < freq && freq < 149000) { band = '2';} else
        if (222000 < freq && freq < 225000) { band = '1.25';} else
        if (420000 < freq && freq < 450000) { band = '70';} else
        if (902000 < freq && freq < 929000) { band = '33';}
        time = parseDate(new Date().toISOString());
	mode = string[5];
	snr = +string[6];
        speed = string[8];
        cq = string[10];
        ten = string[9];
        spot = {};
	mykey = Date.now() + Math.random(); //Date.now(); //for d3 key function since shifting array modifies index
	spot.de = de, spot.dx = dx, spot.mykey = mykey, spot.time = time,
          spot.freq = +freq, spot.mode = mode, spot.snr = snr, spot.speed = speed, spot.cq = cq,
          spot.ten = ten, spot.band = band;
         
       	//add spot to array if freq is legit
        if (!isNaN(spot.freq) && !isNaN(spot.snr)) {
	    data.push(spot)
            //filterdata.push(spot)
            filterdata2.push(spot)};
 
        tick(caller='newspot'); //as tick is also being called with setInterval need to pass key to tick so we can determine if spot is new to avoid excess logging and stuff
    });

    setInterval(function(){tick(caller='timer')}, 1000); //tick per sec irrespective of socket msg 4 smoothness

    setInterval(clean,20);
    
    var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 110, left: 40},
    margin2 = {top: 430, right: 20, bottom: 30, left: 40},
    width = window.innerWidth - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;
 
    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
    
    // zoom effect
    var zoom = d3.zoom()
        .scaleExtent([1,8096])
        .extent([[0, 0], [width, height]])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    // zoom panel
    var zoomRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        //.on("mousemove", mousemove)
        .call(zoom);
        //.call(zoom.transform, d3.zoomIdentity); 
 
    //Mike Bostock "If you want a real-time axis, you probably don't want transitions
    //Instead, use d3.timer and redraw the axis with every tick."
    
    var x = d3.scaleTime().range([0, width]);
    var x2 = d3.scaleTime().range([0, width]);

    var xAxis = d3.axisBottom(x);
    var xAxis2 = d3.axisBottom(x2);
    
    var y = d3.scaleLinear().domain([0,  d3.max(filterdata, d => +d.freq )]).range([height, 0]);
    var y2 = d3.scaleLinear().domain([0,  d3.max(filterdata2, d => +d.freq )]).range([height2, 0]);

    var yAxis = d3.axisLeft(y)
       .tickSize(-width);

    var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);
   
    var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

   
    focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

      context.append("g")
      .attr("class", "axis axis--x2")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

      context.append("g")
      .attr("class", "brush")
      //.on("brush end", brushed);
      .call(brush)
      .call(brush.move, x.range());
 
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
	.text(' Filter uses JSON format. Options are dx, de, band, mode, freq, cq. Ex: 20m band and CW mode: {"mode" : "CW", "band" : "20"} . Only show beacons: {"cq" : "BEACON"} . \n Filter by FT8 and DX  {"mode" : "FT8", "dx" : "AF7TI"} . \n Filter by FT8, DX and DE {"mode": "FT8", "dx" : "AF7TI", "de" : "WZ7I"} ');

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
        
	if (paused == true) { // && qryActive == true) {filterdata = filterdata2.filter(search, query);}
        filterdata = filterdata2.filter(search, query);}
        else {filterdata = data.filter(search, query);}
	} else {
        filterdata = data;
        qryActive = false;}
    }
   
    function search(data){
          return Object.keys(this).every((key) => data[key] === this[key]);
    }
  
    inputElems.on("change", inputChange);

    d3.timer(function() {
        if (paused == true)  return;
        var now = Date.now();
        x.domain([now - 10 * 6000, now]);
	//x2.domain([now - 10 * 12000, now]);
        x2.domain(d3.extent(filterdata2, d => d.time)).nice();
        focus.select(".axis--x").call(xAxis);
        context.select(".axis--x2").call(xAxis2); //focus.call(xAxis);
    });
   
   
    var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    function clean() {

      //remove oldest matching spot
      var now = new Date();
        var maxAge = new Date(now.getTime() - 60000); //1 minute realtime window 
        var maxAge2 = new Date(now.getTime() - 120000); //2 minute pause window
        if (data.length > 0) {
                if(data[0].time < maxAge) data.shift(); //data must be as old as longest
        }
	if (paused === true) return;
       // if (filterdata.length > 0) {
        //        if(filterdata[0].time < maxAge2) filterdata.shift();
       // }
       if (filterdata2.length > 0) {
                if(filterdata2[0].time < maxAge2) filterdata2.shift();
        } 
    }

    function tick(caller) {
      
      //if (caller != 'timer') {
      d3.select("#pause").on("change", function() {
        paused = d3.select(this).property("checked");
      });
      
      if (paused == true && qryActive == true) {filterdata = filterdata2.filter(search, query);}
      if (paused == false && qryActive == true) {filterdata = data.filter(search, query);} 
      if (paused == true && qryActive == false) {filterdata = filterdata2;} 
      if (paused == false && qryActive == false) {filterdata = data;}
          //console.log('de: ' + spot.de + ' dx:' + spot.dx + ' ' + spot.freq + ' ' + spot.mode);
           
          //lines_string = '';
          //  for (var i = 0; i < data.length; i++){
          //  lines_string = lines_string + '<p>' + data[i].dx + ',' + data[i].freq + ',' + data[i].time + '</p>';
         // }
       // $('#log').html(lines_string);

      if (caller == 'timer') { //update spot rate text
          d3.select("#CW").text("CW " + filterdata.filter(d => d.mode == 'CW').length);
          d3.select("#FT8").text("FT8 " + filterdata.filter(d => d.mode == 'FT8').length);
      }

      if (paused !=true)
      {
      // Update y axis add space to avoid cutting off circles
      y.domain([0, d3.max(filterdata, d => +d.freq ) * 1.25 ]);
      y2.domain(y.domain());
      }

      d3.select(".axis.axis--y").transition().duration(750).ease(d3.easeLinear)
          .call(yAxis);

      // Update data
      var circle = focus.selectAll("circle")
          .data(filterdata, d => d.mykey);
      
      // Remove old items
      circle.exit().remove();
      
      var snrs = filterdata.map( function(d) { return d.snr });

      var radius = d3.scaleSqrt().domain([Math.min(...snrs),Math.max(...snrs)]).range([4, 8]);
 
      var draw = function(selection) {
            if (typeof yz != 'undefined') {
                selection
                    .attr('cx', d => x(d.time))
                    .attr('cy', d => yz(d.freq));}
        };

      //Add new items 
      circle.enter().append("circle")
          .attr('cx', d => x(d.time))
          .attr('cy', d => y(d.freq))
          .attr('fill-opacity', 0.6)
          .attr('r', function(d) {
            return radius(d.snr);
            })
	  .attr("clip-path", "url(#clip)")
          .attr('class', d => d.mode)
          .attr("fill", function(d) { return color(d.mode); })
          .on("mouseover", function(d) {
	       div.transition()
		 .duration(200)
		 .style("opacity", 1);
	       div.html("dx " + d.dx  + " de " + d.de + " " + d.freq + " " + d.mode + " " + d.snr + "db" + " " + d.cq + " " + d.speed)
		 .style("left", (d3.event.pageX - 100) + "px")
		 .style("top", (d3.event.pageY - 50) + "px");
	   })
	  .on("mouseout", function(d) {
	       div.transition()
		 .duration(500)
		 .style("opacity", 0);
	  })
          .transition().duration(0).call(draw);
       
      // Transition Selections
      if (typeof yz != 'undefined') {
      circle 
          .transition().duration(1000).ease(d3.easeLinear)
          .attr('cx', d => x(d.time))
          .attr('cy', d => yz(d.freq));}
      else {circle
          .transition().duration(1000).ease(d3.easeLinear)
          .attr('cx', d => x(d.time))
          .attr('cy', d => y(d.freq));
      }
    }

    function zoomed() {
        zoomedOnce = true;
        //if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        //xz = d3.event.transform.rescaleX(x);
        yz = d3.event.transform.rescaleY(y);
        //axis zoom
        //xGroup.call(xAxis.scale(xz));
        focus.select(".axis--y").call(yAxis.scale(yz));

        d3.selectAll(".circle")
            .attr("transform", d3.event.transform);
            //.attr('cx', d => x(d.time))
            //.attr('cy', d => yz(d.freq));
    }

    function brushed() {
          brushing = true;
          var s = d3.event.selection;
	  x.domain(s.map(x2.invert, x2));
	  
	  focus.selectAll(".circle") 
              .attr('cx', d => x(d.time))
              .attr('cy', d => yz(d.freq));
	  
	  focus.select(".axis--x").call(xAxis);
	  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
	      .scale(width / (s[1] - s[0]))
	      .translate(-s[0], 0));
          brushing = false;
    }
}
); 
