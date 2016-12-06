var width = 960,
    height = 400,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 16, // separation between different-color nodes
    maxRadius = 12;

var info = L.control({
      position: 'topleft'
    });    

var n = 200, // total number of nodes
    m = 3; // number of distinct clusters

var color = d3.scale.category10()
    .range(["#66bd63","#ffbfff","#f46d43"])
    .domain([0,1,2]);

// The largest node for each cluster.
var clusters = new Array(m);

var tweets = [
  {"text":"grande0","score":0},
  {"text":"pequeño0","score":0},
  {"text":"grande3","score":0},
  {"text":"pequeño3","score":0},
  {"text":"pequeño2","score":0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"pequeño2","score":0.3},
  {"text":"pequeño2","score":-0.3},
  {"text":"grande2","score":0}
];

createForceChart(createNodes(tweets));


function createForceChart(nodes) {
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<span>" + d.text + "</span>";
    })

  var force = d3.layout.force()
      .nodes(nodes)
      .size([width, height])
      .gravity(.02)
      .charge(0)
      .on("tick", tick)
      .start();

  var svg = d3.select("#forceChart").append("svg")
      .attr("width", width)
      .attr("height", height);

  var node = svg.selectAll("circle")
      .data(nodes)
    .enter().append("circle")
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .style("fill", function(d) { return color(d.cluster); })      
      .call(force.drag);

  node.transition()
      .duration(750)
      .delay(function(d, i) { return i * 5; })
      .attrTween("r", function(d) {
        var i = d3.interpolate(0, d.radius);
        return function(t) { return d.radius = i(t); };
      });
  function tick(e) {
    node
        .each(cluster(10 * e.alpha * e.alpha))
        .each(collide(.5))
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

  // Move d to be adjacent to the cluster node.
  function cluster(alpha) {
    return function(d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }
  svg.call(tip);
}

$.getJSON("https://mvanegas10.github.io/javeandes-hackathon/docs/colombia.json",function(colombia){  
  colombia.features.forEach(function (d) {
    d.properties.indicator = Math.random();
  })
  var map = L.map('map', { zoomControl:false }).setView([4, -73.5], 5.5);
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    info.addTo(map);

  var layer = L.geoJson(colombia, {
    clickable: true,
    style: function(feature) {
      return {
        stroke: true,
        color: "#0d174e",
        weight: 1,
        fill: true,
        fillColor: setColor(feature.properties.indicator),
        fillOpacity: 1
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function(d) {
          info.update({"Departamento": d.target.feature.properties.NOMBRE_DPT, "Indicador": Math.round(d.target.feature.properties.indicator*100)/100});
        },
        mouseout: function(d) {
          info.update({"":""});
        }        
      })
    }
}).addTo(map);
});

// Get to get the topic
function sendTopic(type) {
  if (type === "tweets") createForceChart(createNodes(tweets));
  else {
    console.log("Ask for " + type);
    $.ajax({
      type: "POST",
      data: "{\"word\":\"" + type + "\"}",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "http://pyjaveandes.mybluemix.net/get_tweets"
      }).then(function(data) {  
        console.log(data);
        createForceChart(createNodes(data.result));
        // createForceChart(createNodes(tweets));
    });
  }
}

function createNodes(data) {
  var nodes = [];
  data.forEach(function(dat) {
    dat.score = + dat.score;
    var i = (dat.score < 0)? 0: (dat.score === 0)? 1: 2,
      r = ((dat.score) === 0)? 7: Math.sqrt((i + 1) / m * -Math.log(Math.abs(dat.score))) * maxRadius + 7,
      d = {
        text: dat.text,
        cluster: i,
        radius: r,
        x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
        y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
      };
    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
    nodes.push(d);
  });
  d3.select("#forceChart").html("");
  d3.select("#forceChart").selectAll("*").remove();  
  console.log(nodes);
  return nodes;
} 

function setColor(indicator) {
  if (indicator < 0.1) return "#fff7f3";  
  else if (indicator < 0.2) return "#fde0dd";  
  else if (indicator < 0.3) return "#fcc5c0";  
  else if (indicator < 0.4) return "#fa9fb5";  
  else if (indicator < 0.5) return "#f768a1";  
  else if (indicator < 0.6) return "#dd3497";  
  else if (indicator < 0.7) return "#ae017e";  
  else if (indicator < 0.8) return "#7a0177";  
  else if (indicator < 0.9) return "#49006a";  
}

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // --> info refers to the CSS style to apply to the new object
    this.update();
    return this._div;
};

info.update = function(props) {
    var infoString = '<h4> Datos </h4>';
    for (var item in props) {
        infoString += '<b>' + item + '</b> ' + props[item] + '</b> <br />';
    }

    this._div.innerHTML = infoString;
};

// ------------------------------------------ //
// --------------  ANGULAR  ----------------- //
// ------------------------------------------ //

(function () {
  var app = angular.module('visualization',[]);

  app.controller('selectionController', function(){
    var _this = this;
    _this.selection;
    _this.options = [
      {"id":0,"name":"tweets"},
      {"id":0,"name":"Salud"},
      {"id":1,"name":"Enfermedad"},
      {"id":2,"name":"EPS"},
      {"id":3,"name":"Ministerio de Salud"}
    ];
    _this.getTweets = getTweets;

    function getTweets(){
      console.log("Selected: " + _this.selection);
      sendTopic(_this.selection);
    }
  });
})();