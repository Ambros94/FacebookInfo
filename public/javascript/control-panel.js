/**
 * Created by lambrosini on 26/12/15.
 */
$(document).ready(function () {
    /*
     Defines the table, renders buttons
     */
    var table = $('#userTable').DataTable({
        "ajax": "/userStats",
        "columnDefs": [
            {
                // The `data` parameter refers to the data for the cell (defined by the
                // `data` option, which defaults to the column being worked with, in
                // this case `data: 0`.
                "render": function (data, type, row) {
                    if (data === row[6])
                        return '<button  type="button" class="btn btn-warning" email="' + row[2] + '">' + data + '</button>';
                    else
                        return '<button  type="button" class="btn btn-primary" email="' + row[2] + '">' + data + '</button>';

                },
                "targets": [5, 6]
            }
        ]
    });

    /*
     Force user analysis
     */
    $('#userTable').on("click", "button.btn-primary", function () {
        var email = $(this).attr('email');
        $.ajax("/forceAnalysis/" + email)
            .done(function () {
                alert("success");
                table.ajax.reload( null, false );
            })
            .fail(function () {
                alert("Impossible to analyze");
            })

    });

    /*
     Clear button
     */
    $('#userTable').on("click", "button.btn-warning", function () {
        var email = $(this).attr('email');
        $.ajax("/clearUser/" + email)
            .done(function () {
                alert("success");
                table.ajax.reload( null, false );
            })
            .fail(function () {
                alert("Impossible to clear user data");
            })

    });
});