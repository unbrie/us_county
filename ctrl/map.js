'use strict'

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
  var longs = [];
  var lats = [];
  var r1 = [], r2 = [];
  for(var i = 0; i <= width; i += width/100) {
    longs.push(projection.invert([i, 0])[0]);
    r1.push(i);
  }
  for(var i = 0; i <= height; i += height/100) {
    lats.push(projection.invert([0, i])[1]);
    r2.push(i);
  }
  var long1 = projection.invert([0, 0])[0];
  var long2 = projection.invert([width, 0])[0];
  var lat1 = projection.invert([0, 0])[1];
  var lat2 = projection.invert([0, height])[1];

  var brush = d3.svg.brush()
                .x(d3.scale.linear().domain([long1, long2]).range([0,width]))
                .y(d3.scale.linear().domain([lat1, lat2]).range([0, height]))
  //              .x(d3.scale.linear())
   //             .y(d3.scale.linear())
                .on("brush", brushmove)
                .on("brushend", brushend);

  function brushmove(p) {
    var e = brush.extent();
    var selected = {}
    svg.selectAll(".state").classed('selectedState', function(d) {
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
    svg.selectAll('.county').classed('unselectedByMap', function(d) {
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
      d3.selectAll(".county").classed('unselectedByMap', false);
      d3.selectAll(".state").classed('selectedState', false);
    }
  }
  svg = svg.append("g").call(brush);

  var map = svg.selectAll("path")
    .data(topojson.feature(topo, topo.objects.counties).features)
    .enter().append("path")
    .classed('county', true)
    .attr('d', path);
  
  svg.append("path")
    .datum(topojson.mesh(topo, topo.objects.land))
    .classed('us', true)
    .attr('d', path);
    
  svg.selectAll(".state")
    .data(topojson.feature(topo, topo.objects.states).features)
    .enter()
    .append('path')
    .classed('state', true)
    .attr('d', path);

  return map;
}
