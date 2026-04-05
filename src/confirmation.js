import Hellotext from "@hellotext/hellotext/vanilla";
import { extractUserData, extractOrderData } from "./utils";

export default {
  initialize: (businessId) => {
    Hellotext.initialize(businessId);

    if (window.vtexjs?.checkout) {
      vtexjs.checkout.getOrderForm().done((orderForm) => {
        const user = extractUserData(orderForm);
        const order = extractOrderData(orderForm);

        if (user.email || user.phone) {
          Hellotext.identify(user.email || user.phone, user);

          Hellotext.track("order.placed", {
            user_parameters: user,
            object_parameters: order,
          });
        }
      });
    }
  },
};
