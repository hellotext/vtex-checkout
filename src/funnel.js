import Hellotext from "@hellotext/hellotext/vanilla";
import { maybeTrackCheckoutStarted } from "./checkout";
import { extractUserData } from "./utils";

export default {
  initialize: (businessId) => {
    Hellotext.initialize(businessId);

    const handleOrderForm = (orderForm) => {
      const user = extractUserData(orderForm);

      if (user.email || user.phone) {
        Hellotext.identify(user.email || user.phone, user);
      }

      maybeTrackCheckoutStarted(orderForm, user);
    };

    $(window).on("orderFormUpdated.vtex", (evt, orderForm) => {
      handleOrderForm(orderForm);
    });

    if (window.vtexjs?.checkout) {
      vtexjs.checkout.getOrderForm().done(handleOrderForm);
    }
  },
};
