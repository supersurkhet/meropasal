# MeroPasal — Comprehensive Test Plan

This document describes every feature and flow that must be tested end-to-end. An AI agent should be able to follow this plan to verify the entire application works correctly.

## Prerequisites

1. Start the dev server: `cd apps/web && bun run dev`
2. Start Convex: `npx convex dev` (from project root)
3. Open `http://localhost:5173` in a browser
4. Have WorkOS credentials configured in `.env`

---

## 1. Authentication (WorkOS)

### 1.1 Login Flow
- [ ] Navigate to `/login` — should see login page with WorkOS redirect button
- [ ] Click login — should redirect to WorkOS AuthKit hosted login
- [ ] After authentication — should redirect back to `/callback` then to `/dashboard`
- [ ] Session cookie should be set (HTTP-only, secure)
- [ ] Refreshing the page should maintain the session

### 1.2 Logout Flow
- [ ] Click logout in topbar — should clear session and redirect to `/login`
- [ ] Navigating to any `(app)/` route while logged out should redirect to `/login`

### 1.3 Organization Context
- [ ] After login, user should see their org name in the topbar
- [ ] If user is member of multiple orgs, org switcher should work
- [ ] All data queries should be scoped to the current org

---

## 2. App Shell & Navigation

### 2.1 Sidebar
- [ ] Sidebar should show all module links: Dashboard, Parties, Customers, Products, Stock Import, Sales, Orders, Invoices, Stock Book, Ledger, Vehicles, Trips, Reports, Settings
- [ ] Each link should have the correct icon (lucide-svelte)
- [ ] Clicking a link should navigate to the correct route
- [ ] Active route should be visually highlighted
- [ ] Sidebar should be collapsible (collapse button works)
- [ ] On mobile: sidebar should be hidden behind a hamburger menu (Sheet component)

### 2.2 Topbar
- [ ] Should show org name, user avatar, and action buttons
- [ ] Mobile hamburger button should toggle sidebar sheet

### 2.3 Responsive Design
- [ ] Desktop (>1024px): sidebar always visible, content fills remaining space
- [ ] Tablet (768-1024px): sidebar collapsible
- [ ] Mobile (<768px): sidebar hidden, accessible via hamburger menu

### 2.4 Dark Mode
- [ ] Should respect system preference
- [ ] Zinc color scheme should look consistent in both modes

---

## 3. Parties (Suppliers) Module

### 3.1 List View (`/parties`)
- [ ] Should show all active parties in a data table
- [ ] Table columns: Name, PAN Number, Phone, Credit Limit, Actions
- [ ] Should have a "New Party" button
- [ ] Should have search/filter functionality
- [ ] Real-time: creating a party in another tab should auto-appear

### 3.2 Create Party (`/parties/new`)
- [ ] Form fields: Name (required), PAN Number, Address, Phone, Credit Limit, Payment Terms, Notes
- [ ] Name is required — form should not submit without it
- [ ] Credit Limit should only accept positive numbers
- [ ] After create — should redirect to parties list
- [ ] New party should appear in the list immediately (real-time)

### 3.3 Edit Party (`/parties/[id]`)
- [ ] Should load existing party data into form
- [ ] Should be able to update any field
- [ ] Save should update in real-time

### 3.4 Delete/Deactivate Party
- [ ] Should soft-delete (set isActive: false)
- [ ] Deactivated parties should not appear in list
- [ ] Deactivated parties should not appear in select dropdowns

### 3.5 Inline Creation
- [ ] From Stock Import form, clicking "+" next to party selector should open inline create dialog
- [ ] Creating a party inline should auto-select it in the parent form
- [ ] Dialog should close after creation, parent form state preserved

---

## 4. Customers Module

### 4.1 List View (`/customers`)
- [ ] Same as parties but for customers
- [ ] Additional field: Email

### 4.2 CRUD Operations
- [ ] Create, edit, deactivate — same patterns as parties
- [ ] Inline creation from Sale and Order forms

---

## 5. Products Module

### 5.1 List View (`/products`)
- [ ] Table columns: Title, Supplier, Cost Price, Selling Price, Unit, Stock, Category, Actions
- [ ] Should have search functionality (full-text search via Convex search index)
- [ ] Filter by category and supplier

### 5.2 Create Product (`/products/new`)
- [ ] Form fields: Title (required), Supplier (select from parties, with inline create), Unit, Cost Price, Selling Price, Opening Stock, HS Code, Barcode, SKU, Category, Reorder Level, Description
- [ ] **Smart defaults**: When cost price is entered, selling price should auto-fill as cost × 1.10 (10% markup)
- [ ] **Smart defaults**: Reorder level should auto-fill as ceil(openingStock × 0.1)
- [ ] **Compound unit**: Entering "box:12" in unit field should be accepted
- [ ] Supplier select should show inline create "+" button

### 5.3 Edit Product
- [ ] Changing cost price should prompt: "Update selling price to ₹X (+10%)?"
- [ ] All fields editable

### 5.4 Search
- [ ] Typing in search box should search product titles
- [ ] Results should update in real-time

---

## 6. Stock Import Module

### 6.1 Import Flow (`/stock-import/new`)
- [ ] Step 1: Select party (supplier) — with inline create "+"
- [ ] Step 2: Add items — product selector should auto-filter to selected party's products only
- [ ] Each item: Product (select), Quantity, Unit (select if compound), Unit Price (auto-fills from product.costPrice)
- [ ] Unit price should adjust for compound units (e.g., if product is "box:12" and user selects "piece", price = costPrice/12)
- [ ] Total amount should auto-calculate (sum of quantity × unitPrice for each item)
- [ ] Add multiple line items
- [ ] Remove line items

### 6.2 On Submit
- [ ] Should auto-create a purchase invoice (type: "purchase")
- [ ] Invoice number should be auto-generated: `PUR-{fiscalYear}-{sequence}`
- [ ] Should create stock book entries (direction: in, movementType: purchase) for each item
- [ ] Stock should increase in stock book aggregation
- [ ] Should redirect to stock import list

### 6.3 List View (`/stock-import`)
- [ ] Should show all stock imports with date, party, total amount
- [ ] Clicking should navigate to detail/invoice view

---

## 7. Sales Module

### 7.1 Sale Flow (`/sales/new`)
- [ ] Select customer — with inline create "+"
- [ ] Add items — all products available (not filtered by party)
- [ ] Unit price auto-fills from product.sellingPrice
- [ ] **Stock validation**: Show available stock next to quantity input
- [ ] If quantity > available stock → red warning, prevent submission
- [ ] Stock availability should be per supplier bucket (not just total)

### 7.2 On Submit
- [ ] Should auto-create a sale invoice (type: "sale")
- [ ] Should create stock book entries (direction: out, movementType: sale)
- [ ] Stock should decrease in stock book aggregation
- [ ] Should deduct from correct supplier bucket

### 7.3 List View (`/sales`)
- [ ] Show all sales with date, customer, total amount

---

## 8. Orders Module

### 8.1 Create Order (`/orders/new` or within `/orders`)
- [ ] Select customer
- [ ] Add items with quantities
- [ ] Add optional payments (paidAt, paidAmount, paymentMethod, bankVoucherNumber)
- [ ] Payment status auto-derives:
  - paidAmount = 0 → "pending"
  - 0 < paidAmount < totalAmount → "partial (₹X to pay)"
  - paidAmount = totalAmount → "paid"
  - paidAmount > totalAmount → "overpaid (invalid)"
- [ ] Order status: pending (default)
- [ ] Bank voucher number required when paymentMethod is "bankTransfer" or "check"

### 8.2 Add Payment (`/orders/[id]`)
- [ ] Should be able to add payments to existing order
- [ ] Payment status should update in real-time
- [ ] When fully paid → prompt to mark order as "done"

### 8.3 Mark as Done
- [ ] Should validate stock availability before completing
- [ ] Should auto-create sale invoice + stock book entries
- [ ] Order status changes to "done", fields become read-only
- [ ] Should not be able to add payments after "done"

### 8.4 Cancel Order
- [ ] Should change status to "cancelled"
- [ ] Should NOT create invoice or stock entries

---

## 9. Invoices Module (Read-Only)

### 9.1 List View (`/invoices`)
- [ ] Show all auto-generated invoices
- [ ] Filter by: type (purchase/sale), fiscal year, payment status
- [ ] Columns: Invoice #, Type, Party, Date, Total, Status

### 9.2 Invoice Detail (`/invoices/[id]`)
- [ ] Show full invoice: header (business info, party info), line items table, payments, totals
- [ ] Should NOT be editable (read-only)

### 9.3 Print Invoice
- [ ] "Print" button should open print view
- [ ] Should apply org's bill template (if customized)
- [ ] Paper size should match template setting (A4, A5, thermal)
- [ ] Print preview should look professional

---

## 10. Stock Book Module

### 10.1 Aggregated View (`/stock-book`)
- [ ] Show available stock per product
- [ ] Expand each product to see per-supplier-bucket breakdown
- [ ] Quantities should reflect all movements: opening + purchases - sales - dispatches + returns
- [ ] Should be filterable by fiscal year

### 10.2 Entries View (`/stock-book/entries`)
- [ ] Show raw stock book entries in chronological order
- [ ] Columns: Date, Product, Movement Type, Direction, Qty In, Qty Out, Unit Rate, Total, Source, Particulars
- [ ] Filter by product, movement type, fiscal year

### 10.3 Stock Accuracy
- [ ] After a purchase: stock should increase for that product under that supplier bucket
- [ ] After a sale: stock should decrease from the correct supplier bucket
- [ ] After trip dispatch: stock should decrease (tripDispatch, out)
- [ ] After trip return: stock should increase for returned items (tripReturn, in)
- [ ] Net sold from trip = dispatched - returned

### 10.4 Fiscal Close (`/stock-book/fiscal-close`)
- [ ] Should show current fiscal year and available stock snapshot
- [ ] "Close Fiscal Year" button should:
  - Create closing entries (direction: out, movementType: closing) for all products
  - Create opening entries (direction: in, movementType: opening) for next FY
  - Update org's current fiscal year
- [ ] After close: new FY should show only opening balances

---

## 11. Ledger Module

### 11.1 Ledger View (`/ledger`)
- [ ] Show all ledger entries in double-entry format
- [ ] Filter by account, fiscal year, date range, voucher type
- [ ] Each entry should show: Date, Account, Debit, Credit, Narration, Voucher Type

### 11.2 Chart of Accounts (`/ledger/accounts`)
- [ ] Show all accounts with code, name, type (asset/liability/equity/revenue/expense)
- [ ] System accounts (created during org init) should not be deletable

### 11.3 Trial Balance
- [ ] Total debits should equal total credits (always balanced)
- [ ] Should be filterable by fiscal year

### 11.4 Auto-Generated Entries
- [ ] Purchase invoice → Debit: Inventory, Credit: Accounts Payable
- [ ] Sale invoice → Debit: Accounts Receivable, Credit: Sales Revenue
- [ ] Payment received → Debit: Cash/Bank, Credit: Accounts Receivable
- [ ] All entries should be balanced (debit = credit per transaction)

---

## 12. Logistics — Vehicles

### 12.1 CRUD (`/logistics/vehicles`)
- [ ] List all vehicles: Name, License Plate, Description
- [ ] Create, edit, deactivate vehicles
- [ ] Inline creation from Trip form

---

## 13. Logistics — Trips

### 13.1 Create Trip (`/logistics/trips/new`)
- [ ] Select vehicle (with inline create)
- [ ] Set dispatch time (defaults to now)
- [ ] Set destination (optional)
- [ ] Add products to dispatch: Product, Quantity, Unit Price
- [ ] Products should show available stock

### 13.2 On Dispatch (Submit)
- [ ] Status should be "dispatched"
- [ ] Should create stock book entries: movementType=tripDispatch, direction=out
- [ ] Stock should decrease

### 13.3 Return Trip (`/logistics/trips/[id]`)
- [ ] Set return time
- [ ] Enter returned products (pre-filled with dispatched quantities)
- [ ] User reduces quantities for items that were sold
- [ ] "Mark all returned" button (nothing sold)

### 13.4 On Return
- [ ] Should create stock book entries for returns: movementType=tripReturn, direction=in
- [ ] Should auto-calculate sold = dispatched - returned
- [ ] Should auto-create sale invoice for sold items
- [ ] Should create stock book entries for sales: movementType=sale, direction=out
- [ ] Status changes to "returned"

### 13.5 Validation
- [ ] Cannot return more than dispatched for any product
- [ ] Cannot dispatch more than available stock

---

## 14. Reports & Dashboard

### 14.1 Dashboard (`/dashboard`)
- [ ] KPI cards: Total Revenue, Total Expenses, Outstanding Payments, Low Stock Items
- [ ] Revenue/expense should come from invoice data for current fiscal year
- [ ] Outstanding = invoices where paymentStatus != "paid"
- [ ] Low stock = products where current stock < reorderLevel

### 14.2 Sales Report (`/reports/sales`)
- [ ] Sales by period (daily/weekly/monthly)
- [ ] Top selling products
- [ ] Revenue trends

### 14.3 Inventory Report (`/reports/inventory`)
- [ ] Current stock levels per product
- [ ] Low stock alerts
- [ ] Stock movement history

### 14.4 Financial Report (`/reports/financial`)
- [ ] Revenue vs expenses
- [ ] Profit/loss
- [ ] Outstanding receivables/payables

---

## 15. Settings

### 15.1 Org Settings (`/settings`)
- [ ] Edit business name, location, phone, PAN number
- [ ] Upload logo
- [ ] Set current fiscal year
- [ ] Toggle features (invoicing, stockBook, logistics, ledger)

### 15.2 Members (`/settings/members`)
- [ ] List org members with roles
- [ ] Invite new members (via WorkOS)
- [ ] Assign roles: owner, manager, accountant, sales, warehouse, driver

### 15.3 Bill Template (`/settings/bill-template`)
- [ ] Customize invoice print layout
- [ ] Toggle header fields, logo position, column order
- [ ] Set paper size (A4, A5, thermal-80mm, thermal-58mm)
- [ ] Set font size
- [ ] Custom footer text
- [ ] Live preview as settings change
- [ ] Save multiple templates
- [ ] Set default template

---

## 16. Internationalization (i18n)

### 16.1 Language Switching
- [ ] Language switcher in topbar
- [ ] Switch between English and Nepali (नेपाली)
- [ ] All navigation labels should translate
- [ ] All form labels should translate
- [ ] All button text should translate
- [ ] All status labels should translate

### 16.2 Nepali Date Support
- [ ] Date pickers should support AD (English) and BS (Nepali Bikram Sambat)
- [ ] When language is Nepali: dates default to BS format
- [ ] Fiscal year always shows in BS format (e.g., "82/83")
- [ ] Currency formatted with Nepali locale when in ne mode

### 16.3 Nepali Typography
- [ ] Mukta font should be used for Devanagari text
- [ ] All Nepali text should render correctly

---

## 17. Inline Creation (Cross-Module)

This is a critical UX pattern — test it across all flows:

| Parent Flow | Entity to Create Inline | How |
|---|---|---|
| Stock Import → party select | New Party | "+" button opens dialog |
| Stock Import → item → product | New Product | "+" button opens dialog |
| Sale → customer select | New Customer | "+" button opens dialog |
| Order → customer select | New Customer | "+" button opens dialog |
| Product → supplier select | New Party | "+" button opens dialog |
| Trip → vehicle select | New Vehicle | "+" button opens dialog |

For each:
- [ ] "+" button is visible next to the select
- [ ] Clicking opens a dialog with the mini-form
- [ ] Form validates correctly
- [ ] On save: entity is created, dialog closes, parent form auto-selects new entity
- [ ] Parent form state is NOT lost (other filled fields preserved)

---

## 18. Smart Automation

### 18.1 Product Smart Defaults
- [ ] Entering costPrice auto-fills sellingPrice as cost × 1.10
- [ ] sellingPrice is editable after auto-fill
- [ ] Entering openingStock auto-fills reorderLevel as ceil(stock × 0.1)
- [ ] Changing costPrice on edit prompts to update sellingPrice

### 18.2 Invoice Auto-Numbering
- [ ] Purchase invoices: PUR-{FY}-{0001, 0002, ...}
- [ ] Sale invoices: SAL-{FY}-{0001, 0002, ...}
- [ ] Numbers are sequential per fiscal year per type
- [ ] No duplicates

### 18.3 Fiscal Year Auto-Detection
- [ ] Current fiscal year auto-detected from Nepali date
- [ ] Banner warning if operating in previous FY

### 18.4 Payment Auto-Derivation
- [ ] Payment status always computed from paidAmount vs totalAmount
- [ ] Never manually editable

---

## 19. Multi-Tenant Isolation

### 19.1 Data Isolation
- [ ] Create data in Org A → switch to Org B → data should NOT be visible
- [ ] All queries filtered by orgId
- [ ] Cannot access another org's data by manipulating URLs or API calls

### 19.2 Org-Specific Settings
- [ ] Each org has its own settings, bill templates, chart of accounts
- [ ] Fiscal year is per-org

---

## 20. Real-Time Updates

- [ ] Create a party in one browser tab → it appears instantly in another tab's party list
- [ ] Add a payment to an order → status updates in real-time on all connected clients
- [ ] Stock changes from a sale reflect immediately in stock book view

---

## 21. Bill Customization

### 21.1 Template Editor
- [ ] Visual preview updates as settings change
- [ ] Can rearrange column order
- [ ] Can toggle fields on/off
- [ ] Can set paper size and font size
- [ ] Can add custom footer text
- [ ] Can save multiple templates

### 21.2 Print with Template
- [ ] Default template applies when printing any invoice
- [ ] Can select alternative template before printing
- [ ] Thermal receipt format should be narrow and appropriate for receipt printers
- [ ] A4 format should be full-page with proper margins

---

## 22. Session Persistence & Auth

### 22.1 Cookie Security
- [ ] On localhost (http://localhost:5173): session cookie is set without `secure` flag
- [ ] On deployed HTTPS domain: session cookie includes `secure` flag
- [ ] Cookie uses shared `sessionCookieOptions()` helper (no hardcoded cookie configs)

### 22.2 Session Persistence
- [ ] Log in via WorkOS → session cookie set
- [ ] Reload page → still logged in (no redirect to login)
- [ ] Close browser tab, reopen → still logged in (within 30 days)
- [ ] Multiple reloads in succession → session maintained
- [ ] No `dev_default_org` fallback — unauthenticated requests throw "Authentication required"

### 22.3 Auto-Redirect Login
- [ ] Navigate to `/login` while unauthenticated → immediately redirects to WorkOS AuthKit (no "Continue with WorkOS" button)
- [ ] Brief loading spinner shown during redirect
- [ ] Navigate to `/login` while authenticated → redirects to `/dashboard`

---

## 23. Command Palette Search (⌘K)

### 23.1 Trigger
- [ ] Press Cmd+K (Mac) or Ctrl+K (Windows) → command palette opens
- [ ] Click search button in topbar → command palette opens
- [ ] Press Escape → closes palette
- [ ] Click outside → closes palette

### 23.2 Navigation Items
- [ ] All 14 navigation items shown: Dashboard, Products, Customers, Parties, Sales, Orders, Stock Import, Stock Book, Invoices, Vehicles, Trips, Ledger, Reports, Settings
- [ ] Each has correct icon
- [ ] Clicking navigates to the correct route
- [ ] Filtering by typing narrows navigation results

### 23.3 Action Items
- [ ] "New Sale", "New Order", "Import Stock" actions shown
- [ ] Clicking navigates to the create page

### 23.4 Full Text Search
- [ ] Type a product name → product search results appear
- [ ] Type a customer name → customer results appear
- [ ] Type a party/supplier name → party results appear
- [ ] Type an invoice number → invoice results appear
- [ ] Type a vehicle name → vehicle results appear
- [ ] Results grouped by type with type badges
- [ ] Max 5 results per type
- [ ] Clicking a result navigates to the entity detail/edit page
- [ ] Search is debounced (300ms)
- [ ] Empty search term shows no results (only navigation/actions)
- [ ] Results respect multi-tenant isolation (only org's data shown)

### 23.5 Search Indexes
- [ ] `products.search_title` index exists
- [ ] `customers.search_name` index exists
- [ ] `parties.search_name` index exists
- [ ] `invoices.search_number` index exists
- [ ] `vehicles.search_name` index exists

---

## 24. Notifications

### 24.1 Notification Popover
- [ ] Bell icon in topbar with unread count badge (red dot with number)
- [ ] Badge shows "9+" when more than 9 unread
- [ ] No badge when all notifications are read
- [ ] Click bell → popover opens with notification list
- [ ] Each notification shows: type icon, title, message, relative time
- [ ] Empty state shown when no notifications
- [ ] "Mark all read" button clears all unread

### 24.2 Low Stock Alerts
- [ ] Create a product with reorderLevel=10, openingStock=15
- [ ] Make a sale of 6 units → stock drops to 9 (below reorderLevel)
- [ ] A `low_stock` notification is created
- [ ] Notification title mentions the product name
- [ ] Clicking notification navigates to products page

### 24.3 Order Status Notifications
- [ ] Mark an order as done → `order_status` notification created
- [ ] Cancel an order → `order_status` notification created

### 24.4 Real-Time Updates
- [ ] Notifications appear in real-time (Convex subscription)
- [ ] Unread count updates without page reload
- [ ] Mark as read updates UI immediately

---

## 25. Form Validation (Client-Side)

### 25.1 Product Form
- [ ] Submit without title → validation error shown under title field
- [ ] Submit with negative cost price → error shown
- [ ] Submit with negative opening stock → error shown
- [ ] Toast error displayed on validation failure
- [ ] Fields have red border when invalid

### 25.2 Stock Import Form
- [ ] Submit without selecting supplier → error shown
- [ ] Submit without any line items → error shown
- [ ] Submit with empty product in line item → error shown
- [ ] Submit with zero quantity → error shown
- [ ] Toast error with summary of issues

### 25.3 Order Form
- [ ] Submit without date → error shown
- [ ] Submit without line items → error shown
- [ ] Bank voucher required for bank transfer payment method

### 25.4 Sale Form
- [ ] Submit without date → error shown
- [ ] Submit without line items → error shown
- [ ] Stock availability still validated server-side

### 25.5 Vehicle Form
- [ ] Submit without name → error shown
- [ ] Submit without license plate → error shown

### 25.6 Settings Form
- [ ] Submit without business name → error shown
- [ ] Tax rate must be 0-100
- [ ] Fiscal year required

---

## 26. Empty States

### 26.1 All List Pages
- [ ] Sales list with no data → shows empty state with icon, title, description, action button
- [ ] Orders list with no data → shows empty state
- [ ] Stock book with no data → shows empty state
- [ ] Stock import list with no data → shows empty state
- [ ] Invoices with no data → shows empty state
- [ ] Ledger with no data → shows empty state
- [ ] Trips with no data → shows empty state

### 26.2 Empty State Design
- [ ] Icon in rounded circle background
- [ ] Clear title and description
- [ ] Action button links to create page (e.g., "Create your first sale")
- [ ] Proper dark mode styling

---

## 27. Organization Management

### 27.1 Members Page (`/settings/members`)
- [ ] Lists all org members with name, email, role, status
- [ ] Shows "active" or "pending" status badge
- [ ] Current user cannot remove themselves

### 27.2 Invite Members
- [ ] "Invite Member" button opens dialog
- [ ] Enter email + select role → sends WorkOS invitation
- [ ] New invite shows as "pending" in member list
- [ ] Invalid email shows error

### 27.3 Role Management
- [ ] Owner can change member roles via dropdown
- [ ] Available roles: owner, manager, accountant, sales, warehouse, driver
- [ ] Role change persists after page reload

### 27.4 Remove Members
- [ ] Owner can remove non-self members
- [ ] Confirmation before removal
- [ ] Removed member disappears from list

---

## 28. ABAC (Attribute-Based Access Control)

### 28.1 Permission Enforcement
- [ ] `owner` role can access all features
- [ ] `sales` role can create sales and orders but NOT import stock or edit settings
- [ ] `warehouse` role can import stock and manage products but NOT create sales
- [ ] `accountant` role can view stock/sales/ledger but NOT create/delete
- [ ] `driver` role can manage vehicles and trips but NOT products or sales
- [ ] `manager` role has broad access except settings:edit and members:manage

### 28.2 Permission Errors
- [ ] Attempting a forbidden mutation → "Insufficient permissions" error with helpful message
- [ ] Error message lists which roles have the required permission

### 28.3 Frontend Permission Awareness
- [ ] `createPermissions(role)` helper correctly checks permissions
- [ ] UI elements can be conditionally shown/hidden based on `can('permission')` check

---

## 29. Dark Mode & Styling

### 29.1 All Pages
- [ ] Toggle to dark mode → no white-on-white or invisible text on any page
- [ ] Toggle to light mode → no dark-on-dark issues
- [ ] All tables use consistent wrapper: rounded-xl, border, shadow-sm
- [ ] All page headers use unified icon box pattern (rounded-xl bg-zinc-900/dark:bg-zinc-100)

### 29.2 Specific Component Dark Mode
- [ ] ProductList: table, badges, dropdowns all visible in dark mode
- [ ] OrderList: status badges, payment badges visible
- [ ] SaleList: invoice numbers, amounts visible
- [ ] StockImportList: status badges visible
- [ ] VehicleList: license plate badges visible
- [ ] ConfirmDialog: buttons, text all visible
- [ ] All forms: inputs, labels, buttons properly styled

### 29.3 Dashboard Design
- [ ] KPI cards have color-coded accent bars (emerald=revenue, red=expenses, amber=low stock)
- [ ] Quick action buttons prominently displayed (New Sale, Import Stock, Create Order)
- [ ] Visual hierarchy: large numbers, smaller labels

---

## 30. Excel-Like Line Items

### 30.1 BillForm Spreadsheet Behavior
- [ ] Focusing the last row auto-adds a new empty row
- [ ] Tab key navigates: qty → rate → next row's qty
- [ ] Shift+Tab navigates backwards
- [ ] Enter moves to next row
- [ ] Backspace/Delete on empty row removes it
- [ ] Pasting from Excel/Google Sheets fills multiple cells and rows
- [ ] No "Add Item" button needed (auto-add handles it)

### 30.2 Inline Product Creation in Stock Import
- [ ] "+" button visible next to product selector in each line item
- [ ] Clicking opens ProductForm dialog in inline mode
- [ ] New product is pre-filled with current supplier
- [ ] After creation, product auto-selected in the row
- [ ] Parent form state preserved

---

## 31. Unit Builder

### 31.1 Compound Unit Input
- [ ] Dropdown shows base units: piece, box, kg, liter, pack, dozen, bag
- [ ] Selecting "box" shows "pieces per unit" number input
- [ ] Entering "12" outputs `box:12` format string
- [ ] Selecting "kg" shows no additional input, outputs `kg`
- [ ] Visual feedback: "1 box = 12 pieces"
- [ ] Used in product create/edit form

---

## 32. Automation: Stock Book on Product Creation

### 32.1 Opening Stock Entry
- [ ] Create product with openingStock=50, costPrice=100
- [ ] Stock book automatically has an "opening" entry: 50 units in, ₹5,000 total
- [ ] Entry linked to product as source
- [ ] Entry uses current fiscal year from orgSettings
- [ ] Create product with openingStock=0 → no stock book entry created

---

## 33. Internationalization (i18n) — Extended

### 33.1 Previously Hardcoded Strings
- [ ] ConfirmDialog: title, description, button labels all translate to Nepali
- [ ] OrgSettings: all labels (Business Name, Location, etc.) translate
- [ ] ProductList: "Products", "New Product", count text translate
- [ ] BillForm: "Subtotal", "Total", "Add Item" translate
- [ ] Validation error messages translate

### 33.2 Comprehensive Nepali Check
- [ ] Switch to Nepali → navigate to every page
- [ ] No English text visible except proper nouns, numbers, and technical terms
- [ ] Devanagari text renders correctly with Mukta font

---

## End-to-End Scenarios

### Scenario A: Full Purchase-to-Sale Cycle
1. Create a supplier party "ABC Distributors"
2. Create a product "Rice 25kg" linked to ABC, costPrice=2000, unit="bag"
3. Import stock: 100 bags from ABC → verify invoice PUR-82/83-00001 created
4. Verify stock book shows 100 bags available under ABC bucket
5. Create a customer "Ram Grocery"
6. Create a sale: 10 bags to Ram at sellingPrice → verify invoice SAL-82/83-00001
7. Verify stock book shows 90 bags remaining
8. Check ledger entries are balanced

### Scenario B: Order with Partial Payment
1. Create order for customer with 3 items, total ₹15,000
2. Add payment: ₹5,000 cash → status should show "partial (₹10,000 to pay)"
3. Add payment: ₹10,000 bank transfer (with voucher #) → status "paid"
4. Mark order as done → verify invoice + stock entries created

### Scenario C: Trip Dispatch and Return
1. Create a vehicle "Truck NP-01-1234"
2. Create trip with 50 units of Product A, 30 units of Product B
3. Verify stock decreased by those amounts
4. Return trip: 10 units of A returned, 5 units of B returned
5. Verify: sold = 40 A + 25 B, sale invoice auto-created
6. Verify stock book: tripDispatch(out) + tripReturn(in) + sale(out) entries

### Scenario D: Fiscal Year Close
1. Ensure current FY has stock across multiple products and suppliers
2. Run fiscal close
3. Verify closing entries (out) created for all products
4. Verify opening entries (in) created for next FY
5. Switch to new FY view → should show only opening balances
6. Old FY data should still be accessible via fiscal year filter

### Scenario E: Session Persistence & Auth Flow
1. Open app on localhost → auto-redirects to WorkOS login
2. Complete login → redirected to dashboard
3. Reload page multiple times → session maintained, no login prompt
4. Close browser, reopen → still logged in
5. Navigate to /login while authenticated → redirected to /dashboard

### Scenario F: Search & Navigate
1. Create several products, customers, and a sale invoice
2. Press Cmd+K → command palette opens
3. Type product name → see product in results → click → navigated to product
4. Type customer name → see customer → click → navigated
5. Type invoice number → see invoice → click → navigated
6. Type "sal" → see "Sales" in navigation results → click → navigated to /sales

### Scenario G: Low Stock Notification Flow
1. Create product "Widget" with costPrice=100, openingStock=10, reorderLevel=5
2. Verify stock book has opening entry (10 units)
3. Create a sale of 6 widgets → stock drops to 4
4. Check bell icon → unread count shows 1
5. Click bell → see "Low stock: Widget" notification
6. Click notification → navigated to products page
7. Click "Mark all read" → badge disappears

### Scenario H: ABAC Permission Flow
1. As owner: invite a new member with "sales" role
2. Log in as the sales-role member
3. Create a sale → succeeds
4. Try to import stock → "Insufficient permissions" error
5. Try to edit settings → "Insufficient permissions" error
6. Try to create a product → "Insufficient permissions" error

### Scenario I: Excel-Like Stock Import
1. Navigate to /stock-import/new
2. Select a supplier
3. Click in the product column of the first row → select a product
4. Tab to qty → enter 10 → Tab to rate → enter 500 → Tab
5. Automatically moved to new row → select another product
6. Paste 3 rows from Excel (product-tab-qty-tab-rate per line) → rows filled
7. Delete an empty row with Backspace
8. Click "+" next to product selector → create new product inline → auto-selected
9. Submit → stock imported successfully with all items
