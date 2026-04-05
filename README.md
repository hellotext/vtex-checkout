# Hellotext for VTEX Checkout

Hellotext SDK for VTEX Checkout. Captures shopper identity during the checkout funnel — where the standard Hellotext pixel cannot run — by listening to VTEX's `orderFormUpdated` events and calling `Hellotext.identify`.

## Why

VTEX's checkout is a separate SPA from the storefront. The Hellotext pixel only runs on the storefront, so it never sees shoppers entering their email, phone, or name during checkout. This SDK bridges that gap, enabling identity capture and abandoned checkout attribution.

## Installation

Add the following script tag to your VTEX checkout configuration (**Admin > Checkout > Code > checkout6-custom.js**):

```html
<script src="https://unpkg.com/@hellotext/vtex-checkout/dist/funnel.js"></script>
<script>
  Hellotext.initialize("YOUR_BUSINESS_ID");
</script>
```

Replace `YOUR_BUSINESS_ID` with your Hellotext business ID.

## How it works

1. Initializes the Hellotext SDK with your business ID.
2. Subscribes to VTEX's `orderFormUpdated.vtex` jQuery event, which fires on every checkout state change.
3. Extracts the shopper's profile (`email`, `phone`, `firstName`, `lastName`, `document`) from the `orderForm.clientProfileData`.
4. Calls `Hellotext.identify` as soon as an email or phone is available.

## Development

```bash
yarn install
yarn build       # produces dist/funnel.js and dist/confirmation.js
yarn test        # runs jest
```
