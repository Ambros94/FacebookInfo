$(document).ready(function () {
    loadingRequest();
});

var loadingRequest = function () {
    $.ajax({
        type: "GET",
        url: "/getState",
        dataType: "json",
        success: function (data) {
            var state = data.state;
            if (state === 9) {
                launchAnalysis();
                setTimeout(function () {
                    loadingRequest();
                }, 2000);
                return;
            }
            if (state === 8) {
                $(".wait").html("<a href='http://localhost:8080/profile' class='btn btn-primary' role='button'>Go to Stalk.com</a>")
                $(".waitHidden").click(function(){
                    window.location = 'http://localhost:8080/profile';
                })
                return;
            }
            else {
                $(".wait").html("<p>Please Wait..</p>")
                setTimeout(function () {
                    loadingRequest();
                }, 2000);
            }

        },
        error: function (err) {
            console.log("error", err);
        }
    });
};
var launchAnalysis = function () {
    $.ajax({
        type: "GET",
        url: "/analyzeUser",
        dataType: "json",
        success: function (data) {
            console.log("Lanciata analisi");

        },
        error: function (err) {
            console.log("error", err);
        }
    });
};
