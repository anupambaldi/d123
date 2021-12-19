$(document).ready(() => {
    $('#pages-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/pages/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });
      //restaurant page
    $('#restaurant-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/restaurants/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });
    //rating page
    $('#rating-datatable').DataTable({
        aoColumnDefs: [{
            "defaultContent": "-",
            "targets": "_all"
          }],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/ratings/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#restaurantrating-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-3, -4]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/ratings/resturantratinglist',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });
    //swap type page
    $('#swap-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/swaptypes/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });
    
    $('#users-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                "defaultContent": "-",
                "targets": "_all"
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/users/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#practices-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [0,-1,-2]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/practices/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#practiceproduct-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [0,-1,-2]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/practices/orderlist/'+$('#practice_id').val(),
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#buyinggroups-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1, -3, -4]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/buyinggroups/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#vendors-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1, -3, -4]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/vendors/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#concierges-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1, -3, -4]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/concierges/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#buyinggroupspopup-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [0,1,2]
            }
        ],
        // bPaginate: false,
        bLengthChange: false,
        bAutoWidth: false,
        bInfo: false,
        stateSave: true,
        searchDelay: 700,
        //aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/buyinggroups/popuplist',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#buygroup-categories-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1, -2]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/categories/grouplist/'+$('#buyinggroup_id').val(),
            data: {}
        },
        initComplete: (settings, json) => {
            console.log($('#buyinggroup_id').val());
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#vendor-categories-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1, -2]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/categories/vendorlist',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    var ProductList =  $('#product-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/products/list/'+$('#product-datatable').attr('cvalue'),
            data: {
                categoryId: function () {
                    return $("#categoryId").val();
                },
                subcategoryId: function () {
                    return $("#subcategoryId").val();
                }
            }
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });


    $('#categories-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-3, -4]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/categories/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#subcategories-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-3, -4]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/categories/subcategoryList',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#store-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1,-2]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/stores/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#leads-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [0,-1,-2]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/leads/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    
    $('#orders-datatable').DataTable({
        aoColumnDefs: [{
            bSortable: false,
            aTargets: [0,-1,-2]
        }],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/orders/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#jobpositions-datatable').DataTable({
        aoColumnDefs: [{
            bSortable: false,
            aTargets: [0,-1,-2]
        }],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/jobpositions/list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });
    
    $('#jobposition-applied-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [0,1,2]
            }
        ],
        // bPaginate: false,
        bLengthChange: false,
        bAutoWidth: false,
        bInfo: false,
        stateSave: true,
        searchDelay: 700,
        //aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/concierges/applied-list/'+$('#jobposition_id').val(),
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    $('#duplicaterestaurant-datatable').DataTable({
        aoColumnDefs: [
            {
                bSortable: false,
                aTargets: [-1]
            }
        ],
        stateSave: true,
        searchDelay: 700,
        aaSorting: [[0, 'desc']],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/restaurants/duplicate-list',
            data: {}
        },
        initComplete: (settings, json) => {
            $('.tableLoader').css('display', 'none');
        },
        language: {
            paginate: {
                previous: '<i class="mdi mdi-chevron-left">',
                next: '<i class="mdi mdi-chevron-right">'
            }
        },
        drawCallback: () => {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });
});