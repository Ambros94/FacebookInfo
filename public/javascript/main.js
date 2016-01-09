$(function () {

    // redraw wordCloud
    $("#wordCloud").click(function () {
        drawWordCloud();
    })

    drawGraph(".chart");

    //deal show full screen images
    $(".bestPicture").click(function () {
        $(".backgroundOpacity").html("<img class='fullscreen' src='https://scontent-frt3-1.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/255304_386798028040133_63815419_n.jpg?oh=7f3f8b09dbaedbbbeeeae31ee3de999e&oe=5719C33F'>");
        $(".backgroundOpacity").css("display", "block");
    });

    $(".profilePic").click(function () {
        $(".backgroundOpacity").html("<img class='fullscreen' src='https://scontent-frt3-1.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/255304_386798028040133_63815419_n.jpg?oh=7f3f8b09dbaedbbbeeeae31ee3de999e&oe=5719C33F'>");
        $(".backgroundOpacity").css("display", "block");
    });

    $("#firstPic .podiumPic").click(function () {
        $(".backgroundOpacity").html("<img class='fullscreen' src='https://scontent-frt3-1.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/255304_386798028040133_63815419_n.jpg?oh=7f3f8b09dbaedbbbeeeae31ee3de999e&oe=5719C33F'>");
        $(".backgroundOpacity").css("display", "block");
    });

    $("#secondPic .podiumPic").click(function () {
        $(".backgroundOpacity").html("<img class='fullscreen' src='https://scontent-frt3-1.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/255304_386798028040133_63815419_n.jpg?oh=7f3f8b09dbaedbbbeeeae31ee3de999e&oe=5719C33F'>");
        $(".backgroundOpacity").css("display", "block");
    });

    $("#thirdPic .podiumPic").click(function () {
        $(".backgroundOpacity").html("<img class='fullscreen' src='https://scontent-frt3-1.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/255304_386798028040133_63815419_n.jpg?oh=7f3f8b09dbaedbbbeeeae31ee3de999e&oe=5719C33F'>");
        $(".backgroundOpacity").css("display", "block");
    });

    $(".backgroundOpacity").click(function () {
        if ($(".backgroundOpacity").css("display") == "block") {
            $(".fullscreen").remove();
            $(".backgroundOpacity").css("display", "none");
        }
    })

    //deal with friends like count table on home page
    drawFriendsTable();

    //deal with realod button, top right of the screen
    $("#reload").click(function () {
        switch ($(".nav-pills li.active").attr("id")) {
            case "personalInfo":
                break;
            case "wordCloud":
                drawWordCloud();
                break;
            case "feedAnalysis":
                break;
            case "loadedPhotos":
                break;
            case "taggedPhotos":
                break;
            default:
                break;
        }
    })
})


function drawFriendsTable() {
    $.ajax({
        url: "/getBestFriendTable", success: function (result) {
            for (var i = 0; i < result.data.length; i++) {
                $(".friendLikesCount").append("<tr><td>" + result.data[i].name + "</td><td>" + result.data[i].count + "</td></tr>")
            }
        }
    })


}

function drawBestFriendPic(name) {
    // $("#secondPic .podiumPic").attr("src", TODO );
}

function drawWordCloud() {
    var words = [];
    var wordsWeight = [];
    $.ajax({
        url: "/wordsCloud", success: function (result) {
            for (var i = 0; i < result.data.length; i++) {
                words.push(result.data[i].word);
                wordsWeight.push(result.data[i].count);
            }

            var escapeWords = [];

            var final = [];
            for (i = 0; i < escapeWords.length; i++) {
                for (j = 0; j < words.length; j++) {
                    if (words[j].toLowerCase() === escapeWords[i].toLowerCase()) {
                        words.splice(j, 1);
                        j--;
                    }
                }
            }


            $.each(words, function (i, el) {
                if ($.inArray(el, final) === -1) final.push(el);
            });
            var fill = d3.scale.category20b();
            var rotations = [-60, -30, 0, 30, 60, 90];
            if ($(".wordCloudContainer").children().length > 0) {
                $(".wordCloudContainer").children()[0].remove();
            }
            var layout = d3.layout.cloud()
                .size([$(".tab-content div.active").width() - 54, 800])
                .words(words.map(function (d) {
                    return {text: d, size: 50, test: "haha"};
                }))
                .padding(5)
                .rotate(function () {
                    return rotations[Math.floor(Math.random() * 6)]
                })
                .font("Impact")
                .fontSize(function (d, i) {
                    return d.size * wordsWeight[i];
                })
                .on("end", draw);

            layout.start();

            function draw(words) {
                d3.select(".wordCloudContainer").append("svg")
                    .attr("width", layout.size()[0])
                    .attr("height", layout.size()[1])
                    .append("g")
                    .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function (d) {
                        return d.size + "px";
                    })
                    .style("font-family", "Impact")
                    .style("fill", function (d, i) {
                        return fill(i);
                    })
                    .attr("text-anchor", "middle")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function (d) {
                        return d.text;
                    });
            }

            for (var i = 0; i < result.data.length; i++) {
                $(".wordsCount").append("<tr><td>" + result.data[i].word + "</td><td>" + result.data[i].count + "</td></tr>")
            }

        }
    });


}

function drawGraph(svgClassName) {
    $.ajax({
        url: "/getPlotData", success: function (result) {
            var month = [];
            var data = [];
            for (var key in result.data) {
                month.push(key);
                data.push(result.data[key])
            }


            var margin = {top: 20, right: 40, bottom: 30, left: 40},
                width = 920 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;


            var barWidth = width / data.length;

            var x = d3.scale.ordinal().rangeRoundBands([0, width], -0.3);
            var y = d3.scale.linear().range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(10);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function (d) {
                    return "<strong>Likes count:</strong> <span style='color:white'>" + d + "</span>";
                })

            x.domain(month.map(function (d) {
                return d;
            }));
            y.domain([0, d3.max(data, function (d) {
                return d;
            })]);

            var chart = d3.select(svgClassName)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            chart.call(tip);

            var bar = chart.selectAll("g")
                .data(data)
                .enter().append("g")
                .attr("transform", function (d, i) {
                    return "translate(" + i * barWidth + ",0)";
                });

            bar.append("rect")
                .attr("y", function (d) {
                    return y(d);
                })
                .attr("height", function (d) {
                    return height - y(d);
                })
                .attr("width", barWidth - 1)
                .attr("class", "bar")
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);


            /*
             bar.append("text")
             .attr("text-anchor", "middle")
             .attr("x", barWidth / 2)
             .attr("x", function (d) {
             return x(d) + x.rangeBand() / 2;
             })
             .attr("y", function (d) {
             return y(d) + 3;
             })
             .attr("dy", "-0.5em")
             .attr("dx", "1.7em")
             .text(function (d) {
             return d;
             });
             */
            chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            chart.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("y", -16)
                .attr("x", -40)
                .attr("dy", ".71em")
                .style("text-anchor", "top")
                .text("Number of Likes")
        }

    })


}

