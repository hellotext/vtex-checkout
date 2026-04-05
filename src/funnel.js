import Hellotext from "@hellotext/hellotext/vanilla";
import { extractUserData } from "./utils";

export default {
  initialize: (businessId) => {
    Hellotext.initialize(businessId);

    const handleUpdate = (orderForm) => {
      const user = extractUserData(orderForm);

      if (user.email || user.phone) {
        Hellotext.identify(user.email || user.phone, user);
      }
    };

    $(window).on("orderFormUpdated.vtex", (evt, orderForm) => {
      handleUpdate(orderForm);
    });

    if (window.vtexjs?.checkout) {
      vtexjs.checkout.getOrderForm().done(handleUpdate);
    }
  },
};
