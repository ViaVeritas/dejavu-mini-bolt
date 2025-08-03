# DeJaVu Mini

> Ever wish you could guide your past self? And what if now is deja vu - can your future check on present you?

DeJaVu Mini is a mental wellness/productivity mobile app that solves the number one problem separating you from your future self - **consistency**.

## How It Works

DeJaVu Mini uses the power of AI to A.C.T:

- **ADOPT** the persona of your future self who knows the plan to get there
- **CHECK** in autonomously with the clarity of hindsight
- **TRANSFORM** consistency from chore to triumph - your future is here

## Features

### 🏠 **Home Screen**
A chat interface where users can talk about their future self, general plans, and progress to date. This is the space where check-ins happen.

### 🧪 **Lab Screen**
The central organ of planning featuring an input-output schematic. The central node contains an AI agent who monitors your inputs (cards below) and outputs (cards above).

- Tap the central hub to open a chat that can automatically create input and output cards
- Each card opens to a goal screen with a Duolingo-style progress interface
- Category cards feature their own chat for organizing conversations by life dimensions
- Add new input/output categories with the tap of a button

### ⚙️ **Settings Screen**
Customizable settings with dark/light mode support and user preferences.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Backend**: Supabase (planned)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dejavu-mini.git
   cd dejavu-mini
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the app running.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
DeJaVu_Mini/
├── components/          # React components
│   ├── ui/             # Reusable UI components (Radix UI)
│   ├── ChatScreen.tsx  # Main chat interface
│   ├── LabScreen.tsx   # Planning lab interface
│   ├── LoginScreen.tsx # Authentication screen
│   └── SettingsScreen.tsx # Settings interface
├── Context_Files/      # Project documentation and assets
├── styles/             # Global styles
├── App.tsx             # Main application component
└── package.json        # Dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the concept of connecting with your future self
- Built with modern React patterns and best practices
- UI components powered by Radix UI and Tailwind CSS

---

**Get DeJaVu - Let Your Future Check On You** ✨ 