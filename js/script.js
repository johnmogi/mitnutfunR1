jQuery(document).ready(function ($) {

  //slider
  var swiperBanner = new Swiper(".banner-slider", {
    loop: true,
    navigation: {
      nextEl: ".banner-next",
      prevEl: ".banner-prev",
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
  });

  //slider
  var swiperTestimonials = new Swiper(".testimonials-slider", {
    slidesPerView: "auto",
    spaceBetween: 25,
    navigation: {
      nextEl: ".testimonials-next",
      prevEl: ".testimonials-prev",
    },
    breakpoints: {
      640: {
        spaceBetween: 40,
      },
    },
  });

  /* mob-menu*/
  $(document).on('click', '.open-menu a', function (e){
    e.preventDefault();

    $.fancybox.open( $('#menu-responsive'), {
      touch:false,
      autoFocus:false,
    });
    setTimeout(function() {
      $('body').addClass('is-active');
      $('html').addClass('is-menu');
      $('header').addClass('is-active');
    }, 100);

  });

  /*close mob menu*/
  $(document).on('click', '.close-menu a', function (e){
    e.preventDefault();
    $('body').removeClass('is-active');
    $.fancybox.close();
    $('header').removeClass('is-active');
    $('html').removeClass('is-menu');
  });


  //faq
  $(function() {
    $(".accordion > .accordion-item.is-active").children(".accordion-panel").slideDown();
    $(document).on('click', '.accordion > .accordion-item .accordion-thumb', function (e){
      $(this).parent('.accordion-item').siblings(".accordion-item").removeClass("is-active").children(".accordion-panel").slideUp();
      $(this).parent('.accordion-item').toggleClass("is-active").children(".accordion-panel").slideToggle("ease-out");
    })
  });

  //slider
  var swiperProduct = new Swiper(".product-slider", {
    navigation: {
      nextEl: ".product-next",
      prevEl: ".product-prev",
    },
  });

  const localeHe = {
    days: ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'],
    daysShort: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    daysMin: ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''],
    months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
    monthsShort: ['ינו\'', 'פבר\'', 'מרץ', 'אפר\'', 'מאי', 'יוני', 'יולי', 'אוג\'', 'ספט\'', 'אוק\'', 'נוב\'', 'דצמ\''],
    today: 'היום',
    clear: 'נקה',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    firstDay: 0
  }


  new AirDatepicker('.date1', {
    locale: localeHe,
    autoClose: true,
    inline: true,
  });

  //select
  $('.select-block select').niceSelect();


  //mob show/hide block - page - date
  $(document).on('click', '.date-block .item-3 .line-top', function (e){
    e.preventDefault();
    let item = $(this).closest('.item-3');
    item.toggleClass('is-close');

    if(item.hasClass('is-close')){
      $('.date-block .item-3 .wrap').slideUp();
    }else{
      $('.date-block .item-3 .wrap').slideDown();
    }
  });

  //cutt text
  $('.blog .item .wrap p').Cuttr({
    //options here
    truncate: 'words',
    length: 21
  });

  //cutt text
  $('.blog-slider-wrap .swiper-slide .info').Cuttr({
    //options here
    truncate: 'words',
    length: 21
  });


  //scroll up
  $(document).on('click', '.top-btn a', function (e) {
    $('html, body').stop().animate({scrollTop:0},'slow', 'swing');
  });

  //show scroll
  $(window).scroll(function () {
    if($(this).scrollTop() > $(this).height()) {
      $('.top-btn').slideDown()
    } else {
      $('.top-btn').slideUp()
    }
  });


  var swiperBlog = new Swiper(".blog-slider", {
    slidesPerView: 1,
    spaceBetween: 10,
    loop:true,
    navigation: {
      nextEl: ".blog-next",
      prevEl: ".blog-prev",
    },
    breakpoints: {
      640: {
        slidesPerView: 1,
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      1199: {
        slidesPerView: 3,
        spaceBetween: 40,
      },
    },
  });

  //mask tel
//  $('.tel').mask("+000 000 000 00 00", {placeholder: "+972 000 000 00 00"});

  //show/hide text

  $(document).on('click', '.show-text', function (e){
    e.preventDefault();
    $(this).toggleClass('is-open');
    if($(this).hasClass('is-open')){
      $('.link-wrap .info-text').slideDown();
    }else{
      $('.link-wrap .info-text').slideUp();
    }
  });

	
	 $(document).on('click', '.auto-popup .form-default .input-wrap-checked input', function (e) {
    if($(this).prop('checked')) {
      $('.auto-popup .btn-wrap').addClass('is-open')
    } else{
      $('.auto-popup .btn-wrap').removeClass('is-open')
    }
  });


  /* mob-menu*/
  $(document).on('click', '.fancybox-check', function (e){
    e.preventDefault();

    $.fancybox.open( $('#check-popup'), {
      autoFocus: false,
      trapFocus: true,
      clickSlide: false,
      clickOutside: false,
      autoDimensions: false,
      touch: false,
      mobile: {
        clickSlide: false
      },
    });
    setTimeout(function() {
      $('body').addClass('is-active');
      $('html').addClass('is-menu');
      $('header').addClass('is-active');
    }, 100);

  });

  /*close mob menu*/
  $(document).on('click', '.close-check', function (e){
    e.preventDefault();
    $('body').removeClass('is-active');
    $.fancybox.close();
    $('header').removeClass('is-active');
    $('html').removeClass('is-menu');
  });

  //auto open popup
  if($('.checkout').length > 0){
    $.fancybox.open( $('#auto-popup'), {
      touch:false,
      autoFocus:false,
		touch:false,
      autoFocus:false,
		trapFocus: true,
clickSlide: false,
clickOutside: false,
autoDimensions: false,
touch: false,
		 mobile: {
     clickSlide: false,
   },
    });
  }

});
