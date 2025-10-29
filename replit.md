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
- Multiplayer support with smooth position interpolation and PvP toggle
- Weapon system with perks and upgrades
- Advanced melee combat system with visual effects and movement mechanics
- Randomizable melee weapon Forms system (all Forms can roll on any melee weapon)
- Melee weapon Forms with player movement (dash, lunge effects)
- Projectile deflection mechanics for melee weapons
- Crafting and inventory management
- Multiple biomes with unique features and clustered resource spawning
- Wave-based enemy system with 8 unique miniboss encounters
- Miniboss system with phase-based behaviors, unique attacks, and guaranteed loot drops
- Admin mode for testing
- Optimized touch controls for mobile devices
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
- October 29, 2025: Drone System & Miniboss AI Improvements
  - **Drone Inventory UI**: Added dedicated drone section to inventory screen with equip/unequip/delete functionality matching weapon inventory patterns
  - **Drone Crafting Fix**: Fixed drone crafting to properly route drones to inventory instead of consumables tab using DroneType check
  - **Miniboss AI Overhaul**: Completely redesigned miniboss movement AI with strategic positioning:
    - Kiting behavior at close range (strafe sideways while backing away)
    - Circling behavior at optimal attack range (orbit around player)
    - Pursuit behavior at far range (chase player)
    - Optimal range calculation per miniboss type for balanced encounters
    - Telegraph slowdown and dash cancellation for fair telegraphed attacks
  - **Melee Weapon Perks Expansion**: Added 15+ new melee-specific perks including:
    - Riposte Master (counterattack on taking damage)
    - Sweeping Fury, Precision Striker, Reaper Spin (swing angle modifiers)
    - Finishing Blow, Crushing Blow (special combo/execution perks)
    - Dance of Blades, Master's Technique (combo count modifiers)
    - Whirling Dervish, Lunging Strike (movement-based perks)
    - Steel Tempest, Blade Echo, Vorpal Edge (legendary effects)
  - **Drone Effects Enhancement**: Enhanced all 15 drone types with detailed passive and active effects:
    - Assault Drone: +15% player damage passive, burst fire active
    - Shield Drone: 20% damage absorption passive, emergency shield bubble active
    - Repair/Medic Drones: HP regeneration passives, instant heal actives
    - Scout Drone: Detection range passive, enemy marking active
    - Plasma Drone: Piercing passive, overcharge active
    - Tesla Drone: Chain lightning passive, tesla storm active
    - And more unique effects for all drone types with balanced cooldowns

- October 28, 2025: Miniboss System Implementation
  - **8 Unique Minibosses**: Implemented biome-specific miniboss encounters (Angulodon, Cryostag Vanguard, Pyroclast Behemoth, Mirelurker Matron, Prism Guardian, Null Siren, Solstice Warden, Rift Revenant)
  - **Biome-Feature Spawning**: Minibosses spawn based on biome features (e.g., Angulodon only near coral reefs, Cryostag at glacial spires)
  - **Phase-Based Behavior**: Each miniboss has 2-3 phases that change their attack patterns as health decreases
  - **Unique Attack Patterns**: 4+ unique attacks per miniboss with telegraphs and cooldowns
  - **Special Mechanics**: Implemented unique mechanics like Angulodon's fin/submerged state, whirlpool attacks, Cryostag's armor system, Pyroclast's shield, and orbital weapons
  - **Guaranteed Loot**: Minibosses drop guaranteed singularity cores plus biome-specific resources and optional weapons
  - **Spawn Management**: Wave-based spawn conditions with per-feature cooldowns to prevent spam
  - **Integration**: Fully integrated into GameEngine with spawn checking, update loops, and death handling

- October 28, 2025: Multiplayer Sync & UI Overhaul
  - **Position Synchronization Fix**: Implemented immediate position sync messages (`PlayerPositionSync`) for spawning, respawning, and teleporting events to prevent position mismatch between host and remote player views
  - **Death Detection Fix**: Added centralized `checkPlayerDeath()` method called after all damage sources (environmental hazards, projectiles, enemy collisions) to prevent negative health survival bug
  - **Destiny 2-Style Inventory UI**: Complete redesign with hover-based stowed weapon display and weapon swapping via slot selection
  - **Melee Weapon Stats**: Added range stat to all weapon cards, stance (Form) display, and description text for melee weapons

- October 28, 2025: PvP and Melee Combat Overhaul
  - **PvP Toggle System**: Added multiplayer PvP toggle allowing players to damage each other when enabled
  - **Projectile PvP System**: Implemented playerId tracking on projectiles to enable fair cross-player damage
  - **Melee Visual Improvements**: 
    - Removed sword visual rendering for cleaner aesthetic
    - Added crosshair indicator showing melee weapon range
    - Made swipe trails thinner (lineWidth reduced from 20 to 6) with enhanced particle effects
  - **Melee Combat Redesign**:
    - Increased all swing durations by 2.5x for more deliberate, tactical gameplay
    - Added player movement mechanics to Forms (dash forward, lunge effects)
    - Made Forms randomizable - any melee weapon can roll any Form as a perk
  - **World Generation Improvements**:
    - Enhanced pearl spawning to cluster near coral reef features (95% spawn rate, 20-70 unit radius)
    - Improved cryo kelp spawning near glacial spires (95% spawn rate, 30-90 unit radius)

- October 28, 2025: Multiplayer and Melee Combat Expansion
  - Fixed multiplayer position desync with smooth interpolation system
  - Optimized touch controls with ref-based event handlers
  - Added visual melee weapon rendering (sword models, swipe animations, particle trails)
  - Implemented Forms system for melee combos (7 unique Forms)
  - Added 6 new unique melee weapons (Crimson Scythe, Titan Hammer, Flowing Glaive, Shadow Daggers, Berserker Axe, Guardian Blade)
  - Added 10 new melee weapon perks including legendary Projectile Deflection
  - Implemented functional projectile deflection that reverses enemy projectiles during sword swings
  
- October 27, 2025: Initial Replit setup
  - Configured Vite for Replit environment (port 5000, host 0.0.0.0)
  - Updated .gitignore with standard Node.js patterns
  - Set up development workflow
  - Configured deployment settings
  - Verified game functionality
