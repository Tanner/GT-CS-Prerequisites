d3.tsv("data/CS.tsv", function(error, cs) {
  console.log(cs);

  var links = [];
  var nodes = {};

  var color = d3.scale.category10();

  var courses = {};

  // Parse out prerequisites
  cs.forEach(function(course) {
    var currentCourse = {
      identifier: course["Course"],
      name: course["Course"],
      school: course["Course"].split(' ')[0],
      type: "course",
      requires: []
    }

    // Parse the prerequisite string
    var preReqsString = course["Prerequisites"].split(',');
    var stack = [];

    if (preReqsString.length == 0) {
      return;
    }

    for (var i = 0; i < preReqsString.length; i++) {
      var element = preReqsString[i];

      if (element.length == 0) {
        continue;
      }

      if (element != "&" && element != "|") {
        stack.push({
          identifier: element,
          name: element,
          school: element.split(' ')[0],
          type: "course"
        });

      } else {
        var courseA = stack.pop();
        var courseB = stack.pop();

        if (element == '&') {
          var and = {
            type: "and",
            requires: [ courseA, courseB ]
          }

          stack.push(and);
        } else if (element == '|') {
          if (courseA.type == "or" && courseB.type == "or") {
            var or = courseA;

            or.requires = or.requires.concat(courseB.requires)

            stack.push(or);
          } else if (courseA.type == "or" || courseB.type == "or") {
            var or = courseA;
            var other = courseB;

            if (courseB.type == "or") {
              or = courseB;
              other = courseA;
            }

            or.requires.push(other);

            stack.push(or);
          } else {
            var or = {
              type: "or",
              requires: [courseA, courseB]
            }

            stack.push(or);
          }
        }
      }
    }

    currentCourse.requires = stack;

    courses[new String(currentCourse.identifier)] = currentCourse;
  });

  console.log(courses);

  // Compute the distinct nodes from the links.
  for (var property in courses) {
    var currentCourse = courses[property];
    var requires = currentCourse.requires;

    createLinksForRequirements(currentCourse, currentCourse);
  }

  function createLinksForRequirements(source, course) {
    var courseRequires = course.type == "course" ? course.requires : [course];

    if (courseRequires) {
      for (var i = 0; i < courseRequires.length; i++) {
        var require = courseRequires[i];

        if (require.type == "or") {
          var or = {
            identifier: Math.random() * 1000000,
            name: "or",
            type: "or"
          }

          for (var j = 0; j < require.requires.length; j++) {
            if (require.requires[j].type == "course") {
              links.push(createLink(require.requires[j], or));
            } else {
              createLinksForRequirements(or, require.requires[j]);
            }
          }

          links.push(createLink(or, source));
        } else if (require.type == "and") {
          for (var j = 0; j < require.requires.length; j++) {
            if (require.requires[j].type == "course") {
              links.push(createLink(require.requires[j], source));
            } else {
              createLinksForRequirements(source, require.requires[j]);
            }
          }
        }
      }
    } else {
      links.push(createLink(course, source));
    }
  }

  function createLink(sourceCourse, targetCourse) {
      var link = {};

      link.source = nodes[sourceCourse.identifier] || (nodes[sourceCourse.identifier] = sourceCourse);
      link.target = nodes[targetCourse.identifier] || (nodes[targetCourse.identifier] = targetCourse);

      return link;
  }

  var width = 1500,
      height = 1500;

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([width, height])
      .linkDistance(100)
      .charge(-300)
      .on("tick", tick)
      .start();

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.append("defs")
      .append("marker")
      .attr("id", "marker")
      .attr("class", "marker")
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
      .attr("r", 8)
      .style("fill", function(d) {
        return color(d.school);
      });

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

function createNode(course) {
  return {
    name: course,
    school: course.split(' ')[0]
  }
}

function mouseover() {
  d3.selectAll("circle").transition()
      .duration(400)
      .attr("r", 4);

  d3.select(this).select("circle").transition()
      .duration(400)
      .attr("r", 8);
}

function mouseout() {
  d3.selectAll("circle").transition()
      .duration(400)
      .attr("r", 8);
}