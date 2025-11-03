# MechaRyan Game

## Overview
MechaRyan is a top-down action survival game built with React, TypeScript, and Vite. Players control a mech character navigating through various biomes, fighting enemies, collecting resources, crafting weapons, and upgrading their equipment. The game features real-time action, multiplayer capabilities, a deep crafting system, and dynamic world events. Its ambition is to provide an engaging and replayable survival experience with extensive customization and strategic combat.

## User Preferences
- I want iterative development.
- Ask before making major changes.

## System Architecture
The game is built using React, TypeScript, and Vite for the frontend, leveraging Tailwind CSS for styling and Lucide React for icons. State management is handled with React hooks. The core game engine utilizes canvas rendering for real-time action.

**UI/UX Decisions:**
- **Inventory UI:** Destiny 2-style inventory redesign with hover-based stowed weapon display and slot-based weapon swapping. Includes a dedicated drone section showing equipped and stowed drones, their stats, and effects.
- **HUD:** Simplified HUD, condensing health/dash into a compact card and moving currency to the Resources inventory tab.
- **Visuals:** Enhanced drone visuals with multiple colors, geometric shapes, layered patterns, orbit/spin/hover animations, and glow effects. Melee weapon swipe trails are thinner with enhanced particle effects, and a crosshair indicates melee weapon range.
- **Interaction Prompts:** Dynamic interaction prompts for in-world objects (vault nodes, campfires, field anchors).
- **Teleportation UI:** Campfire interaction opens a teleportation menu for activated planar anchors.

**Technical Implementations:**
- **Game Engine:** Real-time canvas rendering with a robust update loop.
- **Multiplayer:** Supports multiplayer with smooth position interpolation, PvP toggle, and projectile `playerId` tracking for fair damage. Immediate position sync on spawn, respawn, and teleport.
- **Combat System:**
    - **Melee:** Advanced melee combat with visual effects, player movement mechanics (dash, lunge), and randomizable "Forms" system. Melee weapons can deflect projectiles.
    - **Weapons:** Weapon system with perks and upgrades, ensuring category-appropriate perk application (melee-specific perks for melee weapons).
    - **Blink Ability:** Alternative movement ability (replaces dash when a void drone is equipped) with 3 charges and a recharge mechanism.
- **Enemy System:** Wave-based enemy system featuring 8 unique minibosses with phase-based behaviors, unique attacks, special mechanics, and guaranteed loot drops. Miniboss AI includes kiting, circling, and pursuit behaviors based on range.
- **World & Events:** Multiple biomes with unique features, clustered resource spawning, and a dynamic world events system with 10 unique event types (e.g., Planar Raiders, Altar Boss, Warp Storm). Field anchors generate automatically in world chunks and integrate with the chunk loading system.
- **Crafting & Inventory:** Comprehensive crafting and inventory management.
- **Drone System:** 15 types of drones with distinct visual rendering, detailed passive effects (e.g., HP regeneration, damage absorption), and active abilities (e.g., emergency shield, healing pool, tactical mode). Drones are purely visual/effect-based companions without HP.
- **Controls:** Optimized touch controls for mobile devices and standard keyboard/mouse controls.
- **Admin Mode:** Included for testing purposes.

**System Design Choices:**
- **Modularity:** `WorldEventSystem` and `WorldEventRenderer` are modular and integrated into `GameEngine` and `GameCanvas`. `DroneRenderer` is integrated into the `GameCanvas` rendering pipeline.
- **Centralized Logic:** `checkPlayerDeath()` method centralizes player death detection.
- **Resource Management:** Resource gathering and trading are core mechanics.

## External Dependencies
- **React**: Frontend library.
- **TypeScript**: Superset of JavaScript for type-safe development.
- **Vite**: Build tool for fast development.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library for React components.
- **Supabase JS**: (For potential future backend integration, currently not fully integrated).