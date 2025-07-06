jQuery(document).ready($ => {
    $(document).on('change', '#shipping_method input', (e)=>{
        let val = $(e.target).val();
        toggle_picker(val)
    })

    setTimeout((e) =>{
      let val = $('#shipping_method input:checked').val();
      // console.log(val);
      toggle_picker(val)
    }, 800)


  function toggle_picker(val) {
    if ('local_pickup:1' === val) {
      $('#coderockz_woo_delivery_delivery_date_section').hide();
      $('#coderockz_woo_delivery_delivery_time_section').hide();
      $('#coderockz_woo_delivery_pickup_date_section').show();
      $('#coderockz_woo_delivery_pickup_time_section').show();
      $('.shipping_address').hide();
    } else {
      $('#coderockz_woo_delivery_pickup_date_section').hide();
      $('#coderockz_woo_delivery_pickup_time_section').hide();
      $('#coderockz_woo_delivery_delivery_date_section').show();
      $('#coderockz_woo_delivery_delivery_time_section').show();
      $('.shipping_address').show()
    }
  }

  $(document).on('click', '.delete', (e) => {
    setTimeout((e) =>{
      $(document.body).trigger('update_checkout');

    }, 200)

  })



    /* apply coupon */

    $(document).on('click', '[name="apply_coupon"]', function (e) {

        e.preventDefault();
        var that = $(this);

        var coupon = $('[name="coupon_code"]').val();
        $.ajax({
            type: 'GET',
            url: wc_add_to_cart_params.ajax_url,
            data: {
                action: 'apply_coupon',
                coupon: coupon,
            },
            success: function (data) {
                // console.log(data)

                $(document.body).trigger('update_checkout');

                if (!data.coupon)
                    alert(data.message)

            },
            error: function(data){
                $('.promotional-code__text').html(data.message);
            },
        });
    });


    $(document).on('click', '.woocommerce-remove-coupon', function(){
        setTimeout(function(){
            $(document.body).trigger('update_checkout');
        }, 300)

    })


    $('.btn-redirect').click(function(){
        $('[name="redirect"]').val(1)
    })


    $('.select2-time').select2({
        placeholder: "שעת איסוף",
        width: '100%'
    })

})


//coderockz_woo_delivery_delivery_date_section
//coderockz_woo_delivery_delivery_time_section

//coderockz_woo_delivery_pickup_date_section
//coderockz_woo_delivery_pickup_time_section
