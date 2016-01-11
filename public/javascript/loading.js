$(document).ready(function () {
    loadingRequest();
});

var loadingRequest = function () {
    $.ajax({
        type: "GET",
        url: "/getState",
        dataType: "json",
        success: function (data) {
            console.log(data);
            var state = data.state;
            if (state === 9) {
                launchAnalysis();
                setTimeout(function () {
                    loadingRequest();
                }, 2000);
                return;
            }
            if (state === 8) {
                window.location = "http://localhost:8080/profile";
                return;
            }
            else
                setTimeout(function () {
                    loadingRequest();
                }, 2000);

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
