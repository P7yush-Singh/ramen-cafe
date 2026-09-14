# 🍜 Ramen Cafe --- Full-Stack QR Restaurant Ordering & Operations Platform

> A full-stack restaurant management and digital ordering system that
> connects the customer dining journey with restaurant operations ---
> from QR-based table identification and menu customization to order
> processing, billing, payments, menu management, table management, and
> operational dashboards.

## Project Overview

Ramen Cafe is not designed as a static restaurant website. It is a
complete digital workflow for a dine-in restaurant.

The core idea is simple: a customer scans the QR code placed on their
table, the application identifies that table, and the customer can
browse the live menu, customize food, build a cart, authenticate, place
an order, follow the order lifecycle, review previous orders, and
request the final bill.

On the restaurant side, staff can process incoming orders through a
controlled operational workflow. Owners and authorized restaurant-side
users get administrative tools for menu management, order management,
bill requests, tables and QR codes, customers, and restaurant-level
operational information.

The project was built to solve a real restaurant workflow rather than
only demonstrate UI development.

------------------------------------------------------------------------

## 🎯 Problem the Project Solves

Traditional dine-in ordering often depends heavily on manual processes:

-   Customers wait for staff to receive menus and take orders.
-   Menu changes, availability, prices, add-ons, and customizations can
    become inconsistent.
-   Restaurant staff need a structured way to see and process incoming
    orders.
-   Customers have limited visibility into what stage their order is in.
-   Table identification must remain connected to every order.
-   Billing can become disconnected from the customer's actual order
    history.
-   Restaurant owners need centralized visibility into products, orders,
    customers, tables, bills, and daily operations.

Ramen Cafe brings these processes into one connected application.

------------------------------------------------------------------------

## ✨ Core Features

### Customer Experience

-   QR-based table identification
-   Dynamic restaurant menu
-   Product search and category filtering
-   Food customization
-   Noodle selection
-   Spice-level selection
-   Add-ons with additional pricing
-   Cart management
-   Persistent table session
-   Customer authentication
-   Checkout with customer details
-   Server-backed order creation
-   Order history
-   Order status tracking
-   Bill request workflow
-   Responsive mobile-first experience
-   Skeleton/loading states for better perceived performance

### Restaurant Operations

-   Restaurant dashboard
-   Incoming order management
-   Order search and status filters
-   Controlled order-status transitions
-   Estimated preparation information
-   Order cancellation handling
-   Bill request management
-   Payment status handling
-   Product/menu management
-   Product availability controls
-   Table management
-   Per-table QR code generation and printing
-   Customer/account visibility
-   Role-aware administrative capabilities
-   Daily operational metrics

------------------------------------------------------------------------

# 👥 Application Roles

The application separates the restaurant experience into three main
perspectives.

## 1. Customer

Customers interact with the public ordering experience.

They can scan a table QR code, browse products, customize items, add
products to their cart, sign in, place orders, review their order
history, follow order progress, and request their bill.

## 2. Staff

Staff use the restaurant-side operational interface.

Their primary responsibility is handling the live order lifecycle and
customer service workflow. Restaurant-side authorization supports roles
such as `staff`, `manager`, `admin`, and `owner`, while customers remain
separated from administrative routes.

## 3. Owner / Administration

The owner has the broader management view of the restaurant.

In addition to operational order handling, authorized management users
can access restaurant management functionality such as menu
administration, tables and QR codes, customer activity, bill requests,
dashboard information, and administration/settings according to role
permissions.

------------------------------------------------------------------------

# 🧑 Customer Workflow

The customer journey is designed around the physical table.

``` text
Customer enters restaurant
        ↓
Scans table QR code
        ↓
Table is identified
        ↓
Digital menu opens
        ↓
Browse / Search / Filter menu
        ↓
Select a product
        ↓
Customize product
  ├─ Noodles
  ├─ Spice level
  └─ Add-ons
        ↓
Add item to cart
        ↓
Review cart
        ↓
Proceed to checkout
        ↓
Login / authenticate when required
        ↓
Confirm customer information
        ↓
Place order
        ↓
Order linked to customer + table
        ↓
Restaurant receives order
        ↓
Customer follows order progress
        ↓
Pending → Confirmed → Preparing → Ready → Served
        ↓
Customer can continue dining / place additional orders
        ↓
Request bill
        ↓
Restaurant staff receives bill request
        ↓
Payment is collected / recorded
```

## Step 1 --- Scan the Table QR Code

Every configured restaurant table can have its own QR code.

The generated QR sends the customer to the restaurant menu with the
table identity attached to the URL. The application then stores the
active table session so that subsequent actions remain associated with
the correct table.

Example concept:

``` text
/menu?table=T01
```

This avoids requiring the customer to manually enter a table number.

## Step 2 --- Browse the Menu

The customer menu loads products dynamically from the backend rather
than relying on a hard-coded menu.

Customers can:

-   browse available menu items;
-   search products;
-   filter by category;
-   see product information and pricing;
-   open customizable items.

Loading skeletons are used while product data is being fetched so the
interface remains visually responsive.

## Step 3 --- Customize Food

Products can contain configurable restaurant-specific options.

A ramen item can support:

``` text
Product
├── Base price
├── Noodle option
├── Spice level
└── Add-ons
    ├── Extra topping
    ├── Extra ingredient
    └── Additional price
```

The final cart item preserves the selected configuration rather than
storing only a generic product reference.

## Step 4 --- Cart

The cart keeps the customer's selected products and customization data.

The customer can review quantities, customized options, item totals, and
the overall order before checkout.

## Step 5 --- Authentication & Checkout

Checkout verifies the customer session.

If the customer is not authenticated, the application redirects to login
and can return the user to checkout afterward.

The checkout flow uses the active table session and customer information
to create a restaurant order.

The billing model includes:

``` text
Subtotal
+ Tax
= Total
```

The current order model uses a default tax rate of 5%.

## Step 6 --- Order Creation

An order is associated with:

-   a unique order number;
-   authenticated user;
-   customer snapshot;
-   table ID;
-   ordered items;
-   product customizations;
-   quantity;
-   subtotal;
-   tax;
-   total;
-   order status;
-   payment information;
-   timestamps.

This allows the order to remain historically accurate even if menu
information changes later.

## Step 7 --- Order Tracking

The restaurant uses a controlled state machine for order processing.

``` text
Pending
   ↓
Confirmed
   ↓
Preparing
   ↓
Ready
   ↓
Served
```

Orders may also be cancelled from supported stages.

The backend validates status transitions instead of allowing arbitrary
order-state changes.

## Step 8 --- My Orders

Authenticated customers can access their current and previous Ramen Cafe
orders, allowing the restaurant experience to continue beyond the
initial checkout screen.

## Step 9 --- Request Bill

When the customer finishes dining, the bill workflow can aggregate the
relevant orders associated with the table/customer session.

A bill request contains information such as:

-   table;
-   related order numbers;
-   order count;
-   total amount;
-   request timestamp.

Active owner/staff users can be notified about the request by email when
the email integration is configured.

The staff member can then visit the table, collect payment, and update
the bill/payment state from the restaurant-side interface.

------------------------------------------------------------------------

# 👨‍🍳 Staff Workflow

Staff do not need to manually reconstruct what a customer ordered. The
order already contains the table, customer snapshot, items, quantities,
customizations, totals, and operational status.

``` text
Customer places order
        ↓
Order enters restaurant system
        ↓
Staff opens Orders
        ↓
Pending order appears
        ↓
Staff accepts order
        ↓
Confirmed
        ↓
Kitchen starts preparation
        ↓
Preparing
        ↓
Food completed
        ↓
Ready
        ↓
Delivered to customer
        ↓
Served
```

## Staff Order Management

The order management interface supports:

-   viewing incoming orders;
-   searching orders;
-   filtering by status;
-   viewing order counts;
-   opening detailed order information;
-   updating supported statuses;
-   cancellation with a reason;
-   refreshing operational information.

The API validates transitions. A typical lifecycle is:

``` text
pending   → confirmed / cancelled
confirmed → preparing / cancelled
preparing → ready / cancelled
ready     → served
served    → terminal state in the primary workflow
cancelled → terminal state
```

Some later restaurant-side code also supports a final `completed` state
after service.

## Bill Requests

When a customer requests the bill, staff/owner notification can be sent
through email.

Staff can:

``` text
Open Bill Requests
      ↓
Identify table
      ↓
Review amount/orders
      ↓
Visit customer
      ↓
Collect payment
      ↓
Record payment
      ↓
Complete billing workflow
```

This connects billing to actual orders instead of treating payment as a
separate manual record.

------------------------------------------------------------------------

# 👑 Owner / Admin Workflow

The owner side is intended to provide operational control over the
restaurant.

``` text
Owner / authorized user logs in
        ↓
Restaurant Dashboard
        ↓
Monitor today's operations
        ↓
Manage Orders
Manage Menu
Manage Bill Requests
Manage Tables & QR codes
View Customers
Administration / Settings
```

## Dashboard

The restaurant dashboard provides a centralized view of current
activity.

The backend calculates operational information including:

-   revenue;
-   subtotal and tax;
-   number of orders;
-   number of items;
-   unique customers;
-   active tables;
-   order-status counts;
-   recent orders;
-   popular products.

Cancelled orders are excluded from relevant revenue/customer/table
calculations.

The dashboard can refresh silently on an interval so operational
information stays current.

## Menu Management

Authorized restaurant users can manage products without changing source
code.

Product management includes functionality for:

-   adding products;
-   editing products;
-   price management;
-   category management;
-   description and image data;
-   food type;
-   availability;
-   popular/featured state;
-   add-ons and add-on prices;
-   noodle customization options;
-   spice-level options;
-   sorting/order controls;
-   metadata fields.

The customer menu therefore acts as a dynamic representation of
restaurant data.

## Table Management & QR Codes

Management can configure restaurant tables and generate a unique QR
experience for each table.

The table interface supports QR generation and printing. The printable
QR card includes the Ramen Cafe branding, table number, QR code, and an
instruction telling customers to scan the code to view the menu and
place an order.

Conceptually:

``` text
Owner creates/configures Table T01
        ↓
System creates table-specific menu URL
        ↓
QR code generated
        ↓
QR printed and placed on table
        ↓
Customer scans QR
        ↓
Application knows customer is at T01
```

## Customer Management

Authorized roles can access customer accounts and restaurant order
activity, providing the restaurant with a centralized customer/order
view.

## Administration

Higher-privilege administrative access is designed for management of
restaurant-side users, roles, and restaurant settings.

------------------------------------------------------------------------

# 🔄 Complete System Workflow

``` text
┌──────────────────────┐
│      RESTAURANT      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Table-specific QR    │
└──────────┬───────────┘
           │ Scan
           ▼
┌──────────────────────┐
│ Customer Menu        │
│ Search / Categories  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Product Customizer   │
│ Noodles / Spice /    │
│ Add-ons              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Cart                 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Authentication       │
│ + Checkout           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Order API            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ MongoDB              │
│ Order + Customer +   │
│ Table + Items        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Restaurant Orders    │
└──────────┬───────────┘
           │
           ▼
 Pending → Confirmed
           ↓
       Preparing
           ↓
         Ready
           ↓
        Served
           │
           ▼
┌──────────────────────┐
│ Customer requests    │
│ bill                 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Staff / Owner        │
│ Bill Management      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Payment Recorded     │
└──────────────────────┘
```

------------------------------------------------------------------------

# 🏗️ Architecture

Ramen Cafe follows a full-stack Next.js architecture.

``` text
Browser / Mobile Device
        │
        ▼
Next.js UI
        │
        ├── Customer Experience
        │   ├── Menu
        │   ├── Product Customization
        │   ├── Cart
        │   ├── Checkout
        │   └── Orders / Billing
        │
        └── Restaurant Administration
            ├── Dashboard
            ├── Orders
            ├── Products
            ├── Bills
            ├── Tables
            ├── Customers
            └── Settings
        │
        ▼
Next.js Route Handlers / REST-style APIs
        │
        ├── Authentication & Authorization
        ├── Product APIs
        ├── Order APIs
        ├── Dashboard APIs
        ├── Table APIs
        └── Billing APIs
        │
        ▼
MongoDB + Mongoose
        │
        ├── Users
        ├── Products
        ├── Orders
        └── Tables / restaurant data
```

------------------------------------------------------------------------

# 🛠️ Technology Stack

The project uses a modern JavaScript full-stack architecture.

  -----------------------------------------------------------------------
  Layer                               Technology
  ----------------------------------- -----------------------------------
  Frontend                            React.js

  Framework                           Next.js

  Language                            JavaScript / JSX

  Styling                             Tailwind CSS

  Backend                             Next.js Route Handlers / REST-style
                                      APIs

  Database                            MongoDB

  ODM                                 Mongoose

  Authentication                      Server-side authenticated
                                      user/session workflow with
                                      role-based authorization

  Icons                               Lucide React

  QR Workflow                         Table-specific QR
                                      generation/printing

  Email Notifications                 Resend integration for configured
                                      bill-request notifications

  Images                              Image URL / cloud image workflow

  Deployment-ready Architecture       Next.js application with
                                      environment-based configuration
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 🔐 Authentication & Authorization

The application separates public customer functionality from restaurant
administration.

Restaurant-side APIs verify the authenticated server user before
returning protected operational information.

Role-aware logic distinguishes `customer` from restaurant-side roles
such as:

``` text
customer
staff
manager
admin
owner
```

Capabilities can then be conditionally exposed according to the user's
role.

Examples include table management, customer visibility, and higher-level
administration.

------------------------------------------------------------------------

# 📦 Order Data Model

The order model is intentionally richer than a basic e-commerce order
because restaurant operations require table context and food
customization.

``` text
Order
├── orderNumber
├── userId
├── customer snapshot
├── tableId
├── items[]
│   ├── productId
│   ├── name
│   ├── image
│   ├── price
│   ├── quantity
│   ├── noodles
│   ├── spice
│   ├── addons[]
│   └── item total
├── subtotal
├── taxRate
├── taxAmount
├── total
├── status
├── payment
│   ├── status
│   ├── amount
│   ├── method
│   ├── transactionId
│   └── paidAt
├── preparation timestamps
├── cancellation information
└── created / updated timestamps
```

Supported payment-state data includes:

``` text
pending
paid
failed
refunded
```

The model supports payment methods such as cash, UPI, card, online, and
other.

------------------------------------------------------------------------

# 🍜 Product Data & Customization

A restaurant product is more than a title and price.

Ramen Cafe's product-management workflow supports the information
required to build configurable menu items.

``` text
Product
├── Name
├── Description
├── Category
├── Price
├── Image
├── Food Type
├── Availability
├── Popular / Featured
├── Add-ons
│   ├── Name
│   ├── Price
│   └── Availability
├── Customization
│   ├── Noodles
│   └── Spice Levels
├── Sort Order
└── Metadata
```

This allows menu changes to be managed through the restaurant interface
rather than hard-coded into the customer UI.

------------------------------------------------------------------------

# ⚡ UX & Performance Considerations

The interface was designed to remain usable on mobile devices because
the primary customer entry point is a QR code scanned from a phone.

The project includes or is structured around:

-   responsive layouts;
-   reusable React components;
-   dynamic API-backed content;
-   skeleton/pulse loading states;
-   error states and retry actions;
-   persistent cart/table information;
-   controlled backend status transitions;
-   MongoDB indexes on frequently queried order fields;
-   silent dashboard refresh for operational data;
-   separation between customer and administrative workflows.

------------------------------------------------------------------------

# 📊 Restaurant Dashboard Logic

The dashboard is not only decorative UI. Operational statistics are
calculated from stored order data.

Examples include:

``` text
Today's Revenue
Today's Orders
Items Ordered
Unique Customers
Active Tables
Pending Orders
Confirmed Orders
Preparing Orders
Ready Orders
Served Orders
Cancelled Orders
Recent Orders
Popular Products
```

The backend explicitly calculates the current restaurant day using the
`Asia/Kolkata` timezone rather than relying on the deployment server's
timezone.

------------------------------------------------------------------------

# 📧 Bill Notification Workflow

When configured, the application can use Resend to notify active
owner/staff email recipients when a customer requests the bill.

The notification includes operational information such as:

-   table;
-   customer;
-   contact information;
-   bill amount.

The message instructs restaurant staff to visit the table, collect
payment, and update the bill from the admin panel.

Required email configuration is environment-based.

------------------------------------------------------------------------

# 🗂️ Suggested Project Structure

The exact repository may evolve, but the application is organized around
a structure similar to:

``` text
ramen-cafe/
│
├── app/
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── orders/
│   │   ├── products/
│   │   └── ...
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── bills/
│   │   ├── tables/
│   │   ├── users/
│   │   └── settings/
│   │
│   ├── menu/
│   ├── checkout/
│   ├── orders/
│   ├── login/
│   └── ...
│
├── components/
│   ├── MenuCard
│   ├── ProductCustomization
│   └── reusable UI components
│
├── lib/
│   ├── mongodb
│   ├── authentication helpers
│   ├── cart
│   └── table session
│
├── models/
│   ├── User
│   ├── Product
│   ├── Order
│   └── ...
│
├── public/
├── .env.local
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 🚀 Local Development

## 1. Clone the Repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

## 2. Install Dependencies

``` bash
npm install
```

## 3. Configure Environment Variables

Create:

``` text
.env.local
```

Add the environment variables required by your current implementation.
Typical categories for this project include:

``` env
MONGODB_URI=your_mongodb_connection_string

# Authentication/session secrets used by your implementation
# Add the exact variable names from your project here.

# Optional bill-request email notifications
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender
```

Do not commit `.env.local` or production credentials to GitHub.

## 4. Start Development Server

``` bash
npm run dev
```

Then open the local Next.js application in your browser.

## 5. Production Build

``` bash
npm run build
npm start
```

------------------------------------------------------------------------

# 🧪 Important Test Scenarios

Before deploying a restaurant workflow, useful end-to-end scenarios
include:

``` text
QR scan
→ correct table detected
→ product customization
→ cart
→ authentication
→ checkout
→ order created
→ staff confirms
→ preparing
→ ready
→ served
→ customer requests bill
→ staff receives request
→ payment recorded
```

Also test:

-   switching/invalid table QR codes;
-   unavailable products;
-   empty cart;
-   unauthenticated checkout;
-   unauthorized admin access;
-   invalid order status transitions;
-   cancelled orders;
-   bill requests with multiple orders;
-   mobile layouts;
-   API failure and retry states.

------------------------------------------------------------------------

# 💡 Key Engineering Decisions

## Table Context Is Part of the Order

The table is not treated as cosmetic UI state. It becomes part of the
restaurant transaction and is stored with the order.

## Orders Store Customer & Product Snapshots

Orders preserve relevant customer and item information so historical
orders do not depend entirely on future changes to user profiles or menu
data.

## Backend-Enforced Order Lifecycle

The frontend cannot simply jump an order from any status to another. The
server validates allowed status transitions.

## Role-Aware Restaurant Administration

Customer functionality and restaurant operations are separated, and
management capabilities can be exposed according to restaurant-side
roles.

## Dynamic Menu Instead of Static Product Data

Restaurant products are managed through APIs/database-backed
administration, allowing price, availability, customization, and menu
information to evolve without rewriting the customer interface.

## Billing Is Connected to Dining Activity

Bill requests are based on restaurant orders/table context, keeping
customer ordering and restaurant payment operations connected.

------------------------------------------------------------------------

# 📈 What This Project Demonstrates

Ramen Cafe demonstrates practical experience with:

-   full-stack product development;
-   React component architecture;
-   Next.js application development;
-   REST-style API design;
-   MongoDB and Mongoose data modeling;
-   authentication and authorization;
-   role-based workflows;
-   responsive/mobile-first interfaces;
-   state management for carts and table sessions;
-   restaurant order-state modeling;
-   QR-based physical-to-digital workflows;
-   dynamic product management;
-   billing/payment data modeling;
-   email notification integration;
-   dashboard aggregation;
-   error/loading UX;
-   end-to-end product thinking.

------------------------------------------------------------------------

# 🧠 Why I Built Ramen Cafe

The goal was to move beyond building another static restaurant landing
page.

I wanted to model the actual operational journey of a restaurant:

``` text
Customer sits down
→ discovers the menu
→ orders
→ kitchen/staff processes the order
→ food is served
→ customer requests the bill
→ restaurant receives payment
→ owner monitors operations
```

Building around that journey required thinking about more than frontend
screens. It required data modeling, API design, authentication, role
permissions, order-state transitions, table identity, reusable
components, administrative workflows, and operational edge cases.

That is what makes Ramen Cafe a full-stack product rather than only a
restaurant UI.

------------------------------------------------------------------------

# 🔮 Future Improvements

Possible future iterations include:

-   production payment-gateway integration;
-   WebSocket/SSE real-time order updates;
-   kitchen display system (KDS);
-   push notifications;
-   inventory and ingredient tracking;
-   coupons and promotions;
-   reservation management;
-   multi-branch support;
-   advanced sales analytics;
-   downloadable invoices;
-   automated receipt delivery;
-   staff activity/audit logs;
-   PWA/offline capabilities;
-   customer loyalty and rewards.

------------------------------------------------------------------------

# 📸 Screenshots / Demo

Add your final screenshots or demo GIFs here before publishing the
repository.

``` md
## Customer Menu
![Customer Menu](./docs/menu.png)

## Product Customization
![Product Customization](./docs/customization.png)

## Restaurant Dashboard
![Restaurant Dashboard](./docs/dashboard.png)

## Order Management
![Order Management](./docs/orders.png)

## Table QR Management
![Table QR Management](./docs/tables.png)
```

For a LinkedIn/GitHub portfolio, showing the customer workflow and
restaurant dashboard visually will make the project significantly easier
to understand.

------------------------------------------------------------------------

# 🔗 Project Links

Replace these placeholders before publishing:

-   **Live Demo:** `<YOUR_LIVE_DEMO_URL>`
-   **GitHub Repository:** `<YOUR_GITHUB_REPOSITORY_URL>`
-   **LinkedIn:** `<YOUR_LINKEDIN_URL>`

------------------------------------------------------------------------

# 👨‍💻 Author

**Piyush Singh**

Full-Stack / React & Next.js Developer

Built as a portfolio project demonstrating a complete restaurant
ordering and operations workflow.

------------------------------------------------------------------------

## ⭐ Support

If you find the project useful or interesting, consider giving the
repository a star.

------------------------------------------------------------------------

**Ramen Cafe --- ラーメンカフェ**

*From table QR scan to restaurant operations, in one connected
workflow.*
