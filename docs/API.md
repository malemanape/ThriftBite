# ThriftBite API

Every endpoint the frontend uses. Back to the [README](../README.md).

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | anyone | Sign up as `OWNER` or `CONSUMER` (owners need approval). Returns the account's one-time recovery codes |
| POST | `/api/auth/recover` | anyone | Forgot password: set a new one with a recovery code (leave `newPassword` out to only check the code) |
| POST | `/api/auth/login` | anyone | Returns a JWT to send as `Authorization: Bearer <token>` |
| GET | `/api/auth/me` | logged in | The current user |
| GET | `/api/account` | logged in | The account page: for buyers, money saved and pickup record |
| POST | `/api/account/password` | logged in | Change the password (logs out every other device) |
| POST | `/api/account/recovery-codes` | logged in | Make a new set of recovery codes (asks for the password again) |
| GET | `/api/account/export` | logged in | Download everything kept about the account, as JSON |
| POST | `/api/account/delete` | consumer | Delete the account (asks for the password again) |
| GET | `/api/items?q=&page=&size=` | anyone | Browse food for sale, soonest-expiring first; `q` is up to 120 characters |
| GET | `/api/items/{id}` | anyone | One listing |
| GET | `/api/stores/{slug}` | anyone | A store's public page: profile, what it has on sale now, and its last 30 days in numbers |
| PUT | `/api/stores/{slug}/follow` | consumer | Follow a store, or turn its alerts on or off (`{"alertsOn": false}`) |
| DELETE | `/api/stores/{slug}/follow` | consumer | Unfollow |
| GET | `/api/follows` | consumer | The stores you follow |
| GET | `/api/alerts` | consumer | Your alerts from the last two weeks, with the unread count |
| GET | `/api/alerts/count` | consumer | Just the unread count, for the number on the nav |
| POST | `/api/alerts/read`, `/api/alerts/{id}/read` | consumer | Mark all, or one, as read |
| GET | `/api/owner/items` | owner | Your own listings |
| POST | `/api/owner/items` | owner | Create a listing; `art` picks the food drawing shown without a photo (`rice-bowl`, `veg-bowl`, `cup`, `buns`, `swirl`, `long-bread`, `rolls`, `loaf`, `croissant`, or null) |
| PUT | `/api/owner/items/{id}` | owner | Edit a listing (send the `version` you loaded) |
| DELETE | `/api/owner/items/{id}` | owner | Remove a listing |
| GET | `/api/owner/items/usual?for=` | owner | "Post again": what the store usually lists and how it went last time, for today or tomorrow |
| POST | `/api/owner/items/batch` | owner | Post several listings with one pickup window, all or nothing |
| GET | `/api/owner/staff` | owner | The store's staff accounts (the owner only, not staff) |
| POST | `/api/owner/staff` | owner | Add a staff account; returns a temporary password, once |
| POST | `/api/owner/staff/{id}/password` | owner | Give a staff member a new temporary password and log them out |
| DELETE | `/api/owner/staff/{id}` | owner | Remove a staff account |
| POST | `/api/account/close-store` | owner | Close the store for good (needs the owner's password) |
| POST | `/api/owner/photos` | owner | Upload a photo (`multipart/form-data`, field `file`, JPG or PNG up to 6 MB); put the `id` it returns on a listing or the store profile as `photoId` |
| GET | `/api/photos/{id}` | anyone | A photo as a JPEG; add `?size=thumb` for the small one used in lists |
| GET | `/api/owner/store` | owner | Your store profile |
| PUT | `/api/owner/store` | owner | Save the profile: address, landmark, opening hours, usual pickup window, GCash (send the `version` you loaded) |
| GET | `/api/cart` | consumer | Your cart, with a warning on lines that sold out |
| PUT | `/api/cart/items/{itemId}` | consumer | Add an item or change its quantity (`0` removes it) |
| POST | `/api/checkout` | consumer | Reserve everything in the cart, all or nothing: one reservation and claim code per store |
| GET | `/api/reservations` | consumer | Your reservations and claim codes |
| POST | `/api/reservations/{id}/cancel` | consumer | Cancel before pickup (stock goes back on sale) |
| POST | `/api/reports` | consumer | Report a problem with one of your pickups (`reservationId`) or with a store (`storeSlug`) |
| GET | `/api/reports` | consumer | The problems you reported, and the admin's reply once there is one |
| GET | `/api/owner/reservations` | owner | Pickups waiting at your store |
| POST | `/api/owner/reservations/{id}/complete` | owner | Hand over the food after checking the buyer's claim code |
| GET | `/api/owner/stats?from=&to=` | owner | Sales for your store: money made, share of listed food sold, leftovers by weekday, pickups by hour, per-item results (Manila days; default the last 7 full days) |
| GET | `/api/admin/owners/pending` | admin | Owners waiting for approval |
| POST | `/api/admin/users/{id}/approve` | admin | Approve an owner |
| GET | `/api/admin/users?q=&show=` | admin | Buyers and stores, by username or store name; `show` is `buyers`, `stores` or `suspended` |
| POST | `/api/admin/users/{id}/suspend` | admin | Suspend an account, with a reason the account holder is shown |
| POST | `/api/admin/users/{id}/unsuspend` | admin | Lift a suspension |
| GET | `/api/admin/summary` | admin | How many stores and reports are waiting |
| GET | `/api/admin/reports?status=` | admin | Problem reports: `open` (longest wait first) or `resolved` |
| POST | `/api/admin/reports/{id}/resolve` | admin | Reply to the buyer and close the report; `excuseMiss: true` also stops the missed pickup it's about counting against the buyer |
| GET | `/api/admin/activity` | admin | What admins did, newest first |
| WS | `/ws` | anyone | Live updates (see below); log in by sending the token as the first message |
| GET | `/api/demo` | anyone | Demo accounts and when the demo data next resets (demo deployments only) |
| POST | `/api/demo/login` | anyone | Log in as the demo `BUYER`, `OWNER` or `ADMIN` (demo deployments only) |

Errors use the standard [problem details](https://www.rfc-editor.org/rfc/rfc9457) JSON format, with a `code` field where the frontend needs to tell cases apart (`rate_limited`, `login_locked`, `claim_code_locked`, `account_not_approved`, `account_suspended`, `pickup_block`, `report_limit`).
