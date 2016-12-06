var width = 650,
    height = 300,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 16, // separation between different-color nodes
    maxRadius = 12;

var info = L.control({
      position: 'topright'
    });    

var n = 200, // total number of nodes
    m = 3; // number of distinct clusters

var color = d3.scale.category10()
    .range(["#f46d43","#ffbfff","#66bd63"])
    .domain([0,1,2]);

// The largest node for each cluster.
var clusters = new Array(m);

var indicadores = [];

var words = [
  {"id":"Cáncer","nombre":"Edad","valor":0.29},
  {"id":"Cáncer","nombre":"Peso","valor":0.23},
  {"id":"Cáncer","nombre":"Ejercicio fuerte","valor":0.20},
  {"id":"Cáncer","nombre":"Dolor general","valor":0.12},
  {"id":"Cáncer","nombre":"Hombre","valor":0.16},
  {"id":"Corazón","nombre":"Problema de pie","valor":0.32},
  {"id":"Corazón","nombre":"Problema de aprendizaje","valor":0.29},
  {"id":"Corazón","nombre":"Problema de caminata larga","valor":0.25},
  {"id":"Corazón","nombre":"Dolor de Espalda","valor":0.10},
  {"id":"Corazón","nombre":"Tranporte saludable","valor":0.04},
  {"id":"Diabetes","nombre":"Glicemia","valor":0.41},
  {"id":"Diabetes","nombre":"Nivel educativo","valor":0.23},
  {"id":"Diabetes","nombre":"Edad","valor":0.19},
  {"id":"Diabetes","nombre":"Presión diastólica","valor":0.10},
  {"id":"Diabetes","nombre":"Recolecciópn de basura","valor":0.08},
  {"id":"Trombósis","nombre":"Edad","valor":0.34},
  {"id":"Trombósis","nombre":"Problema de caminata larga","valor":0.25},
  {"id":"Trombósis","nombre":"Presión sistólica","valor":0.16},
  {"id":"Trombósis","nombre":"Presión diastólica","valor":0.13},
  {"id":"Trombósis","nombre":"Nivel educativo","valor":0.11},
  {"id":"Sida","nombre":"Colesterol","valor":0.38},
  {"id":"Sida","nombre":"Problemas de aprendizaje","valor":0.23},
  {"id":"Sida","nombre":"Levantar objetos pesados","valor":0.16},
  {"id":"Sida","nombre":"Colestrerol no HDL","valor":0.12},
  {"id":"Sida","nombre":"Trigricéridos altos","valor":0.11}
]

var results = [
  {"id":"tweets",
  "objeto":[
    {"nombre":"edad","valor":0.29},
    {"nombre":"peso","valor":0.23},
    {"nombre":"ejercicio fuerte","valor":0.20},
    {"nombre":"dolor general","valor":0.12},
    {"nombre":"hombre","valor":0.16}]},
  {"id":"Cáncer",
  "objeto":[
    {"nombre":"edad","valor":0.29},
    {"nombre":"peso","valor":0.23},
    {"nombre":"ejercicio fuerte","valor":0.20},
    {"nombre":"dolor general","valor":0.12},
    {"nombre":"hombre","valor":0.16}]},
  {"id":"Corazón",
  "objeto":[
    {"nombre":"problema de pie","valor":0.32},
    {"nombre":"problema de aprendizaje","valor":0.29},
    {"nombre":"problema de caminata larga","valor":0.25},
    {"nombre":"dolor de espalda","valor":0.10},
    {"nombre":"tranporte saludable","valor":0.04}]},
  {"id":"Diabetes","objeto":[
    {"nombre":"glicemia","valor":0.41},
    {"nombre":"nivel educativo","valor":0.23},
    {"nombre":"edad","valor":0.19},
    {"nombre":"presión diastólica","valor":0.10},
    {"nombre":"recolecciópn de basura","valor":0.08}]},
  {"id":"Trombósis","objeto":[
    {"nombre":"edad","valor":0.34},
    {"nombre":"problema de caminata larga","valor":0.25},
    {"nombre":"presión sistólica","valor":0.16},
    {"nombre":"presión diastólica","valor":0.13},
    {"nombre":"nivel educativo","valor":0.11}]},
  {"id":"Sida","objeto":[
    {"nombre":"colesterol","valor":0.38},
    {"nombre":"problemas de aprendizaje","valor":0.23},
    {"nombre":"levantar objetos pesados","valor":0.16},
    {"nombre":"colestrerol no HDL","valor":0.12},
    {"nombre":"trigricéridos altos","valor":0.11}]
  }];

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
createBarChart("tweets");

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

function createBarChart(id) {
  var x = [];
  var columns = [];
  results.forEach(function(d) {
    if (d.id.toLowerCase() === id.toLowerCase()) {
      x = d.objeto.map(function(i) {return i.nombre;});
      columns = d.objeto.map(function(i) {return i.valor;});
    }
  });

  if (x.length === 0) {
    words.forEach(function (d) {
      var val = d.nombre.split(" ");
      val.forEach(function (value) {
        if (value.toLowerCase() == id.toLowerCase()) {
          results.forEach(function(h) {
            if (h.id.toLowerCase() === d.id.toLowerCase()) {
              x = h.objeto.map(function(i) {return i.nombre;});
              columns = h.objeto.map(function(i) {return i.valor;});
            }
          });        }
      })
    });
  }

  columns.unshift("Peso de descriptor");

  console.log(x);
  console.log(columns);  

  if (x.length > 1) {
    var chart = c3.generate({
      bindto: '#chart',
      data: {
        columns: [
          columns,
        ],
        type: 'bar'
      },
      axis: {
          x: {
            label: "Descriptor",
            type: 'category',
            categories: x,
          },
          y: {
            label: "Peso del descriptor",
          }          
      },      
      bar: {
          width: {
              ratio: 0.5 
          }
      },
      legend: {
          show: false
      },
      colors: {
        "Peso de descriptor": '#1d91c0',
      },      
    });    
  }
}

d3.csv("https://mvanegas10.github.io/javeandes-hackathon/docs/indicadores.csv", function(err, data) {
  if(err) {
    console.err(err);    
  return;
  }
  
  indicadores= data;
});

$.getJSON("https://mvanegas10.github.io/javeandes-hackathon/docs/colombia.json",function(colombia){  
  colombia.features.forEach(function (d) {
    indicadores.forEach(function (value) {
      value.valor = + value.valor;
      if (d.properties.NOMBRE_DPT.toLowerCase() === value.departamento.toLowerCase()) {
        d.properties.indicator = value.valor;
      }
      else if (d.properties.NOMBRE_DPT.toLowerCase() == "CAQUETA") d.properties.indicator = 7.4;
    })
  })

  console.log(colombia);
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
  if (type === "tweets") {
    createForceChart(createNodes(tweets));
    createBarChart("tweets");
  }
  else {
    console.log("Ask for " + type);
    createBarChart(type);
    $.ajax({
      type: "POST",
      data: "{\"word\":\"" + type.toLowerCase() + "\"}",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "http://pyjaveandes.mybluemix.net/get_tweets"
      }).then(function(data) {  
        console.log(data);
        createForceChart(createNodes(data.result));        
    });
  }
}

function createNodes(data) {
  var nodes = [];
  data.forEach(function(dat) {
    dat.score = + dat.score;
    var i = (dat.score < 0)? 0: (dat.score === 0)? 1: 2,
      r = ((dat.score) === 0)? 10: Math.sqrt((i + 1) / m * -Math.log(Math.abs(dat.score))) * maxRadius + 10,
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
  if (indicator < 1.5) return "#fff7f3";  
  else if (indicator < 3) return "#fde0dd";  
  else if (indicator < 4.5) return "#fcc5c0";  
  else if (indicator < 6) return "#fa9fb5";  
  else if (indicator < 7.5) return "#f768a1";  
  else if (indicator < 9) return "#dd3497";  
  else if (indicator < 10.5) return "#ae017e";  
  else if (indicator < 12) return "#7a0177";  
  else if (indicator < 13.5) return "#49006a";  
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
    _this.selection = "tweets";
    _this.options = [
      {"id":0,"name":"tweets"},
      {"id":0,"name":"Edad"},
      {"id":1,"name":"Peso"},
      {"id":2,"name":"Ejercicio"},
      {"id":3,"name":"Dolor"},
      {"id":3,"name":"Espalda"},
      {"id":3,"name":"Transporte"},
      {"id":3,"name":"Glicemia"},
      {"id":3,"name":"Basura"},
      {"id":3,"name":"Presión"},
      {"id":3,"name":"Colesterol"},
      {"id":3,"name":"Cáncer"},
      {"id":3,"name":"Corazón"},
      {"id":3,"name":"Diabetes"},
      {"id":3,"name":"Trombosis"},
      {"id":3,"name":"Sida"},
    ];
    _this.getTweets = getTweets;

    function getTweets(){
      console.log("Selected: " + _this.selection);
      sendTopic(_this.selection);
    }
  });
})();