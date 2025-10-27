# MechaRyan Game

## Overview
MechaRyan is a top-down action survival game built with React, TypeScript, and Vite. Players control a mech character navigating through various biomes, fighting enemies, collecting resources, crafting weapons, and upgrading their equipment.

## Project Structure
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks
- **Build Tool**: Vite

## Tech Stack
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Supabase JS (for potential future backend integration)

## Key Features
- Real-time game engine with canvas rendering
- Weapon system with perks and upgrades
- Crafting and inventory management
- Multiple biomes with unique features
- Wave-based enemy system
- Admin mode for testing
- Touch controls for mobile devices
- Resource gathering and trading

## Development
The project is configured to run on Replit with:
- Development server on port 5000
- Host binding to 0.0.0.0 for Replit proxy
- HMR configured for the Replit environment

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

## Deployment
Configured for Replit Autoscale deployment:
- Build command: `npm run build`
- Run command: `npm run preview`
- Deployment type: Autoscale (stateless web application)

## Game Controls
- **WASD/Arrow Keys**: Move character
- **Mouse**: Aim and shoot
- **Space**: Dash
- **I**: Open inventory
- **C**: Open crafting menu
- **F**: Interact with objects
- **1-9**: Switch weapons

## Current State
- Project successfully set up in Replit environment
- All dependencies installed
- Development server running on port 5000
- Game fully functional with all systems operational
- Deployment configuration complete

## Recent Changes
- October 27, 2025: Initial Replit setup
  - Configured Vite for Replit environment (port 5000, host 0.0.0.0)
  - Updated .gitignore with standard Node.js patterns
  - Set up development workflow
  - Configured deployment settings
  - Verified game functionality
