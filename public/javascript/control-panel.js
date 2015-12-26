/**
 * Created by lambrosini on 26/12/15.
 */
$(document).ready(function () {
    $('#userTable').DataTable({
        "ajax": "/userStats",
        "columnDefs": [
            {
                // The `data` parameter refers to the data for the cell (defined by the
                // `data` option, which defaults to the column being worked with, in
                // this case `data: 0`.
                "render": function (data, type, row) {
                    return '<button email="'+row[2] +'">' + data + '</button>';
                },
                "targets": 0
            }
        ]
    });
});