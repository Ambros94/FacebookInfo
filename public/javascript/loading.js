$(document).ready(function () {
    loadingRequest();
});

var loadingRequest = function () {
    //ajax call to retrieve the state of the analysis
    $.ajax({
        type: "GET",
        url: "/getState",
        dataType: "json",
        success: function (data) {
            //launch analysis
            var state = data.state;
            if (state === 9) {
                launchAnalysis();
                setTimeout(function () {
                    loadingRequest();
                }, 2000);
                return;
            }
            //if analysis is finished displey goToHome button
            if (state === 8) {
                $("#wait").html("<a href='http://localhost:8080/profile' class='btn btn-primary' role='button'>Go to Stalk.com</a>")
                $("#footer").append("<a href='http://localhost:8080/profile'>Go to Stalk.com</a>")
                $("#waitHidden").click(function(){
                    window.location = 'http://localhost:8080/profile';
                })
                return;
            }
            //if analysis is not finished yet, display gif
            else {
                $("#wait").html("<img src='/images/loading_dots.gif' id='gif' alt='loading gif'>")
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
    //ajax call to start analyze the user facebook profile
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
