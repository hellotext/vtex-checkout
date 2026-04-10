jest.mock("@hellotext/hellotext/vanilla", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    identify: jest.fn(),
    track: jest.fn(),
  },
}));

const Hellotext = require("@hellotext/hellotext/vanilla").default;
const funnel = require("../funnel").default;

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

describe("funnel.initialize", () => {
  let onMock;
  let orderFormUpdatedHandler;
  let getOrderFormMock;

  beforeEach(() => {
    jest.clearAllMocks();

    orderFormUpdatedHandler = undefined;

    onMock = jest.fn((eventName, handler) => {
      orderFormUpdatedHandler = handler;
    });

    global.$ = jest.fn(() => ({
      on: onMock,
    }));

    getOrderFormMock = jest.fn(() => ({
      done: (callback) => callback(createOrderForm()),
    }));

    global.window.vtexjs = {
      checkout: {
        getOrderForm: getOrderFormMock,
      },
    };
    global.vtexjs = global.window.vtexjs;
  });

  afterEach(() => {
    delete global.$;
    delete global.vtexjs;
    delete global.window.vtexjs;
  });

  it("initializes Hellotext, subscribes to order updates, and identifies the current shopper", () => {
    funnel.initialize("business-123");

    expect(Hellotext.initialize).toHaveBeenCalledWith("business-123");
    expect(global.$).toHaveBeenCalledWith(global.window);
    expect(onMock).toHaveBeenCalledWith(
      "orderFormUpdated.vtex",
      expect.any(Function),
    );
    expect(getOrderFormMock).toHaveBeenCalledTimes(1);
    expect(Hellotext.identify).toHaveBeenCalledWith("test.user@example.com", {
      id: "test.user@example.com",
      email: "test.user@example.com",
      first_name: "Test",
      last_name: "User",
      phone: "+15555550123",
      document: "TEST-DOC-12345",
      source: "vtex",
    });
  });

  it("does not identify when the shopper has no email or phone", () => {
    const orderForm = createOrderForm();
    delete orderForm.clientProfileData.email;
    delete orderForm.clientProfileData.phone;

    getOrderFormMock = jest.fn(() => ({
      done: (callback) => callback(orderForm),
    }));
    global.window.vtexjs.checkout.getOrderForm = getOrderFormMock;

    funnel.initialize("business-123");

    expect(Hellotext.identify).not.toHaveBeenCalled();
  });

  it("identifies the shopper again when VTEX emits an order update event", () => {
    const updatedOrderForm = createOrderForm();

    updatedOrderForm.clientProfileData.email = "updated.user@example.com";
    updatedOrderForm.clientProfileData.firstName = "Updated";

    funnel.initialize("business-123");

    Hellotext.identify.mockClear();
    orderFormUpdatedHandler({}, updatedOrderForm);

    expect(Hellotext.identify).toHaveBeenCalledWith(
      "updated.user@example.com",
      {
        id: "updated.user@example.com",
        email: "updated.user@example.com",
        first_name: "Updated",
        last_name: "User",
        phone: "+15555550123",
        document: "TEST-DOC-12345",
        source: "vtex",
      },
    );
  });

  it("still wires the VTEX event listener when checkout is not available", () => {
    delete global.window.vtexjs;
    delete global.vtexjs;

    funnel.initialize("business-123");

    expect(Hellotext.initialize).toHaveBeenCalledWith("business-123");
    expect(onMock).toHaveBeenCalledWith(
      "orderFormUpdated.vtex",
      expect.any(Function),
    );
    expect(Hellotext.identify).not.toHaveBeenCalled();
  });
});
