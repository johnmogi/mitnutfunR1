<?php

add_action('admin_menu', 'add_rental_calendar_page');
function add_rental_calendar_page() {
    add_menu_page(
        'Bookings',
        'Bookings',
        'manage_options',
        'rental-calendar',
        'display_rental_calendar_page',
        'dashicons-calendar-alt',
        6
    );
}

function display_rental_calendar_page() {
    ?>
    <div class="wrap">
        <h1>Rental Calendar</h1>
        <div id="rental-calendar"></div>
    </div>
    <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/animations/scale.css" />
    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.14/index.global.min.js'></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('rental-calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: <?php echo json_encode(get_all_rental_dates()); ?>,
                eventMouseEnter: function(info) {
                    var tooltip = document.createElement('div');
                    tooltip.className = 'tooltip';
                    tooltip.innerHTML = info.event.extendedProps.orderDetails;
                    document.body.appendChild(tooltip);
                    tippy(info.el, {
                        content: tooltip,
                        allowHTML: true,
                        animation: 'scale',
                        theme: 'light',
                        onHidden(instance) {
                            instance.destroy();
                        }
                    });
                },
                eventMouseLeave: function(info) {
                    var tippyInstances = info.el._tippy;
                    if (tippyInstances) {
                        tippyInstances.hide();
                    }
                }
            });
            calendar.render();
        });
    </script>

    <?php
}


function get_all_rental_dates() {
    // Ensure WooCommerce is available
    if (!class_exists('WooCommerce')) {
        return [];
    }

    // Initialize the dates array
    $rental_dates = [];

    // Get all orders
    $args = array(
        'limit' => -1, // Get all orders
        'status' => 'any', // Any status
    );
    $orders = wc_get_orders($args);

    // Loop through each order
    foreach ($orders as $order) {
        // Loop through each item in the order
        foreach ($order->get_items() as $item_id => $item) {
            // Get the rental dates (assuming they are stored as item meta)
            $dates = wc_get_order_item_meta($item_id, 'Rental Dates', true);
            if ($dates) {
                // Get customer details
                $customer_name = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();
                $order_number = $order->get_order_number();
                $order_total = $order->get_total();

                // Format the order details
                $order_details = sprintf(
                    'Order #%d: %s, Rental Period: %s, Cost: %s',
                    $order_number . '<br>',
                    $customer_name,
                    $dates,
                    wc_price($order_total)
                );


                $date_ranges = explode(' - ', $dates);
                $start_date = date('Y-m-d', strtotime($date_ranges[0]));
                $end_date = date('Y-m-d', strtotime($date_ranges[1]));
                $rental_dates[] = [
                    'title' =>   $item->get_name()  ,
                    'start' => $start_date,
                    'end' => $end_date,
                    'url' => '/wp-admin/admin.php?page=wc-orders&action=edit&id=' . $order->get_id(),
                    'extendedProps' =>
                    ['orderDetails' => $order_details,]

                ];
            }
        }
    }

    return $rental_dates;
}


add_action('admin_enqueue_scripts', 'enqueue_fullcalendar_assets');
function enqueue_fullcalendar_assets() {
    wp_enqueue_style('fullcalendar-css', 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/5.10.1/main.min.css');
    wp_enqueue_script('fullcalendar-js', 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/5.10.1/main.min.js', array(), null, true);
}
