
/* --------------------------------------------------------------------------
 * WooCommerce – משלוח חינם אם יש מוצר מקטגוריה "תיאום-שילוח-הובלה-והרכבה"
 * -------------------------------------------------------------------------- */
add_filter('woocommerce_package_rates', 'enforce_free_shipping_if_coordinated_item', 100, 2);
function enforce_free_shipping_if_coordinated_item($rates, $package) {
	$coordinated_slug = 'תיאום-שילוח-הובלה-והרכבה';
	$should_force_free_shipping = false;

	foreach ($package['contents'] as $item) {
		$product = wc_get_product($item['product_id']);
		$parent_id = $product->get_parent_id();

		if (
			has_term($coordinated_slug, 'product_cat', $product->get_id()) ||
			($parent_id && has_term($coordinated_slug, 'product_cat', $parent_id))
		) {
			$should_force_free_shipping = true;
			break;
		}
	}

	if ($should_force_free_shipping) {
		foreach ($rates as $key => $rate) {
			if ($rate->cost > 0) {
				unset($rates[$key]);
			}
		}
	}

	return $rates;
}

/* --------------------------------------------------------------------------
 * טקסט מותאם לדף עגלת הקניות אם אין שיטות משלוח זמינות
 * -------------------------------------------------------------------------- */
add_filter( 'woocommerce_no_shipping_available_html', 'custom_no_shipping_html' );
function custom_no_shipping_html() {
	return '<p>הובלה והרכבה בבית הלקוח יתואמו וישולמו בנפרד <a href="#" onclick="if(window.jQuery){jQuery.magnificPopup.open({items: {src: \"#elementor-popup-modal-30922\"},type: \"inline\"});} return false;">בשיחה עם נציג טושלולה ועל פי התנאים</a>.</p>';
}

add_filter('woocommerce_package_rates', 'custom_free_shipping_for_category', 10, 2);

function custom_free_shipping_for_category($rates, $package) {
    $free_shipping = false;

    // Loop through cart items
    foreach (WC()->cart->get_cart() as $item) {
        $product = $item['data'];
        $product_id = $product->get_id();

        // Check if product belongs to category ID 207
        if (has_term(207, 'product_cat', $product_id)) {
            $free_shipping = true;
            break;
        }
    }

    // If a product from category 207 is in the cart, remove all methods except free shipping
    if ($free_shipping) {
        foreach ($rates as $rate_key => $rate) {
            if ('free_shipping' !== $rate->method_id) {
                unset($rates[$rate_key]);
            }
        }
    }

    return $rates;
}


-=-=-=

document.addEventListener('DOMContentLoaded', function () {
    const shippingTitle = document.querySelector('.woocommerce-shipping-methods');

    if (shippingTitle > 1) {
        const popupLink = document.createElement('a');
        popupLink.href = '#';
        popupLink.className = 'popmake-5807';
        popupLink.style.display = 'block';
        popupLink.style.margin = '10px 0';
        popupLink.innerText = 'לצפייה במחירי משלוחים והרכבה לחצו כאן';

        shippingTitle.parentNode.insertBefore(popupLink, shippingTitle);
    }
});




	
jQuery(function($) {
    let checkCount = 0;
    const maxChecks = 10;

    const interval = setInterval(() => {
        const $shippingRow = $('tr.woocommerce-shipping-totals.shipping');
        const $cartRows = $('.woocommerce-checkout-review-order-table .cart_item');

        if ($shippingRow.length && $cartRows.length) {
            let subtotal = 0;
            let foundCat207 = false;

            $cartRows.each(function () {
                const productName = $(this).find('.product-name').text().trim();
                const priceText = $(this).find('.product-total .amount').text().replace(/[^\d.]/g, '');
                const price = parseFloat(priceText) || 0;

                subtotal += price;

                // Simulated category match
                if (productName.includes('twins') || productName.includes('מיטת חבר')) {
                    foundCat207 = true;
                }
            });

            const qualifies = foundCat207 || subtotal >= 2000;

            if (qualifies) {
		console.log(1);
                $shippingRow.replaceWith(`
                    <tr class="woocommerce-shipping-totals shipping">
                        <th>משלוח</th>
                        <td data-title="משלוח">
                            <strong>משלוח חינם לבית הלקוח</strong>
                        </td>
                    </tr>
                `);

                $('.woocommerce-shipping-calculator, .shipping-calculator-button, #shipping_method').remove();
                clearInterval(interval);
            }
        }

        checkCount++;
        if (checkCount >= maxChecks) {
            clearInterval(interval);
        }
    }, 1500);
});
