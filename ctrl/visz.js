/* Written by Brian Lee & Sean Stephens */

var width = 920, height = 600;
var path = d3.geo.path();
var zoomScale = d3.behavior.zoom()
	.scaleExtent([1,10])
	.on("zoom", zoomControl);

function layout_set() {
	var width_size = $(window).width();

	if (width_size <= 920) {
		$("#svg_map").css({width:width_size});
	}
	else {
		$("#svg_map").css({width:"920"});
	}
}

function zoomControl(){
  map.attr({transform:"translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")"});
}

var centered;

function clicked(d){
  var x, y, k;  // x: center-x, y:center-y, k:zoom
  
  // If no path is selected
  if (d && centered !== d) { // d can be omitted. 
    var center = path.centroid(d);  // centroid will extract the location of the center.
    x = center[0];  // center will have a [x-value, y-value] type.
    y = center[1];
    k = 6;      // zoom
    centered = d; // Temporarily will save the current position.
  }
  else {  // If a selected path is zoomed already
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

function init_birth() { load_file('birthList.json'); }
function init_unemp() { load_file('unempList.json'); }
function init_income() { load_file('incomeList.json'); }

function load_file(fname) {

  var stateAbbrevToFIPS = {
    "AL":"1",
    "AK":"2",
    "AZ":"4",
    "AR":"5",
    "CA":"6",
    "CO":"8",
    "CT":"9",
    "DE":"10",
    "FL":"12",
    "GA":"13",
    "HI":"15",
    "ID":"16",
    "IL":"17",
    "IN":"18",
    "IA":"19",
    "KS":"20",
    "KY":"21",
    "LA":"22",
    "ME":"23",
    "MD":"24",
    "MA":"25",
    "MI":"26",
    "MN":"27",
    "MS":"28",
    "MO":"29",
    "MT":"30",
    "NE":"31",
    "NV":"32",
    "NH":"33",
    "NJ":"34",
    "NM":"35",
    "NY":"36",
    "NC":"37",
    "ND":"38",
    "OH":"39",
    "OK":"40",
    "OR":"41",
    "PA":"42",
    "RI":"44",
    "SC":"45",
    "SD":"46",
    "TN":"47",
    "TX":"48",
    "UT":"49",
    "VT":"50",
    "VA":"51",
    "WA":"53",
    "WV":"54",
    "WI":"55",
    "WY":"56"
  }
  
  function buildMap(svg, topo) {
    var path = d3.geo.path().projection(
        d3.geo.equirectangular().scale(750).center([-90,45])
        );
  
    var projection = path.projection();
    var long1 = projection.invert([0, 0])[0];
    var long2 = projection.invert([mWidth, 0])[0];
    var lat1 = projection.invert([0, 0])[1];
    var lat2 = projection.invert([0, mHeight])[1];
  
    var brush = d3.svg.brush()
                  .x(d3.scale.linear().domain([long1, long2]).range([0,mWidth]))
                  .y(d3.scale.linear().domain([lat1, lat2]).range([0, mHeight]))
                  .on("brush", brushmove)
                  .on("brushend", brushend);
  
    function brushmove(p) {
      var e = brush.extent();
      var selected = {}
      svg.selectAll(".mstate").classed('selectedState', function(d) {
        var coords = _.flatten(_.flatten(d.geometry.coordinates, true), true);
        var inc = _.filter(coords, function(x) {
          return x[0] > e[0][0] && x[0] < e[1][0] && x[1] > e[0][1] && x[1] < e[1][1];
        });
        if(inc.length > coords.length/2 ) {
          selected[d.id] = 1;
          return 1;
        } else {
          return 0;
        }
      });
      svg.selectAll('.mcounty').classed('unselectedByMap', function(d) {
        var n = String(d.id);
        if(n.length === 5) {
          n = n.substring(0,2);
        } else if(n.length === 4) {
          n = n.substring(0,1);
        }
        return !selected[n];
      });
      d3.selectAll('.dataPath').classed('unselectedByMap', function(x) {
        var l = x.name.length;
        x = x.name.substring(l-2, l);
        x = stateAbbrevToFIPS[x];
        return !selected[x];
      }).classed('selected', true);
    }
  
    function brushend() {
      if(brush.empty()) {
        d3.selectAll(".dataPath").classed('unselectedByMap', false);
        d3.selectAll(".mcounty").classed('unselectedByMap', false);
        d3.selectAll(".mstate").classed('selectedState', false);
      }
    }
  
    svg = svg.append("g").call(brush);
    console.log(svg);

    svg.selectAll("path")
      .data(topojson.feature(topo, topo.objects.counties).features)
      .enter().append("path")
      .classed('mcounty', true)
      .attr('d', path);
    
    svg.append("path")
      .datum(topojson.mesh(topo, topo.objects.land))
      .classed('us', true)
      .attr('d', path);
      
    svg.selectAll(".mstate")
      .data(topojson.feature(topo, topo.objects.states).features)
      .enter()
      .append('path')
      .classed('mstate', true)
      .attr('d', path);
  }


  d3.select("#svg_map").selectAll('*').remove();
  d3.select("#svg_lp1").selectAll('*').remove();

  var svg = d3.select("#svg_map");
  svg.selectAll('*').remove();
  var mWidth = svg.attr("width"), mHeight = svg.attr("height");
  //svg = svg.append("g");
  
  // Load reference data
  var topo, codes, stateMap;
  queue()
    .defer(d3.json, "ctrl/dat/us.json")
    .defer(d3.json, "ctrl/dat/fixed_ugc.json")
    .defer(d3.json, 'ctrl/dat/statecodes.json')
    .await(function(errors, _topo, _codes, _stateMap) {
      if(errors) console.log(errors);
      topo = _topo;
      codes = _codes;
      stateMap = _stateMap;
      console.log('reference data loaded');
    });
  
  function colorMap(svg, data) {
   var keys = d3.keys(data);
   var values = d3.values(data).map(function(d){ return Number(d); });
   
   var max = d3.max(values);
   var waterScale = d3.scale.linear().domain([0, max]).range(["white", "blue"]);
   svg.selectAll('.mcounty').style('fill', function(d) {
     return waterScale(data[codes[d.id].key]);
   });
  }
  
  // Load data
  queue().defer(d3.json, 'ctrl/dat/' + fname).await(function(error, fileList) {
    if(error) { console.log(error); }
  
    function deferAll(files, callback) {
      var q = queue();
      for(var i = 0; i < files.length; i++) {
        q.defer(d3.json, 'ctrl/dat/' + files[i]);
      }
      q.awaitAll(callback);
    }
  
    deferAll(fileList.countyFiles, processCountyFiles);
    deferAll(fileList.mapFiles, function(errors, datas) {
      if(errors) { console.log(errors); }
      var data = datas[0];
      buildMap(svg, topo);
      colorMap(svg, data);
    });
  });
  
  function processCountyFiles(errors, datas) {
    if(errors) { console.log(errors); }
    
    var v = Object.keys(datas[0]);
  
    var data = [];
    for(var i = v.length - 1; i >= 0; i--) {
      var o = [];
      var index = v[i];
      for(var j = datas.length - 1; j >= 0; j--) {
        o.push([1990 + j, Number(datas[j][index])]);
      }
      data.push({name: v[i], data:o});
    }
  
    lineplot(data, '#svg_lp1'); 
  }
  
  // Finally...
  function lineplot(data, svgId) {
    var svg = d3.select(svgId);
  
    var w = 600, h = 600;
    var topMargin = 50, botMargin = 40, rightMargin = 0; leftMargin = 50;
    var wStart = leftMargin, wEnd = w - rightMargin;
    var hEnd = topMargin, hStart = h - botMargin;
  
    svg.selectAll('path').remove();
    svg.selectAll('.axis').remove();
    var xMin = d3.min(data, function(d) { 
      return d3.min(d.data, function(e) { return e[0] });
    });
    var xMax = d3.max(data, function(d) { 
      return d3.max(d.data, function(e) { return e[0] });
    });
    var xExtent = [xMin, xMax];
  
    var yMin = d3.min(data, function(d) { 
      return d3.min(d.data, function(e) { return e[1] });
    });
    var yMax = 2 * d3.max(data, function(d) { 
      return d3.mean(d.data, function(e) { return e[1] });
    });
    var yExtent = [yMin, yMax];
  
    var xscale = d3.scale.linear().domain(xExtent).range([wStart,wEnd]);
    var yscale = d3.scale.linear().domain(yExtent).range([hStart,hEnd]);
    var xaxis = d3.svg.axis().scale(xscale).orient("bottom");
    var yaxis = d3.svg.axis().scale(yscale).orient("left");
  
    var map = d3.select('#svg_map');
    var brush = d3.svg.brush()
                  .x(xscale)
                  .y(yscale)
                  .on("brush", brushmove)
                  .on("brushend", brushend);
    function brushmove(p) {
      var e = brush.extent();
      var selected = {}
      svg.selectAll(".dataPath").classed('unselectedByLine', function(d) {
          var sel = _.filter(d.data, function(x) {  
            return x[0] > e[0][0] && (x[0] < e[0][0] + 1 || x[0] < e[1][0]);
          });
          var sel2 = _.filter(sel, function(x) {  
            return x[1] > e[0][1] && x[1] < e[1][1]; 
          });
          if(sel2.length == sel.length) {
            selected[d.name] = 1;
            return false;
          } else {
            return true;
          }
      });
      map.selectAll('.mcounty').classed('unselectedByLine', function(d) {
        return !selected[codes[d.id].key];
      });
    }
    function brushend() {
      if (brush.empty()) {
        d3.selectAll(".dataPath").classed('unselectedByLine', false);
        map.selectAll(".mcounty").classed('unselectedByLine', false);
      }
    }
    svg = svg.append("g").call(brush);
  
    var line = d3.svg.line()
        .x(function(d) { return xscale(d[0]) })
        .y(function(d) { return yscale(d[1]) });
  
    var lines = svg.selectAll("path").data(data).enter().append("path")
                   .classed("dataPath", true)
                   .attr("d", function(d) { return line(d.data); })
  
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + String(hStart + 10) + ")")
        .call(xaxis);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + String(wStart - 10) + ", 0)")
        .call(yaxis);
  }

}

