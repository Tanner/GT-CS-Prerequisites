d3.tsv("data/CS.tsv", function(error, cs) {
  console.log(cs);

  var links = [];
  var nodes = {};

  // Compute the distinct nodes from the links.
  var preReqRegex = /[A-Z]* [0-9]{4}/g;

  cs.forEach(function(course) {
    var course_number = course["Course"];
    var preReqs = course["Prerequisites"].match(preReqRegex);

    if (preReqs == null || preReqs.length == 0) {
      return;
    }

    for (var i = 0; i < preReqs.length; i++) {
      var req = preReqs[i];
      var link = {};

      link.source = nodes[req] || (nodes[req] = {name: req});
      link.target = nodes[course_number] || (nodes[course_number] = {name: course_number});
      
      links.push(link);
    }
  });

  var width = 960,
      height = 500;

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([width, height])
      .linkDistance(60)
      .charge(-300)
      .on("tick", tick)
      .start();

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.append("defs")
      .append("marker")
      .attr("id", "marker")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 19)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5");

  var link = svg.selectAll(".link")
      .data(force.links())
    .enter().append("line")
      .attr("class", function(d) { return "link "; })
      .attr("marker-end", function(d) { return "url(#marker)"; });

  var node = svg.selectAll(".node")
      .data(force.nodes())
    .enter().append("g")
      .attr("class", "node")
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .call(force.drag);

  node.append("circle")
      .attr("r", 8);

  node.append("text")
      .attr("x", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  function tick() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }
});

function mouseover() {
  d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 16);
}

function mouseout() {
  d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 8);
}