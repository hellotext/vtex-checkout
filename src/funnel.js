import Hellotext from "@hellotext/hellotext/vanilla";
import { maybeTrackCheckoutStarted } from "./checkout";
import { extractUserData } from "./utils";

export default {
  initialize: (businessId) => {
    console.log(
      "[Hellotext] funnel.initialize called with businessId:",
      businessId,
    );

    try {
      console.log("[Hellotext] calling Hellotext.initialize...");
      const result = Hellotext.initialize(businessId);
      console.log("[Hellotext] Hellotext.initialize returned:", result);
      console.log("[Hellotext] Hellotext.business:", Hellotext.business);
      console.log("[Hellotext] Hellotext object:", Hellotext);
    } catch (e) {
      console.error("[Hellotext] Hellotext.initialize threw:", e);
    }

    const handleOrderForm = (orderForm) => {
      console.log("[Hellotext] handleOrderForm called with:", orderForm);

      try {
        const user = extractUserData(orderForm);
        console.log("[Hellotext] extracted user:", user);

        if (user.email || user.phone) {
          console.log(
            "[Hellotext] identifying user:",
            user.email || user.phone,
          );
          Hellotext.identify(user.email || user.phone, user);
        } else {
          console.log("[Hellotext] no email or phone, skipping identify");
        }

        console.log("[Hellotext] calling maybeTrackCheckoutStarted...");
        maybeTrackCheckoutStarted(orderForm, user);
      } catch (e) {
        console.error("[Hellotext] handleOrderForm threw:", e);
      }
    };

    if (typeof $ === "undefined") {
      console.error("[Hellotext] jQuery ($) is not defined!");
    } else {
      console.log(
        "[Hellotext] jQuery available, binding orderFormUpdated.vtex listener",
      );
      $(window).on("orderFormUpdated.vtex", (evt, orderForm) => {
        console.log("[Hellotext] orderFormUpdated.vtex event fired");
        handleOrderForm(orderForm);
      });
    }

    if (window.vtexjs?.checkout) {
      console.log(
        "[Hellotext] vtexjs.checkout available, fetching order form...",
      );
      vtexjs.checkout
        .getOrderForm()
        .done((orderForm) => {
          console.log("[Hellotext] getOrderForm done");
          handleOrderForm(orderForm);
        })
        .fail((err) => {
          console.error("[Hellotext] getOrderForm failed:", err);
        });
    } else {
      console.warn("[Hellotext] vtexjs.checkout not available at init time");
    }
  },
};
