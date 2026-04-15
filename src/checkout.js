import Hellotext from "@hellotext/hellotext/vanilla";
import { extractOrderData } from "./utils";

const CHECKOUT_STARTED_STORAGE_KEY = "hellotext:vtex-checkout-started";
const pendingCheckoutStartedOrderForms = new Set();

const getCheckoutStartedStorageKey = (orderFormId) => {
  return `${CHECKOUT_STARTED_STORAGE_KEY}:${orderFormId}`;
};

const hasTrackedCheckoutStarted = (orderFormId) => {
  if (!orderFormId) {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(
        getCheckoutStartedStorageKey(orderFormId),
      ) === "1"
    );
  } catch (_error) {
    return false;
  }
};

const markCheckoutStartedTracked = (orderFormId) => {
  if (!orderFormId) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getCheckoutStartedStorageKey(orderFormId),
      "1",
    );
  } catch (_error) {
    // Ignore storage failures so checkout tracking does not break the funnel.
  }
};

const maybeTrackCheckoutStarted = async (orderForm, user = {}) => {
  const orderFormId = orderForm?.orderFormId;

  if (
    !orderFormId ||
    pendingCheckoutStartedOrderForms.has(orderFormId) ||
    hasTrackedCheckoutStarted(orderFormId)
  ) {
    return;
  }

  const trackingParameters = {
    object_parameters: extractOrderData(orderForm),
    user_parameters: user,
  };

  pendingCheckoutStartedOrderForms.add(orderFormId);

  try {
    const response = await Hellotext.track(
      "checkout.started",
      trackingParameters,
    );

    if (response?.succeeded) {
      markCheckoutStartedTracked(orderFormId);
    }
  } catch (_error) {
    // Ignore tracking failures so checkout tracking does not break the funnel.
  } finally {
    pendingCheckoutStartedOrderForms.delete(orderFormId);
  }
};

export { maybeTrackCheckoutStarted };
