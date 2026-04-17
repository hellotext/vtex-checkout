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

const flushAsyncWork = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

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
    window.sessionStorage.clear();
    Hellotext.track.mockResolvedValue({ succeeded: true });

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

  it("initializes Hellotext, subscribes to order updates, identifies the current shopper, and tracks checkout started", async () => {
    funnel.initialize("business-123");
    await flushAsyncWork();

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
    expect(Hellotext.track).toHaveBeenCalledWith("checkout.started", {
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

  it("tracks checkout started even when the shopper has no email or phone", async () => {
    const orderForm = createOrderForm();
    delete orderForm.clientProfileData.email;
    delete orderForm.clientProfileData.phone;

    getOrderFormMock = jest.fn(() => ({
      done: (callback) => callback(orderForm),
    }));
    global.window.vtexjs.checkout.getOrderForm = getOrderFormMock;

    funnel.initialize("business-123");
    await flushAsyncWork();

    expect(Hellotext.identify).not.toHaveBeenCalled();
    expect(Hellotext.track).toHaveBeenCalledWith("checkout.started", {
      user_parameters: {
        id: undefined,
        email: undefined,
        first_name: "Test",
        last_name: "User",
        phone: undefined,
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

  it("identifies the shopper again when VTEX emits an order update event", async () => {
    const updatedOrderForm = createOrderForm();

    updatedOrderForm.clientProfileData.email = "updated.user@example.com";
    updatedOrderForm.clientProfileData.firstName = "Updated";

    funnel.initialize("business-123");
    await flushAsyncWork();

    Hellotext.identify.mockClear();
    Hellotext.track.mockClear();
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
    expect(Hellotext.track).not.toHaveBeenCalled();
  });

  it("tracks checkout started once per order form id", async () => {
    const updatedOrderForm = createOrderForm();

    funnel.initialize("business-123");
    await flushAsyncWork();

    Hellotext.identify.mockClear();
    Hellotext.track.mockClear();
    orderFormUpdatedHandler({}, updatedOrderForm);

    expect(Hellotext.track).not.toHaveBeenCalled();
  });

  it("tracks checkout started again when VTEX updates to a new order form", async () => {
    const updatedOrderForm = createOrderForm();

    updatedOrderForm.orderFormId = "order-form-456";
    updatedOrderForm.orderGroup = "order-group-456";

    funnel.initialize("business-123");
    await flushAsyncWork();

    Hellotext.track.mockClear();
    orderFormUpdatedHandler({}, updatedOrderForm);

    expect(Hellotext.track).toHaveBeenCalledWith("checkout.started", {
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
        reference: "order-group-456",
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

  it("does not double-send checkout started while the first request is still pending", async () => {
    const updatedOrderForm = createOrderForm();
    let resolveTrack;

    Hellotext.track.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTrack = resolve;
        }),
    );

    funnel.initialize("business-123");

    expect(Hellotext.track).toHaveBeenCalledTimes(1);

    orderFormUpdatedHandler({}, updatedOrderForm);

    expect(Hellotext.track).toHaveBeenCalledTimes(1);

    resolveTrack({ succeeded: true });
    await flushAsyncWork();
  });

  it("retries checkout started for the same order form when the previous track call did not succeed", async () => {
    const updatedOrderForm = createOrderForm();

    Hellotext.track
      .mockResolvedValueOnce({ succeeded: false })
      .mockResolvedValueOnce({ succeeded: true });

    funnel.initialize("business-123");
    await flushAsyncWork();

    expect(Hellotext.track).toHaveBeenCalledTimes(1);

    orderFormUpdatedHandler({}, updatedOrderForm);
    await flushAsyncWork();

    expect(Hellotext.track).toHaveBeenCalledTimes(2);
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
    expect(Hellotext.track).not.toHaveBeenCalled();
  });
});
