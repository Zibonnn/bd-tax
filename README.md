# BD Tax Calculator

A multi-tool platform for Bangladeshi taxpayers, starting with an income tax calculator.

## Features

- **Income Tax Calculator**: Calculate your Bangladesh income tax with a detailed breakdown by tax slabs
- Modern, clean UI built with shadcn/ui components
- Responsive design that works on all devices

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9+

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bd-tax
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage (Tax Calculator)
│   └── globals.css         # Global styles
├── components/
│   ├── features/           # Feature-specific components
│   │   └── tax-calculator.tsx
│   └── ui/                 # shadcn/ui components
├── config/
│   └── tax-rates.ts        # Tax rates configuration (single source of truth)
├── lib/
│   ├── tax-calculator.ts   # Tax calculation logic
│   └── utils.ts            # Utility functions
└── types/
    └── tax.ts              # TypeScript type definitions
```

## Tax Rates Configuration

Tax rates are configured in `src/config/tax-rates.ts`. This is the single source of truth for all tax calculations. When rates change, update this file and the changes will automatically apply throughout the application.

### Current Tax Slabs (FY 2024-2025)

| Annual Taxable Income (BDT) | Tax Rate |
|-----------------------------|----------|
| First BDT 350,000           | 0% (Tax-free) |
| Next BDT 100,000            | 5% |
| Next BDT 400,000            | 10% |
| Next BDT 500,000            | 15% |
| Next BDT 500,000            | 20% |
| Next BDT 2,000,000          | 25% |
| Remaining balance           | 30% |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
