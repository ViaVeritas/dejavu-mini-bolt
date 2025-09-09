# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeJaVu Mini is a React-based mental wellness/productivity mobile app that helps users maintain consistency by connecting with their future self. Their future self is pro-active, capable of taking initiative by reaching out to the user to maintain consistency. The app features a chat interface, planning lab with input-output schematic, and customizable settings.

## Architecture

- **Frontend**: React 18 + TypeScript with Vite build tool
- **Styling**: Tailwind CSS with custom HSL color system using CSS variables
- **UI Components**: Radix UI primitives with custom components in `src/components/ui/`
- **Icons**: Lucide React
- **Flow Diagrams**: ReactFlow for the Lab screen's input-output schematic
- **State Management**: Component-level React state (no external state library)

### Key Components

- `App.tsx`: Main application with screen routing and dark mode state
- `LabScreen.tsx`: Central planning interface with ReactFlow diagram
- `ChatScreen.tsx`: Main chat interface for user interactions
- `GoalDetailScreen.tsx`: Duolingo-style progress interface for individual goals
- `CategoryChatPanel.tsx`: Goal-specific chat overlay

### Type System

- `Goal`: Core type with `id`, `title`, `goalCount`, and `type` (input/output)
- `IndividualGoal`: Extended goal type with completion tracking

## Development Commands

- `npm run dev` - Start development server (port 5173, auto-opens browser)
- `npm run build` - Build for production (outputs to `dist/` with sourcemaps)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with TypeScript extensions
- `npm run type-check` - Run TypeScript type checking without emit

## Project Structure

```
src/
├── components/
│   ├── ui/           # Radix UI components with Tailwind styling
│   ├── LabScreen.tsx # ReactFlow-based planning interface
│   ├── ChatScreen.tsx
│   ├── GoalDetailScreen.tsx
│   └── [other screens]
├── types/
│   └── Goal.ts       # Core type definitions
└── App.tsx          # Main app with routing logic
```

## Code Conventions

- Uses `"@/*"` path mapping for imports (resolves to `./src/*`)
- Strict TypeScript configuration with unused parameter/variable checking
- Functional components with TypeScript interfaces for props
- Tailwind CSS with HSL color system using CSS custom properties
- Component file naming: PascalCase with `.tsx` extension

## Styling System

- Dark mode support via `dark` class on document root
- Color system: HSL values stored as CSS custom properties (`--primary`, `--background`, etc.)
- Border radius system: `--radius` custom property with calculated variants
- Responsive design optimized for mobile (`max-w-sm mx-auto`)

## UI Patterns

- Bottom navigation with Home (chat), Lab, and Settings tabs
- Modal/panel overlays for goal-specific chats
- Card-based design for goals with progress indicators
- ReactFlow nodes for visual goal relationships in Lab screen