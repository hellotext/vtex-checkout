const extractUserData = (orderForm) => {
  const profile = orderForm?.clientProfileData || {};
  const preferences = orderForm?.clientPreferencesData || {};

  const user = {
    id: profile.email,
    email: profile.email,
    first_name: profile.firstName,
    last_name: profile.lastName,
    phone: profile.phone,
    document: profile.document,
    source: "vtex",
  };

  if (preferences.optinNewsLetter === true) {
    user.subscription_state = true;
  }

  return user;
};

const extractOrderData = (orderForm) => {
  const storeData = orderForm.storePreferencesData || {};
  const logisticsInfo = orderForm.shippingData?.logisticsInfo || [];

  const delivery =
    logisticsInfo.length === 0
      ? "deliver"
      : (() => {
          const pickupKeywords = [
            "pickup",
            "retir",
            "collect",
            "recolha",
            "loja",
          ];

          return logisticsInfo.some((info) => {
            const selectedSla = (info.selectedSla || "").toLowerCase();
            const selectedDeliveryChannel = (
              info.selectedDeliveryChannel || ""
            ).toLowerCase();

            return (
              selectedDeliveryChannel === "pickup-in-point" ||
              pickupKeywords.some((keyword) => selectedSla.includes(keyword))
            );
          })
            ? "collect"
            : "deliver";
        })();

  const items = (orderForm.items || []).map((item) => {
    return {
      quantity: item.quantity,
      price: {
        amount: (item.sellingPrice || 0) + (item.tax || 0),
        currency: storeData.currencyCode,
      },
      product: {
        reference: item.id,
        categories: Object.values(item.productCategories || {}),
        name: item.skuName,
        image_url: item.imageUrl,
        sku: item.id,
        source: "vtex",
        price: {
          amount: item.price || 0,
          currency: storeData.currencyCode,
        },
        brand: item.additionalInfo?.brandName,
        product: {
          reference: item.productId,
          name: item.name,
          source: "vtex",
          categories: Object.values(item.productCategories || {}),
          brand: item.additionalInfo?.brandName,
        },
      },
    };
  });

  return {
    reference: orderForm.orderGroup || orderForm.orderFormId,
    source: "vtex",
    delivery,
    items,
  };
};

export { extractUserData, extractOrderData };
