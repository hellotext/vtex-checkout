const { extractOrderData, extractUserData } = require("../utils");

const createOrderForm = () => ({
  orderFormId: "order-form-123",
  orderGroup: "order-group-123",
  value: 109995000,
  storePreferencesData: {
    currencyCode: "COP",
  },
  shippingData: {
    logisticsInfo: [
      {
        itemIndex: 0,
        selectedSla: null,
        selectedDeliveryChannel: null,
        itemId: "250340",
      },
    ],
  },
  clientProfileData: {
    email: "test.user@example.com",
    firstName: "Test",
    lastName: "User",
    document: "TEST-DOC-12345",
    phone: "+15555550123",
  },
  items: [
    {
      id: "250340",
      productId: "46006",
      name: "Demo running shoe",
      skuName: "Size 8",
      tax: 0,
      price: 109995000,
      sellingPrice: 109995000,
      productCategories: {
        1: "Hombre",
        2: "Tenis",
        3: "Correr",
      },
      quantity: 1,
      imageUrl: "https://example.com/demo-running-shoe.png",
      additionalInfo: {
        brandName: "ON",
      },
    },
  ],
});

describe("extractUserData", () => {
  it("maps the VTEX client profile into a Hellotext user payload", () => {
    const orderForm = createOrderForm();

    expect(extractUserData(orderForm)).toEqual({
      id: "test.user@example.com",
      email: "test.user@example.com",
      first_name: "Test",
      last_name: "User",
      phone: "+15555550123",
      document: "TEST-DOC-12345",
      source: "vtex",
    });
  });

  it("maps VTEX newsletter opt-in into a Hellotext subscribe signal", () => {
    const orderForm = createOrderForm();

    orderForm.clientPreferencesData = {
      optinNewsLetter: true,
    };

    expect(extractUserData(orderForm)).toEqual(
      expect.objectContaining({
        subscription_state: true,
      }),
    );
  });

  it("does not send a subscription state when VTEX newsletter opt-in is false", () => {
    const orderForm = createOrderForm();

    orderForm.clientPreferencesData = {
      optinNewsLetter: false,
    };

    expect(extractUserData(orderForm)).not.toHaveProperty(
      "subscription_state",
    );
  });
});

describe("extractOrderData", () => {
  it("maps the order form into the expected order payload", () => {
    const orderForm = createOrderForm();

    expect(extractOrderData(orderForm)).toEqual({
      reference: "order-group-123",
      source: "vtex",
      delivery: "deliver",
      items: [
        {
          quantity: 1,
          price: {
            amount: 109995000,
            currency: "COP",
          },
          product: {
            reference: "250340",
            categories: ["Hombre", "Tenis", "Correr"],
            name: "Size 8",
            image_url: "https://example.com/demo-running-shoe.png",
            sku: "250340",
            source: "vtex",
            price: {
              amount: 109995000,
              currency: "COP",
            },
            brand: "ON",
            product: {
              reference: "46006",
              name: "Demo running shoe",
              source: "vtex",
              categories: ["Hombre", "Tenis", "Correr"],
              brand: "ON",
            },
          },
        },
      ],
    });
  });

  it("marks pickup orders as collect when VTEX selects pickup-in-point", () => {
    const orderForm = createOrderForm();

    orderForm.shippingData.logisticsInfo[0].selectedDeliveryChannel =
      "pickup-in-point";

    expect(extractOrderData(orderForm).delivery).toBe("collect");
  });

  it("marks pickup orders as collect when the selected SLA includes a pickup keyword", () => {
    const orderForm = createOrderForm();

    orderForm.shippingData.logisticsInfo[0].selectedSla = "Retira en tienda";

    expect(extractOrderData(orderForm).delivery).toBe("collect");
  });
});
