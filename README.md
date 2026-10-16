# Buy Gold Cal

A purchase calculator for Myanmar gold jewellery. Enter an item's weight in
kyat/pae/ywe, pick a purity, add stones and a crafting fee, and it prices the
piece and issues a numbered receipt you can save as an image.

Bilingual (English / မြန်မာ), light and dark themes, works on a phone browser.

---

## What it does

- Prices gold by purity against a single 16K base rate you set once a day
- Handles plain gold, gold + gem, and gold + diamond items
- Stone cost either calculated from a rate or typed in directly (Calculate / Fixed)
- Produces an itemised **purchase receipt** with a stable 10-digit invoice number
- Saves invoices per account to Firestore; history, edit and compare screens
- Sign in with Google, email/password, or phone OTP

---

## The arithmetic

**Weight units**

```
1 K (kyat) = 16 P (pae) = 128 Y (ywe)
1 Y        = 0.8 Yt (yati)          # gems are priced per Yt
```

**Purity rates**, derived from the 16K price `x`. Every purity follows the same
`16 / (32 − q)` rule:

| Purity | Formula | Ratio | At 5,000,000 |
|--------|---------|-------|--------------|
| 16K    | `x`           | 1.00000 | 5,000,000 |
| 15K    | `x × 16/17`   | 0.94118 | 4,705,882 |
| 14.5K  | `x × 16/17.5` | 0.91429 | 4,571,429 |
| 14K    | `x × 16/18`   | 0.88889 | 4,444,444 |
| 12K    | `x × 16/20`   | 0.80000 | 4,000,000 |

**Diamond weight** converts to kyat as `(x × 1.25) / 128`.

**Total** = gold cost + stone cost + crafting fee, where the gold weight is the
item weight plus loss weight, minus any stone weight.

---

## Running it locally

There is no build step, but the pages use ES modules, so they must be served
over HTTP — opening `index.html` from the filesystem will not work.

```bash
python -m http.server 5050
```

Then open <http://localhost:5050>. Use `localhost` rather than `127.0.0.1`:
Firebase authorises `localhost` by default, and Google sign-in will fail on an
unlisted host with `auth/unauthorized-domain`.

---

## Firebase setup

Follow [SETUP.md](SETUP.md) to create the project, enable the three sign-in
providers, and create the Firestore database. Then paste your config into
`firebase-config.js`.

### Security rules

The config in `firebase-config.js` is **public by design** — Firebase web API
keys ship to every browser that loads the app, so they are not secrets. The
actual protection is [`firestore.rules`](firestore.rules), which restricts every
document to the account that owns it.

Deploy them, then confirm anonymous access is refused:

```bash
curl -s "https://firestore.googleapis.com/v1/projects/<project-id>/databases/(default)/documents/users?key=<web-api-key>"
```

`PERMISSION_DENIED` is the correct result. If that returns document data, the
rules are not applied and every user's invoices are readable.

---

## Layout

| File | Purpose |
|------|---------|
| `index.html` / `app.js` | The calculator, pricing screen and receipt |
| `signin.html` | Google / email / phone sign-in |
| `profile.html` | Profile, saved invoice list, receipt viewer |
| `history.html` | History management (delete) |
| `compare.html` | Side-by-side invoice comparison |
| `i18n.js` | Shared EN/MM dictionary — single source of truth |
| `auth-utils.js` | Firebase auth and Firestore helpers |
| `firebase-config.js` | Firebase project config |
| `invoice.html` / `invoice.js` | Print Invoice page — issue, print, export PDF |
| `firestore.rules` | Firestore security rules |

Styles are split across `styles.css` (shared), `auth.css` and `profile.css`.

---

## Notes

- Invoice numbers are `DDMMYY` + a 4-digit per-day sequence, with **separate
  sequences for sales and purchases**. They are assigned once and **stored on
  the document** — never re-derived from list position, or deleting one
  invoice would renumber every later one.
- Numbers come from a daily counter in Firestore
  (`users/{uid}/invoiceCounters/{DDMMYY}-{sale|purchase}`), claimed in a
  transaction and shared by the calculator and the Print Invoice page, so the
  two can never hand out the same number — even across devices.
- The Print Invoice page **issues** an invoice the first time it is exported
  or printed: it is validated, numbered, and recorded in
  `users/{uid}/invoices` with the customer's details. Re-printing unchanged
  content does not issue a second one. Issuing requires sign-in.
- An invoice printed from a saved calculation keeps that calculation's number.
- `i18n.js` is the only place translations belong. Both language blocks must
  hold the same keys.
- Fonts, the 7-segment display face and `html2canvas` load from CDNs, so image
  export and some styling need a network connection.
