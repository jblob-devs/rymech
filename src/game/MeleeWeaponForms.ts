export type ComboStrike = {
  name: string;
  angleOffset: number;
  damageMultiplier: number;
  swingAngleModifier: number;
  speedModifier: number;
  effectType?: 'none' | 'slam' | 'thrust' | 'spin' | 'wide';
};

export type MeleeForm = {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  comboPattern: ComboStrike[];
  icon: string;
};

export const MELEE_FORMS: Record<string, MeleeForm> = {
  basic_form: {
    id: 'basic_form',
    name: 'Basic Form',
    description: 'Standard swing pattern',
    rarity: 'common',
    icon: 'sword',
    comboPattern: [
      {
        name: 'Right Slash',
        angleOffset: 0,
        damageMultiplier: 1.0,
        swingAngleModifier: 1.0,
        speedModifier: 1.0,
        effectType: 'none',
      },
      {
        name: 'Left Slash',
        angleOffset: 0,
        damageMultiplier: 1.0,
        swingAngleModifier: 1.0,
        speedModifier: 1.0,
        effectType: 'none',
      },
      {
        name: 'Overhead Slam',
        angleOffset: -30,
        damageMultiplier: 1.3,
        swingAngleModifier: 0.8,
        speedModifier: 0.9,
        effectType: 'slam',
      },
    ],
  },

  rapid_form: {
    id: 'rapid_form',
    name: 'Rapid Form',
    description: 'Quick consecutive strikes with increasing speed',
    rarity: 'rare',
    icon: 'zap',
    comboPattern: [
      {
        name: 'Quick Slash',
        angleOffset: 0,
        damageMultiplier: 0.7,
        swingAngleModifier: 0.8,
        speedModifier: 1.4,
        effectType: 'none',
      },
      {
        name: 'Reverse Slash',
        angleOffset: 0,
        damageMultiplier: 0.75,
        swingAngleModifier: 0.8,
        speedModifier: 1.5,
        effectType: 'none',
      },
      {
        name: 'Rapid Flurry',
        angleOffset: 0,
        damageMultiplier: 0.85,
        swingAngleModifier: 0.9,
        speedModifier: 1.6,
        effectType: 'none',
      },
    ],
  },

  heavy_form: {
    id: 'heavy_form',
    name: 'Heavy Form',
    description: 'Powerful strikes: thrust, thrust, crushing slam',
    rarity: 'rare',
    icon: 'hammer',
    comboPattern: [
      {
        name: 'Power Thrust',
        angleOffset: 0,
        damageMultiplier: 1.3,
        swingAngleModifier: 0.5,
        speedModifier: 0.8,
        effectType: 'thrust',
      },
      {
        name: 'Heavy Thrust',
        angleOffset: 0,
        damageMultiplier: 1.5,
        swingAngleModifier: 0.5,
        speedModifier: 0.75,
        effectType: 'thrust',
      },
      {
        name: 'Crushing Slam',
        angleOffset: -45,
        damageMultiplier: 2.5,
        swingAngleModifier: 1.2,
        speedModifier: 0.6,
        effectType: 'slam',
      },
    ],
  },

  flowing_form: {
    id: 'flowing_form',
    name: 'Flowing Form',
    description: 'Circular sweeping attacks with extended reach',
    rarity: 'epic',
    icon: 'wind',
    comboPattern: [
      {
        name: 'Wide Sweep',
        angleOffset: -45,
        damageMultiplier: 1.0,
        swingAngleModifier: 1.5,
        speedModifier: 1.0,
        effectType: 'wide',
      },
      {
        name: 'Reverse Sweep',
        angleOffset: 45,
        damageMultiplier: 1.1,
        swingAngleModifier: 1.5,
        speedModifier: 1.0,
        effectType: 'wide',
      },
      {
        name: 'Full Circle',
        angleOffset: 0,
        damageMultiplier: 1.5,
        swingAngleModifier: 2.5,
        speedModifier: 0.9,
        effectType: 'spin',
      },
    ],
  },

  assassin_form: {
    id: 'assassin_form',
    name: 'Assassin Form',
    description: 'Precise strikes followed by a devastating finisher',
    rarity: 'epic',
    icon: 'crosshair',
    comboPattern: [
      {
        name: 'Precision Cut',
        angleOffset: 0,
        damageMultiplier: 1.2,
        swingAngleModifier: 0.6,
        speedModifier: 1.3,
        effectType: 'thrust',
      },
      {
        name: 'Surgical Strike',
        angleOffset: 0,
        damageMultiplier: 1.4,
        swingAngleModifier: 0.6,
        speedModifier: 1.3,
        effectType: 'thrust',
      },
      {
        name: 'Execute',
        angleOffset: 0,
        damageMultiplier: 3.0,
        swingAngleModifier: 0.7,
        speedModifier: 1.2,
        effectType: 'thrust',
      },
    ],
  },

  berserker_form: {
    id: 'berserker_form',
    name: 'Berserker Form',
    description: 'Wild, unpredictable attacks with massive damage',
    rarity: 'legendary',
    icon: 'flame',
    comboPattern: [
      {
        name: 'Reckless Swing',
        angleOffset: -30,
        damageMultiplier: 1.5,
        swingAngleModifier: 1.3,
        speedModifier: 1.1,
        effectType: 'none',
      },
      {
        name: 'Wild Strike',
        angleOffset: 30,
        damageMultiplier: 1.8,
        swingAngleModifier: 1.3,
        speedModifier: 1.15,
        effectType: 'none',
      },
      {
        name: 'Devastating Cleave',
        angleOffset: 0,
        damageMultiplier: 2.2,
        swingAngleModifier: 1.5,
        speedModifier: 1.0,
        effectType: 'wide',
      },
      {
        name: 'Rampage',
        angleOffset: 0,
        damageMultiplier: 3.5,
        swingAngleModifier: 2.0,
        speedModifier: 0.9,
        effectType: 'spin',
      },
    ],
  },

  guardian_form: {
    id: 'guardian_form',
    name: 'Guardian Form',
    description: 'Defensive strikes with knockback and protection',
    rarity: 'legendary',
    icon: 'shield',
    comboPattern: [
      {
        name: 'Defensive Slash',
        angleOffset: 0,
        damageMultiplier: 1.0,
        swingAngleModifier: 1.2,
        speedModifier: 0.95,
        effectType: 'wide',
      },
      {
        name: 'Counter Strike',
        angleOffset: 0,
        damageMultiplier: 1.3,
        swingAngleModifier: 1.0,
        speedModifier: 1.1,
        effectType: 'none',
      },
      {
        name: 'Protective Sweep',
        angleOffset: 0,
        damageMultiplier: 1.8,
        swingAngleModifier: 1.8,
        speedModifier: 0.85,
        effectType: 'wide',
      },
    ],
  },

  void_form: {
    id: 'void_form',
    name: 'Void Form',
    description: 'Dimensional slashes that ignore space',
    rarity: 'legendary',
    icon: 'sparkles',
    comboPattern: [
      {
        name: 'Void Rend',
        angleOffset: 0,
        damageMultiplier: 1.4,
        swingAngleModifier: 0.9,
        speedModifier: 1.2,
        effectType: 'thrust',
      },
      {
        name: 'Reality Slash',
        angleOffset: 90,
        damageMultiplier: 1.6,
        swingAngleModifier: 1.0,
        speedModifier: 1.2,
        effectType: 'none',
      },
      {
        name: 'Dimensional Rift',
        angleOffset: 0,
        damageMultiplier: 2.5,
        swingAngleModifier: 2.0,
        speedModifier: 1.0,
        effectType: 'spin',
      },
    ],
  },
};

export function getFormForWeapon(weaponType: string): MeleeForm {
  if (weaponType === 'void_blade') {
    return MELEE_FORMS.void_form;
  }
  
  return MELEE_FORMS.basic_form;
}

export function applyFormToMeleeStats(
  baseMeleeStats: any,
  form: MeleeForm,
  comboIndex: number
): any {
  const strike = form.comboPattern[comboIndex % form.comboPattern.length];
  
  return {
    ...baseMeleeStats,
    swingAngle: baseMeleeStats.swingAngle * strike.swingAngleModifier,
    comboCount: form.comboPattern.length,
    currentStrike: strike,
  };
}
