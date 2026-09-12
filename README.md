# MyBill — Professional Billing & Quotation Software

A full-stack billing and quotation management application built for small businesses. Create professional invoices, quotations, manage customers and items, track payments, and generate PDF/Excel exports — all from a clean, minimal UI.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Revenue overview, recent bills, monthly charts |
| **Bills / Invoices** | Create, edit, duplicate, delete invoices with auto-numbering (INV-0001) |
| **Quotations** | Create professional quotations (QT-0001), convert to invoice with one click |
| **Customers** | Customer directory with previous bills panel |
| **Items / Price List** | Master item list with rate, unit, GST |
| **Reports** | Revenue, tax, customer and item-wise reports with date filters |
| **Settings** | Business name, address, logo, bank details, invoice prefix, default tax/notes |
| **PDF Export** | Browser-print PDF with Classic B&W and Color Letterhead templates |
| **Excel Export** | Formatted .xlsx export for invoices and quotations |
| **Import** | Import bills from Excel/CSV files |

### Quotation-Specific Features
- Two template styles: **Classic Black & White** and **Modern Color Letterhead**
- No bank details on quotations (quotations are estimates, not payment documents)
- Status tracking: Draft, Sent, Accepted, Rejected, Expired, Converted
- One-click **Convert to Invoice**

### Productivity Features
- Keyboard-friendly billing (Enter in Qty → Rate → new row)
- Quick item search in dropdowns
- Recently used items chips
- Customer previous bills panel with View/Duplicate

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Vanilla CSS (custom design system) |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via Sequelize ORM |
| PDF | Browser window.print() |
| Excel | ExcelJS (server), XLSX (client) |

---

## Project Structure

```
mybill_software/
├── public/                  # Static assets (logo.svg, favicon)
├── src/
│   ├── api.ts               # API client (all HTTP calls)
│   ├── App.tsx               # Root component with routing
│   ├── main.tsx              # Entry point
│   ├── index.css             # Global design system
│   ├── types.ts              # TypeScript interfaces
│   ├── components/
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── ImportModal.tsx   # Excel/CSV import modal
│   │   └── ui/
│   │       └── Table.tsx     # Reusable table component
│   ├── context/
│   │   └── AppContext.tsx    # Global state provider
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Bills.tsx
│   │   ├── CreateBill.tsx
│   │   ├── Quotations.tsx
│   │   ├── CreateQuotation.tsx
│   │   ├── Customers.tsx
│   │   ├── Items.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   └── utils/
│       ├── format.ts         # formatCurrency, formatDate
│       └── numberToWords.ts  # Amount to words converter
├── server/
│   ├── src/
│   │   ├── server.ts         # Express app entry
│   │   ├── models/           # Sequelize models
│   │   └── controllers/
│   │       ├── bills.ts
│   │       ├── quotations.ts
│   │       ├── customers.ts
│   │       ├── items.ts
│   │       ├── payments.ts
│   │       ├── reports.ts
│   │       ├── settings.ts
│   │       ├── export.ts     # PDF & Excel generation
│   │       └── import.ts     # Excel/CSV/OCR import
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mybill_software

# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Running in Development

Open **two terminals**:

**Terminal 1 — Frontend (Vite)**
```bash
npm run dev
```
Runs on `http://localhost:5173`

**Terminal 2 — Backend (Express)**
```bash
cd server
npm run dev
```
Runs on `http://localhost:3001`

### Building for Production

```bash
# Build frontend
npm run build

# Build server
cd server
npm run build
```

---

## Configuration

All business settings are managed from the **Settings** page inside the app:

- Business Name, Address, Phone, Email
- GSTIN / PAN Number
- Logo (upload)
- Bank Details (for invoices only)
- Invoice Prefix (e.g. INV-, BILL-)
- Quotation Prefix (e.g. QT-)
- Default Tax Rate
- Default Notes / Terms & Conditions

---

## Database

The app uses **SQLite** — a single file database (`database.sqlite`) that is created automatically on first run. No external database server is needed.

To reset the database, simply delete `database.sqlite` and restart the server.


