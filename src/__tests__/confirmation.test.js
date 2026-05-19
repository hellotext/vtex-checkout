jest.mock("@hellotext/hellotext/vanilla", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    identify: jest.fn(),
    track: jest.fn(),
  },
}));

const Hellotext = require("@hellotext/hellotext/vanilla").default;
const confirmation = require("../confirmation").default;

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

describe("confirmation.initialize", () => {
  let getOrderFormMock;

  beforeEach(() => {
    jest.clearAllMocks();

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
    delete global.vtexjs;
    delete global.window.vtexjs;
  });

  it("identifies the shopper and tracks the placed order", () => {
    confirmation.initialize("business-123");

    expect(Hellotext.initialize).toHaveBeenCalledWith("business-123");
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
    expect(Hellotext.track).toHaveBeenCalledWith("order.placed", {
      user_parameters: {
        id: "test.user@example.com",
        email: "test.user@example.com",
        first_name: "Test",
        last_name: "User",
        phone: "+15555550123",
        document: "TEST-DOC-12345",
        source: "vtex",
      },
      object_parameters: {
        reference: "order-group-123",
        source: "vtex",
        delivery: "deliver",
        items: [
          expect.objectContaining({
            quantity: 1,
            product: expect.objectContaining({
              reference: "250340",
              sku: "250340",
            }),
          }),
        ],
      },
    });
  });

  it("identifies newsletter opt-in from the current order form", () => {
    const orderForm = createOrderForm();

    orderForm.clientPreferencesData = {
      optinNewsLetter: true,
    };

    getOrderFormMock = jest.fn(() => ({
      done: (callback) => callback(orderForm),
    }));
    global.window.vtexjs.checkout.getOrderForm = getOrderFormMock;

    confirmation.initialize("business-123");

    const expectedUser = {
      id: "test.user@example.com",
      email: "test.user@example.com",
      first_name: "Test",
      last_name: "User",
      phone: "+15555550123",
      document: "TEST-DOC-12345",
      source: "vtex",
      subscription_state: true,
    };

    expect(Hellotext.identify).toHaveBeenCalledWith(
      "test.user@example.com",
      expectedUser,
    );
    expect(Hellotext.track).toHaveBeenCalledWith("order.placed", {
      user_parameters: expectedUser,
      object_parameters: expect.objectContaining({
        reference: "order-group-123",
        source: "vtex",
      }),
    });
  });

  it("only initializes Hellotext when VTEX checkout is unavailable", () => {
    delete global.window.vtexjs;
    delete global.vtexjs;

    confirmation.initialize("business-123");

    expect(Hellotext.initialize).toHaveBeenCalledWith("business-123");
    expect(Hellotext.identify).not.toHaveBeenCalled();
    expect(Hellotext.track).not.toHaveBeenCalled();
  });
});
