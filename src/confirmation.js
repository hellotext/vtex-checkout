import Hellotext from "@hellotext/hellotext";
import { extractUserData, extractOrderData } from "./utils";

export default {
  initialize: (businessId) => {
    Hellotext.initialize(businessId);

    if (window.vtexjs?.checkout) {
      vtexjs.checkout.getOrderForm().done((orderForm) => {
        const user = extractUserData(orderForm);
        const order = extractOrderData(orderForm);

        if (user) {
          Hellotext.identify(user.id, user);
        }

        Hellotext.track("order.placed", {
          user_parameters: user,
          object_parameters: order,
        });
      });
    }
  },
};
