$(function () {
    home();

    $("#reload").click(function () {
        window.location = "/analyzing"
    })

    //open/close popover on settings button, top right corner
    $('[data-toggle="popover"]').popover({
        placement: 'bottom'
    });


    $(".nav").click(function () {
        var body = $("html, body");
        body.stop().animate({scrollTop: 0}, '500', 'swing', function () {});
        activePill = document.elementFromPoint(event.clientX, event.clientY).parentNode.id
        switch (activePill) {
            case "total":
                home();
                break;
            case "wholikesyou":
                whoLikesYouAnalysis();

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

function home() {
    $.ajax({
        url: "/overall", success: function (result) {
            $(".profilePic").attr("src", result.data.profilePhoto);

            $(".profilePic").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.profilePhoto + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $(".backgroundOpacity").click(function () {
                $(".backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            })

            bestElementContainer = $("#totalBestElementContainer");
            if (bestElementContainer.children().length == 1) {
                if (result.data.analysis.bestElement.post.message === undefined) {
                    bestElementContainer.append("<img src='" + result.data.analysis.bestElement.post.images[0].source + "' id='totalBestElement'>");
                    $("#totalBestElement").attr("class", "bestElement");
                    bestElementContainer.append("<div class='bestElementDescription'>Image posted by: " + result.data.analysis.bestElement.post.from.name + "<br>Message: " + result.data.analysis.bestElement.post.name + "<br>Likes count: " + result.data.analysis.bestElement.likesCount + "</div>")
                }
            }

            $("#totalBestElement").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.bestElement.post.images[0].source + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });
            $("#totalLikeCount").html("Total likes count: " + result.data.analysis.likesCount);
            /*
             Convert
             */
            var periodGroupedLikesArray = [];
            for (var key in result.data.analysis.periodGroupedLikes) {
                periodGroupedLikesArray.push({
                    month: key,
                    data: result.data.analysis.periodGroupedLikes[key]
                });
            }
            periodGroupedLikesArray = periodGroupedLikesArray.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });
            var hourGroupedLikes = [];
            for (var key in result.data.analysis.hourGroupedLikes) {
                hourGroupedLikes.push({
                    month: key,
                    data: result.data.analysis.hourGroupedLikes[key]
                });
            }
            hourGroupedLikes = hourGroupedLikes.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });

            $(".totalGrouped").empty();
            for (var i = 0; i < periodGroupedLikesArray.length; i++) {
                $(".totalGrouped").append("<tr><td>" + periodGroupedLikesArray[i].month + "</td><td>" + periodGroupedLikesArray[i].data + "</td></tr>")
            }
            $(".totalHours").empty();
            for (var i = 0; i < hourGroupedLikes.length; i++) {
                $(".totalHours").append("<tr><td>" + hourGroupedLikes[i].month + "</td><td>" + hourGroupedLikes[i].data + "</td></tr>")
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

            $("#first").attr("href", result.data.analysis.likesByPerson[0].profileLink);
            $("#second").attr("href", result.data.analysis.likesByPerson[1].profileLink);
            $("#third").attr("href", result.data.analysis.likesByPerson[2].profileLink);
            $("#first").click(function () {
                window.open($(this).attr("href"), '_blank');
            });
            $("#second").click(function () {
                window.open($(this).attr("href"), '_blank');
            });
            $("#third").click(function () {
                window.open($(this).attr("href"), '_blank');
            });

            $("#firstPic .podiumPic").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.likesByPerson[0].profilePhoto + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $("#secondPic .podiumPic").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.likesByPerson[1].profilePhoto + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $("#thirdPic .podiumPic").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.likesByPerson[2].profilePhoto + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $(".backgroundOpacity").click(function () {
                $(".backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            })

            $(".friendLikesCount").empty();
            for (var i = 0; i < result.data.analysis.likesByPerson.length; i++) {
                $(".friendLikesCount").append("<tr data-href='" + result.data.analysis.likesByPerson[i].profileLink + "'><td>" + result.data.analysis.likesByPerson[i].name + "</td><td>" + result.data.analysis.likesByPerson[i].count + "</td></tr>")
            }

            $('.friendTable').on("click", "tr", function () {
                window.open($(this).attr("data-href"), '_blank');
            });
        }
    })
}

function getFeedAnalysis() {
    $.ajax({
        url: "/getFeedsAnalysisData", success: function (result) {
            $("#feedLikeCount").html("Feed likes count: " + result.data.likesCount);
            /*
             Convert
             */
            var periodGroupedLikesArray = [];
            for (var key in result.data.periodGroupedLikes) {
                periodGroupedLikesArray.push({
                    month: key,
                    data: result.data.periodGroupedLikes[key]
                });
            }
            periodGroupedLikesArray = periodGroupedLikesArray.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });
            var hourGroupedLikes = [];
            for (var key in result.data.hourGroupedLikes) {
                hourGroupedLikes.push({
                    month: key,
                    data: result.data.hourGroupedLikes[key]
                });
            }
            hourGroupedLikes = hourGroupedLikes.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });

            $(".feedGrouped").empty();
            for (var i = 0; i < periodGroupedLikesArray.length; i++) {
                $(".feedGrouped").append("<tr><td>" + periodGroupedLikesArray[i].month + "</td><td>" + periodGroupedLikesArray[i].data + "</td></tr>")
            }
            $(".feedHours").empty();
            for (var i = 0; i < hourGroupedLikes.length; i++) {
                $(".feedHours").append("<tr><td>" + hourGroupedLikes[i].month + "</td><td>" + hourGroupedLikes[i].data + "</td></tr>")
            }

        }
    })
}

function getUploadedAnalysis() {
    $.ajax({
        url: "/getUploadedAnalysisData", success: function (result) {
            bestElementContainer = $("#loadedBestElementContainer");
            if (bestElementContainer.children().length == 1) {
                if (result.data.bestElement.post.message === undefined) {
                    bestElementContainer.append("<img src='" + result.data.bestElement.post.images[0].source + "' id='loadedBestElement'>");
                    $("#loadedBestElement").attr("class", "bestElement");
                    bestElementContainer.append("<div class='bestElementDescription'>Image posted by: " + result.data.bestElement.post.from.name + "<br>Last Update: " + result.data.bestElement.post.updated_time + "<br>Likes count: " + result.data.bestElement.likesCount + "</div>")
                }
            }

            $("#loadedBestElement").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.bestElement.post.images[0].source + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $(".backgroundOpacity").click(function () {
                $(".backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            })

            $("#loadedLikeCount").html("Uploaded photos likes count: " + result.data.likesCount);
            var periodGroupedLikesArray = [];
            for (var key in result.data.periodGroupedLikes) {
                periodGroupedLikesArray.push({
                    month: key,
                    data: result.data.periodGroupedLikes[key]
                });
            }
            periodGroupedLikesArray = periodGroupedLikesArray.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });
            var hourGroupedLikes = [];
            for (var key in result.data.hourGroupedLikes) {
                hourGroupedLikes.push({
                    month: key,
                    data: result.data.hourGroupedLikes[key]
                });
            }
            hourGroupedLikes = hourGroupedLikes.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });

            $(".loadedGrouped").empty();
            for (var i = 0; i < periodGroupedLikesArray.length; i++) {
                $(".loadedGrouped").append("<tr><td>" + periodGroupedLikesArray[i].month + "</td><td>" + periodGroupedLikesArray[i].data + "</td></tr>")
            }
            $(".loadedHours").empty();
            for (var i = 0; i < hourGroupedLikes.length; i++) {
                $(".loadedHours").append("<tr><td>" + hourGroupedLikes[i].month + "</td><td>" + hourGroupedLikes[i].data + "</td></tr>")
            }
        }
    })
}

function getTaggedAnalysis() {
    $.ajax({
        url: "/getTaggedAnalysisData", success: function (result) {
            bestElementContainer = $("#taggedBestElementContainer");
            if (bestElementContainer.children().length == 1) {
                if (result.data.bestElement.post.message === undefined) {
                    bestElementContainer.append("<img src='" + result.data.bestElement.post.images[0].source + "' id='taggedBestElement'>");
                    $("#taggedBestElement").attr("class", "bestElement");
                    bestElementContainer.append("<div class='bestElementDescription'>Image posted by: " + result.data.bestElement.post.from.name + "<br>Last Update: " + result.data.bestElement.post.updated_time + "<br>Likes count: " + result.data.bestElement.likesCount + "</div>")
                }
            }

            $("#taggedBestElement").click(function () {
                $(".backgroundOpacity").html("<img class='fullscreen' src='" + result.data.bestElement.post.images[0].source + "'>");
                $(".backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $(".backgroundOpacity").click(function () {
                $(".backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            });

            $("#taggedLikeCount").html("Tagged photos likes count: " + result.data.likesCount);
            var periodGroupedLikesArray = [];
            for (var key in result.data.periodGroupedLikes) {
                periodGroupedLikesArray.push({
                    month: key,
                    data: result.data.periodGroupedLikes[key]
                });
            }
            periodGroupedLikesArray = periodGroupedLikesArray.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });
            var hourGroupedLikes = [];
            for (var key in result.data.hourGroupedLikes) {
                hourGroupedLikes.push({
                    month: key,
                    data: result.data.hourGroupedLikes[key]
                });
            }
            hourGroupedLikes = hourGroupedLikes.sort(function (a, b) {
                return (a.month < b.month) ? 1 : -1;
            });

            $(".taggedGrouped").empty();
            for (var i = 0; i < periodGroupedLikesArray.length; i++) {
                $(".taggedGrouped").append("<tr><td>" + periodGroupedLikesArray[i].month + "</td><td>" + periodGroupedLikesArray[i].data + "</td></tr>")
            }
            $(".taggedHours").empty();
            for (var i = 0; i < hourGroupedLikes.length; i++) {
                $(".taggedHours").append("<tr><td>" + hourGroupedLikes[i].month + "</td><td>" + hourGroupedLikes[i].data + "</td></tr>")
            }
        }
    })
}

function drawWordCloud() {
    var words = [];
    var wordsWeight = [];
    $.ajax({
        url: "/wordsCloud", success: function (result) {
            var max = 10;
            for (var i = 0; i < result.data.length; i++) {
                if (max < result.data[i].count)
                    max = result.data[i].count
            }

            //create two array with the data collected from the ajax call
            for (var i = 0; i < result.data.length; i++) {
                words.push(result.data[i].word);
                wordsWeight.push((result.data[i].count / max * 7) + 1);
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
            $(".wordsCount").empty();
            for (var i = 0; i < result.data.length; i++) {
                $(".wordsCount").append("<tr><td>" + result.data[i].word + "</td><td>" + result.data[i].count + "</td></tr>");
            }

        }
    });


}


function drawGraph(route, svgClassName, tableName, deltaX, deltaY) {
    $.ajax({
        url: route, success: function (result) {


            var monthArray = [];
            for (var key in result.data[tableName]) {
                monthArray.push({
                    month: key,
                    data: result.data[tableName][key]
                });
            }
            monthArray = monthArray.sort(function (a, b) {
                return (a.month > b.month) ? 1 : -1;
            });


            var month = [];
            var data = [];
            for (var i = 0; i < monthArray.length; i++) {
                month.push(monthArray[i].month);
                data.push(monthArray[i].data);
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


