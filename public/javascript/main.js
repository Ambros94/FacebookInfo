$(function () {
    home();

    $(".profilePic").click(function () {
        $(".backgroundOpacity").html("<img class='fullscreen' src='https://scontent-frt3-1.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/255304_386798028040133_63815419_n.jpg?oh=7f3f8b09dbaedbbbeeeae31ee3de999e&oe=5719C33F'>");
        $(".backgroundOpacity").css("display", "block");
    });

    //open/close popover on settings button, top right corner
    $('[data-toggle="popover"]').popover({
        placement: 'bottom'
    });


    $(".nav").click(function () {
        activePill = document.elementFromPoint(event.clientX, event.clientY).parentNode.id
        switch (activePill) {
            case "total":
                home();
                break;
            case "wholikesyou":
                whoLikesYouAnalysis();
                $('[data-toggle="popover"]').popover({
                    placement: 'bottom'
                });
                break;
            case "wordscloud":
                drawWordCloud();
                break;
            case "feed":
                getFeedAnalysis();
                drawGraph("/getFeedsAnalysisData", ".feedMonthChart", "periodGroupedLikes", -0.965, -0.9);
                drawGraph("/getFeedsAnalysisData", ".feedHoursChart", "hourGroupedLikes", -0.915, -1.1);
                break;
            case "loaded":
                getUploadedAnalysis();
                drawGraph("/getUploadedAnalysisData", ".loadedMonthChart", "periodGroupedLikes", -0.965, -0.9);
                drawGraph("/getUploadedAnalysisData", ".loadedHoursChart", "hourGroupedLikes", -0.915, -1.1);
                break;
            case "tagged":
                getTaggedAnalysis();
                drawGraph("/getTaggedAnalysisData", ".taggedMonthChart", "periodGroupedLikes", -0.965, -0.9);
                drawGraph("/getTaggedAnalysisData", ".taggedHoursChart", "hourGroupedLikes", -0.915, -1.1);
                break;
            default:
                break;
        }
    })

})

function clamp(min, max, value) {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}

function home() {
    $.ajax({
        url: "/overall", success: function (result) {
            $("#totalLikeCount").html("Total likes count: " + result.data.analysis.likesCount);
            for (key in result.data.analysis.periodGroupedLikes) {
                $(".totalGrouped").append("<tr><td>" + key + "</td><td>" + result.data.analysis.periodGroupedLikes[key] + "</td></tr>")
            }
            for (key in result.data.analysis.hourGroupedLikes) {
                $(".totalHours").append("<tr><td>" + key + "</td><td>" + result.data.analysis.hourGroupedLikes[key] + "</td></tr>")
            }
            drawGraph("/getTotalAnalysisData", ".totalMonthChart", "periodGroupedLikes", -0.965, -0.9);
            drawGraph("/getTotalAnalysisData", ".totalHoursChart", "hourGroupedLikes", -0.915, -1.1);
        }
    })
}


function whoLikesYouAnalysis() {
    $.ajax({
        url: "/overall", success: function (result) {
            $("#firstPic .podiumPic").attr("src", result.data.analysis.likesByPerson[0].profilePhoto);
            $("#secondPic .podiumPic").attr("src", result.data.analysis.likesByPerson[1].profilePhoto);
            $("#thirdPic .podiumPic").attr("src", result.data.analysis.likesByPerson[2].profilePhoto);

            $("#first").attr("href", result.data.analysis.likesByPerson[0].profileLink)
            $("#second").attr("href", result.data.analysis.likesByPerson[1].profileLink)
            $("#third").attr("href", result.data.analysis.likesByPerson[2].profileLink)
            $("#first").click(function () {
                window.location = ($(this).attr("href"))
            })
            $("#second").click(function () {
                window.location = ($(this).attr("href"))
            })
            $("#third").click(function () {
                window.location = ($(this).attr("href"))
            })

            $('.friendTable').on("click", "tr", function () {
                window.location = ($(this).attr("data-href"))
            });

            for (var i = 0; i < result.data.analysis.likesByPerson.length; i++) {
                $(".friendLikesCount").append("<tr data-href='" + result.data.analysis.likesByPerson[i].profileLink + "'><td>" + result.data.analysis.likesByPerson[i].name + "</td><td>" + result.data.analysis.likesByPerson[i].count + "</td></tr>")
            }


        }
    })
}

function getFeedAnalysis() {
    $.ajax({
        url: "/getFeedsAnalysisData", success: function (result) {
            $("#feedLikeCount").html("Feed likes count: " + result.data.likesCount)
            for (key in result.data.periodGroupedLikes) {
                $(".feedGrouped").append("<tr><td>" + key + "</td><td>" + result.data.periodGroupedLikes[key] + "</td></tr>")
            }
            for (key in result.data.hourGroupedLikes) {
                $(".feedHours").append("<tr><td>" + key + "</td><td>" + result.data.hourGroupedLikes[key] + "</td></tr>")
            }
        }
    })
}

function getUploadedAnalysis() {
    $.ajax({
        url: "/getUploadedAnalysisData", success: function (result) {
            $("#loadedLikeCount").html("Uploaded photos likes count: " + result.data.likesCount)
            for (key in result.data.periodGroupedLikes) {
                $(".loadedGrouped").append("<tr><td>" + key + "</td><td>" + result.data.periodGroupedLikes[key] + "</td></tr>")
            }
            for (key in result.data.hourGroupedLikes) {
                $(".loadedHours").append("<tr><td>" + key + "</td><td>" + result.data.hourGroupedLikes[key] + "</td></tr>")
            }
        }
    })
}

function getTaggedAnalysis() {
    $.ajax({
        url: "/getTaggedAnalysisData", success: function (result) {
            $("#taggedLikeCount").html("Tagged photos likes count: " + result.data.likesCount)
            for (key in result.data.periodGroupedLikes) {
                $(".taggedGrouped").append("<tr><td>" + key + "</td><td>" + result.data.periodGroupedLikes[key] + "</td></tr>")
            }
            for (key in result.data.hourGroupedLikes) {
                $(".taggedHours").append("<tr><td>" + key + "</td><td>" + result.data.hourGroupedLikes[key] + "</td></tr>")
            }
        }
    })
}

function drawWordCloud() {
    var words = [];
    var wordsWeight = [];
    $.ajax({
        url: "/wordsCloud", success: function (result) {

            //create two array with the data collected from the ajax call
            for (var i = 0; i < result.data.length; i++) {
                words.push(result.data[i].word);
                console.log(clamp(0, 10, result.data[i].count));
                wordsWeight.push(clamp(0, 10, result.data[i].count));
            }

            //by adding string to the array below [escapeWords] thei will be trimmed from the result cloud
            var escapeWords = [];
            for (i = 0; i < escapeWords.length; i++) {
                for (j = 0; j < words.length; j++) {
                    if (words[j].toLowerCase() === escapeWords[i].toLowerCase()) {
                        words.splice(j, 1);
                        j--;
                    }
                }
            }

            //select scale of color
            var fill = d3.scale.category20b();

            //set the rotations for the words, choosed random when drawing
            var rotations = [-60, -30, 0, 30, 60, 90]
            //clear the page when redrawing
            if ($(".wordCloudContainer").children().length > 0) {
                $(".wordCloudContainer").children()[0].remove();
            }

            //create the cloud
            var layout = d3.layout.cloud()
                .size([$(".tab-content div.active").width() - 54, 800])

                //map the words array into obj --> unfortunately the method .data(array) below force us to have the otherwise useless array "words"
                .words(words.map(function (d) {
                    return {text: d, size: 40};
                }))
                .padding(5)
                .rotate(function () {
                    return rotations[Math.floor(Math.random() * 6)]
                })
                .font("Impact")
                .fontSize(function (d, i) {
                    return d.size * (wordsWeight[i] / 2);
                })
                .on("end", draw);
            layout.start();

            //draw the cloud
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

            //fill the table below the cloud
            for (var i = 0; i < result.data.length; i++) {
                $(".wordsCount").append("<tr><td>" + result.data[i].word + "</td><td>" + result.data[i].count + "</td></tr>")
            }

        }
    });


}


function drawGraph(route, svgClassName, tableName, deltaX, deltaY) {
    $.ajax({
        url: route, success: function (result) {
            var month = [];
            var data = [];
            for (var key in result.data[tableName]) {
                month.push(key);
                data.push(result.data[tableName][key])
            }

            var monthComplete = month.slice();

            for (i = 0; i < month.length; i++) {
                if (i > 0 && i < month.length - 1) {
                    month[i] = "";
                }
            }

            var margin = {top: 20, right: 40, bottom: 30, left: 40},
                width = 920 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;


            var barWidth = width / data.length;
            var x = d3.scale.ordinal().rangeRoundBands([0, width], deltaX);
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
                    tipMonth = monthComplete[document.elementFromPoint(event.clientX, event.clientY).id]
                    return "<strong>Likes count:</strong> <span class='tip'>" + d + "</span><br><strong>When: </strong><span>" + tipMonth + "</span>";
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

            var bar = chart.selectAll("bar")
                .data(data)
                .enter().append("g")
                .attr("transform", function (d, i) {
                    return "translate(" + i * barWidth + ",0)";
                })
                .append("rect")
                .attr("y", function (d) {
                    return y(d);
                })
                .attr("height", function (d) {
                    return height - y(d);
                })
                .attr("width", barWidth - 1)
                .attr("class", "bar")
                .attr("id", function (d, i) {
                    return i;
                })
                .on('mouseover', tip.show)
                //.on("mousemove", function () {
                //    return tip.style("top",
                //        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                //})
                .on('mouseout', tip.hide);

            chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + deltaY + "," + height + ")")
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


