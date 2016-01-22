$(function () {
    //load home data
    home();

    //handle reload button ont top right, on click re-analyze the user facebook profile
    $("#reload").click(function () {
        window.location = "/analyzing"
    })

    //open/close popover on settings button, top right corner
    $('[data-toggle="popover"]').popover({
        placement: 'bottom'
    });

    //fix navigator position on window resize
    $( window ).resize(function() {
        $(".nav").css("margin-left", $("#leftMain").width() + ($("#centerMain").width() - $(".nav").width()) / 2);
    });

    //handle navigator, on click open the selected tab and load the correct data
    $(".nav").click(function () {
        var body = $("html, body");
        body.stop().animate({scrollTop: 0}, '500', 'swing', function () {
        });
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


/////////////////////////////////////////////
/////// Homepage and Total Analysis /////////
/////////////////////////////////////////////

function home() {
    //ajax call to reatrive the data from totalAnalysis table
    $.ajax({
        url: "/overall", success: function (result) {
            //set profile image and add fullscreen view on click
            $("#profilePic").attr("src", result.data.profilePhoto);

            $("#profilePic").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.profilePhoto + "' alt='black background with alpha channel 0.5'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            $("#backgroundOpacity").click(function () {
                $("#backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            })

            //fill best element updated data
            bestElementContainer = $("#totalBestElementContainer");
            if (bestElementContainer.children().length == 1) {
                if (result.data.analysis.bestElement.post.message === undefined) {
                    bestElementContainer.append("<img src='" + result.data.analysis.bestElement.post.images[0].source + "' id='totalBestElement' alt='best picture from total analysis'>");
                    $("#totalBestElement").attr("class", "bestElement");
                    bestElementContainer.append("<div class='bestElementDescription'>Image posted by: " + result.data.analysis.bestElement.post.from.name + "<br>Message: " + result.data.analysis.bestElement.post.name + "<br>Likes count: " + result.data.analysis.bestElement.likesCount + "</div>")
                }
            }

            // handle fullscreen view on best element image
            $("#totalBestElement").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.bestElement.post.images[0].source + "'alt='best picture from total analysis'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });

            //add like count updated data
            $("#totalLikeCount").html("Total likes count: " + result.data.analysis.likesCount);

            //sort data
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

            //empty tables if present and draw total analysis tables
            $(".totalGrouped").empty();
            for (var i = 0; i < periodGroupedLikesArray.length; i++) {
                $(".totalGrouped").append("<tr><td>" + periodGroupedLikesArray[i].month + "</td><td>" + periodGroupedLikesArray[i].data + "</td></tr>")
            }
            $(".totalHours").empty();
            for (var i = 0; i < hourGroupedLikes.length; i++) {
                $(".totalHours").append("<tr><td>" + hourGroupedLikes[i].month + "</td><td>" + hourGroupedLikes[i].data + "</td></tr>")
            }

            //draw total analysis bar chart
            drawGraph("/getTotalAnalysisData", ".totalMonthChart", "periodGroupedLikes", -0.965, -0.9);
            drawGraph("/getTotalAnalysisData", ".totalHoursChart", "hourGroupedLikes", -0.915, -1.1);
        }
    })
}

/////////////////////////////////////////////
///////// Who likes you analysis ////////////
/////////////////////////////////////////////

function whoLikesYouAnalysis() {
    //ajac call to retrieve data
    $.ajax({
        url: "/overall", success: function (result) {

            //updata podium with data from the database
            $("#firstPic .podiumPic").attr("src", result.data.analysis.likesByPerson[0].profilePhoto);
            $("#secondPic .podiumPic").attr("src", result.data.analysis.likesByPerson[1].profilePhoto);
            $("#thirdPic .podiumPic").attr("src", result.data.analysis.likesByPerson[2].profilePhoto);

            $("#first").attr("href", result.data.analysis.likesByPerson[0].profileLink);
            $("#second").attr("href", result.data.analysis.likesByPerson[1].profileLink);
            $("#third").attr("href", result.data.analysis.likesByPerson[2].profileLink);

            //redirect to profile page
            $("#first").click(function () {
                window.open($(this).attr("href"), '_blank');
            });
            $("#second").click(function () {
                window.open($(this).attr("href"), '_blank');
            });
            $("#third").click(function () {
                window.open($(this).attr("href"), '_blank');
            });

            //fullscreen image handler
            $("#firstPic .podiumPic").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.likesByPerson[0].profilePhoto + "'alt='profile picture of first best friend'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });
            $("#secondPic .podiumPic").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.likesByPerson[1].profilePhoto + "'alt='profile picture of second best friend'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });
            $("#thirdPic .podiumPic").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.analysis.likesByPerson[2].profilePhoto + "' alt='profile picture of third best friend'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });
            $("#backgroundOpacity").click(function () {
                $("#backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            })

            //update table with data from the database
            $(".friendLikesCount").empty();
            for (var i = 0; i < result.data.analysis.likesByPerson.length; i++) {
                $(".friendLikesCount").append("<tr data-href='" + result.data.analysis.likesByPerson[i].profileLink + "'><td>" + result.data.analysis.likesByPerson[i].name + "</td><td>" + result.data.analysis.likesByPerson[i].count + "</td></tr>")
            }

            //add table-row click handler, redirect to friend facebook profile
            $('.friendTable').on("click", "tr", function () {
                window.open($(this).attr("data-href"), '_blank');
            });
        }
    })
}

/////////////////////////////////////////////
////////////// Feed analysis ////////////////
/////////////////////////////////////////////

function getFeedAnalysis() {
    //ajax call to collect updated data
    $.ajax({
        url: "/getFeedsAnalysisData", success: function (result) {

            //update feed like count
            $("#feedLikeCount").html("Feed likes count: " + result.data.likesCount);

            //sort data
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

            //update tables
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

/////////////////////////////////////////////
///////// Uploaded photo analysis ///////////
/////////////////////////////////////////////

function getUploadedAnalysis() {
    //ajax call to collect updated data
    $.ajax({
        url: "/getUploadedAnalysisData", success: function (result) {

            //update best element and its description
            bestElementContainer = $("#loadedBestElementContainer");
            if (bestElementContainer.children().length == 1) {
                if (result.data.bestElement.post.message === undefined) {
                    bestElementContainer.append("<img src='" + result.data.bestElement.post.images[0].source + "' id='loadedBestElement' alt='best uploaded picture'>");
                    $("#loadedBestElement").attr("class", "bestElement");
                    bestElementContainer.append("<div class='bestElementDescription'>Image posted by: " + result.data.bestElement.post.from.name + "<br>Last Update: " + result.data.bestElement.post.updated_time + "<br>Likes count: " + result.data.bestElement.likesCount + "</div>")
                }
            }

            //handle fullscreen view for best element image
            $("#loadedBestElement").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.bestElement.post.images[0].source + "' alt='best uploaded picture'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });
            $("#backgroundOpacity").click(function () {
                $("#backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            })

            //update like count
            $("#loadedLikeCount").html("Uploaded photos likes count: " + result.data.likesCount);

            //sort data
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

            //update tables
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

/////////////////////////////////////////////
////////// Tagged photo analysis ////////////
/////////////////////////////////////////////

function getTaggedAnalysis() {
    //ajax call to collect updated data
    $.ajax({
        url: "/getTaggedAnalysisData", success: function (result) {

            //update best element and its description
            bestElementContainer = $("#taggedBestElementContainer");
            if (bestElementContainer.children().length == 1) {
                if (result.data.bestElement.post.message === undefined) {
                    bestElementContainer.append("<img src='" + result.data.bestElement.post.images[0].source + "' id='taggedBestElement' alt='best tagged picture'>");
                    $("#taggedBestElement").attr("class", "bestElement");
                    bestElementContainer.append("<div class='bestElementDescription'>Image posted by: " + result.data.bestElement.post.from.name + "<br>Last Update: " + result.data.bestElement.post.updated_time + "<br>Likes count: " + result.data.bestElement.likesCount + "</div>")
                }
            }

            //handle fullscreen view for best element image
            $("#taggedBestElement").click(function () {
                $("#backgroundOpacity").html("<img class='fullscreen' src='" + result.data.bestElement.post.images[0].source + "' alt='best tagged picture'>");
                $("#backgroundOpacity").css("display", "block");
                $(".nav").css("z-index", "-1");
            });
            $("#backgroundOpacity").click(function () {
                $("#backgroundOpacity").css("display", "none");
                $(".nav").css("z-index", "0");
            });

            //update like count
            $("#taggedLikeCount").html("Tagged photos likes count: " + result.data.likesCount);

            //sprt data
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

            //update tables
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

/////////////////////////////////////////////
//////////////// D3 Word cloud //////////////
/////////////////////////////////////////////

function drawWordCloud() {
    //ajax call to retrieve all the words used by the user in facebook
    $.ajax({
        url: "/wordsCloud", success: function (result) {

            //bound font size
            var max = 10;
            for (var i = 0; i < result.data.length; i++) {
                if (max < result.data[i].count)
                    max = result.data[i].count
            }

            //create two array with the data collected from the ajax call
            var words = [];
            var wordsWeight = [];
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
            if ($("#wordCloudContainer").children().length > 0) {
                $("#wordCloudContainer").children()[0].remove();
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
                d3.select("#wordCloudContainer").append("svg")
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


/////////////////////////////////////////////
//////////////// D3 Bar Chart ///////////////
/////////////////////////////////////////////

function drawGraph(route, svgClassName, tableName, deltaX, deltaY) {
    //ajax call to retrieve data, url is passed as argument to make the right call depending which tab is currently open by the user
    $.ajax({
        url: route, success: function (result) {

            // put the data into an array and sort it
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

            // split data into to array, beside our best effort D3 axis and bars are created from two distinct array
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

            //set css style
            var margin = {top: 20, right: 40, bottom: 30, left: 40}
            var width = 920 - margin.left - margin.right
            var height = 500 - margin.top - margin.bottom;

            //set axis
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

            //add little tip onhover bars
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function (d) {
                    tipMonth = monthComplete[document.elementFromPoint(event.clientX, event.clientY).id]
                    return "<strong>Likes count:</strong> <span class='tip'>" + d + "</span><br><strong>When: </strong><span>" + tipMonth + "</span>";
                })

            //set domains
            x.domain(month.map(function (d) {
                return d;
            }));
            y.domain([0, d3.max(data, function (d) {
                return d;
            })]);

            //create chart
            var chart = d3.select(svgClassName)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            chart.call(tip);

            //add bars
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
                .on('mouseout', tip.hide);

            //add axis
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


