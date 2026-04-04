import Hellotext from "hellotext.js";
import { extractUserData } from "./utils";

export default {
  initialize: (businessId) => {
    Hellotext.initialize(businessId);

    const handleUpdate = (orderForm) => {
      const user = extractUserData(orderForm);

      if (user) {
        Hellotext.identify(user.id, user);
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
