/* Written by Brian Lee & Sean Stephens */

var width = 920, height = 600;
var path = d3.geo.path();
var zoomScale = d3.behavior.zoom()
	.scaleExtent([1,10])
	.on("zoom", zoomControl);
var map = d3.select("#svg_map").append("g");


function layout_set() {
	var width_size = $(window).width();

	if (width_size <= 920) {
		$("#svg_map").css({width:width_size});
	}
	else {
		$("#svg_map").css({width:"920"});

		if (width_size > 1372) {
			var x = $("#svg_lp1").position().left;
			var y = $("#svg_lp1").position().top + 300;
			if (y > 1700) { y = 382; }
			$("#svg_lp2").css({position:"absolute", left:x, top:y});
		}
		else {
			$("#svg_lp2").css({position:"static"});
			console.log($("#svg_lp2").position().top);
		}
	}
}

function init_water() {
	layout_set();
	
	$(window).resize(function(){
		layout_set();
	});
	

	d3.json("ctrl/dat/us.json", function(topo) {
		d3.json("ctrl/dat/countycodes.json", function(codes) {
			d3.json("ctrl/dat/Medianhouseholdincome2005.csv", function(data) {
		
				var keys = d3.keys(data);
				var values = d3.values(data).map(function(d){ return Number(d); });
				var max = d3.max(values);
				var colorScale = d3.scale.linear().domain([0, max]).range(["white", "blue"]);
				
				map.selectAll("path")
					.data(topojson.feature(topo, topo.objects.counties).features)
					.enter().append("path")
					.attr({class:"county", d:path})
					.on("click", clicked)
					.style("fill", function(d) {
						var nId = Number(d.id);
						var t = codes[nId];
						if (t) { return colorScale(data[codes[nId].key]); }
					})
					.call(zoomScale);
					
				map.append("path")
					.datum(topojson.mesh(topo, topo.objects.land))
					.attr({class:"us", d:path});
					
				map.append("path")
					.datum(topojson.mesh(topo, topo.objects.states, function(a,b){ return a !== b; }))
					.attr({class:"state", d:path});
			});
		});
	});
}

function zoomControl(){
	map.attr({transform:"translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")"});
}

var centered;

function clicked(d){
	var x, y, k;	// x: center-x, y:center-y, k:zoom
	
	// If no path is selected
	if (d && centered !== d) { // d can be omitted. 
		var center = path.centroid(d);	// centroid will extract the location of the center.
		x = center[0];	// center will have a [x-value, y-value] type.
		y = center[1];
		k = 6;			// zoom
		centered = d;	// Temporarily will save the current position.
	}
	else {	// If a selected path is zoomed already
		x = width / 2;
		y = height / 2;
		k = 1;
		centered = null;
	}
	
	map.transition()
		.duration(500)
		.attr({transform:"translate(" + width / 2 + "," + height / 2 + ")scale(" + k + 
		") translate(" + -x + "," + -y + ")"});
	
	map.selectAll("path")
		.classed("active", centered && function(d){ return d === centered; });
}