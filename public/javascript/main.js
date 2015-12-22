$(function () {
    $(".column").sortable({
        connectWith: ".column",
        handle: ".portlet-header",
        cancel: ".portlet-toggle",
        placeholder: "portlet-placeholder ui-corner-all"
    });

    $(".portlet")
        .addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all")
        .find(".portlet-header")
        .addClass("ui-widget-header ui-corner-all")
        .prepend("<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");

    $(".portlet-toggle").click(function () {
        var icon = $(this);
        icon.toggleClass("ui-icon-minusthick ui-icon-plusthick");
        icon.closest(".portlet").find(".portlet-content").toggle();
    });
})

$(function () {
    $.plot($("#graph1"), [[[0, 0], [1, 1]]], {yaxis: {max: 1}});
    $.plot($("#graph2"), [[[0.5, 0], [-1, 1]]], {yaxis: {max: 1}});
    $.plot($("#graph3"), [[[0, 0], [1, -1]]], {yaxis: {max: 1}});
})

$(function () {
    var fill = d3.scale.category20b();
    var rotations = [-60, -30, 0, 30, 60, 90];
    var words = [
        "Hello", "Hello", "Hello", "Hello", "world", "normally", "you", "want", "more", "words",
        "than", "this","this"];

    var escapeWords = ["hello"];

    var wordsWeight = { };

    var final = [];


    for (i = 0; i < escapeWords.length; i++) {
        for (j = 0; j < words.length; j++) {
            if (words[j].toLowerCase() === escapeWords[i].toLowerCase()) {
                words.splice(j, 1);
                j--;
            }
        }
    }
    for(i=0;i<words.length;i++){
        wordsWeight[words[i]] = (wordsWeight[words[i]] || 0) + 1;
    }


    $.each(words, function(i, el){
        if($.inArray(el, final) === -1) final.push(el);
    });



    var layout = d3.layout.cloud()
        .size([500, 500])
        .words(words.map(function (d) {
            return {text: d, size: 10 + 15 *wordsWeight[d], test: "haha"};
        }))
        .padding(5)
        .rotate(function () {
            return rotations[Math.floor(Math.random() * 6)]
        })
        .font("Impact")
        .fontSize(function (d) {
            return d.size*wordsWeight[d.text];
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
})


