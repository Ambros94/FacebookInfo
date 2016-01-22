/**
 * Created by n0skill on 11.01.16.
 */
$(function(){

    //hide dots gif if window height is to small
    $( window ).resize(function() {
        console.log($(window).height());
        if($(window).height() < 300){
            $("#gif").hide();
        }
    });


    /////////////////////////////////////////////
    //////////////// D3 Collision ///////////////
    /////////////////////////////////////////////

    //get client width and height
    var width = d3.select("#container").node().getBoundingClientRect().width-30
    var height = $(document).height();

    //create nodes obj which stores radius balls informations
    var nodes = d3.range(300).map(function () {
            return {radius: Math.random() * 12 + 4};
        }),
        root = nodes[0],
        color = d3.scale.category20c();

    root.radius = 0;
    root.fixed = true;


    // set gravity force to our nodes
    // light radius is the area around the mouse pointer in which balls are rejected
    var lightRadius = -1500;
    var force = d3.layout.force()
        .gravity(0.06)
        .charge(function (d, i) {
            return i ? 0 : lightRadius;
        })
        .nodes(nodes)
        .size([width, height]);

    force.start();

    //append a new svg to the page
    var svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svg");

    //draw circle getting data from nodes array.
    svg.selectAll("circle")
        .data(nodes.slice(1))
        .enter().append("circle")
        .attr("r", function (d) {
            return d.radius;
        })
        .style("fill", function (d, i) {
            return color(i % 3);
        });

    // handle collision and move all the circles
    force.on("tick", function (e) {
        var q = d3.geom.quadtree(nodes),
            i = 0,
            n = nodes.length;

        while (++i < n) q.visit(collide(nodes[i]));

        svg.selectAll("circle")
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
    });

    //move the root accordint to the current mouse position
    svg.on("mousemove", function () {
        var p1 = d3.mouse(this);
        root.px = p1[0];
        root.py = p1[1];
        force.resume();
    });

    //detect collision from circles and arrange them
    function collide(node) {
        var r = node.radius + 16,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r;
        return function (quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== node)) {
                var x = node.x - quad.point.x,
                    y = node.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = node.radius + quad.point.radius;
                if (l < r) {
                    l = (l - r) / l * .5;
                    node.x -= x *= l;
                    node.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
    }

})

