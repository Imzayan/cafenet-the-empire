// assets.js — فهرست مسیرها، anchorها و جدول SPRITE_SCALE (تولیدشده از ابعاد واقعی assetها)
// anchor: [0..1 در تصویر] — پایین‌وسط (0.5,1) برای اشیای زمینی، بالا-وسط (0.5,0) برای تابلوهای دیواری
'use strict';
window.CA = {
 "characters": {
  "kid1_big": {
   "src": "assets/characters/kid1_big.png",
   "w": 47,
   "h": 93,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.9892
  },
  "kid1_chibi": {
   "src": "assets/characters/kid1_chibi.png",
   "w": 39,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid2_big": {
   "src": "assets/characters/kid2_big.png",
   "w": 46,
   "h": 90,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.0222
  },
  "kid2_chibi": {
   "src": "assets/characters/kid2_chibi.png",
   "w": 36,
   "h": 58,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid3_big": {
   "src": "assets/characters/kid3_big.png",
   "w": 52,
   "h": 89,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.0337
  },
  "kid3_chibi": {
   "src": "assets/characters/kid3_chibi.png",
   "w": 36,
   "h": 58,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid4_big": {
   "src": "assets/characters/kid4_big.png",
   "w": 48,
   "h": 93,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.9892
  },
  "kid4_chibi": {
   "src": "assets/characters/kid4_chibi.png",
   "w": 37,
   "h": 58,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid5_big": {
   "src": "assets/characters/kid5_big.png",
   "w": 46,
   "h": 91,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.011
  },
  "kid5_chibi": {
   "src": "assets/characters/kid5_chibi.png",
   "w": 37,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid6_big": {
   "src": "assets/characters/kid6_big.png",
   "w": 50,
   "h": 92,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid6_chibi": {
   "src": "assets/characters/kid6_chibi.png",
   "w": 36,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid7_big": {
   "src": "assets/characters/kid7_big.png",
   "w": 47,
   "h": 91,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.011
  },
  "kid7_chibi": {
   "src": "assets/characters/kid7_chibi.png",
   "w": 36,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid8_big": {
   "src": "assets/characters/kid8_big.png",
   "w": 50,
   "h": 92,
   "ax": 0.5,
   "ay": 1.0
  },
  "kid8_chibi": {
   "src": "assets/characters/kid8_chibi.png",
   "w": 34,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "staff_f1_big": {
   "src": "assets/characters/staff_f1_big.png",
   "w": 58,
   "h": 95,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.0105
  },
  "staff_f2_big": {
   "src": "assets/characters/staff_f2_big.png",
   "w": 54,
   "h": 94,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.0213
  },
  "staff_m1_big": {
   "src": "assets/characters/staff_m1_big.png",
   "w": 54,
   "h": 96,
   "ax": 0.5,
   "ay": 1.0
  },
  "staff_m2_big": {
   "src": "assets/characters/staff_m2_big.png",
   "w": 51,
   "h": 96,
   "ax": 0.5,
   "ay": 1.0
  }
 },
 "furniture": {
  "armchair_a": {
   "src": "assets/furniture/armchair_a.png",
   "w": 85,
   "h": 81,
   "ax": 0.5,
   "ay": 1.0
  },
  "armchair_b": {
   "src": "assets/furniture/armchair_b.png",
   "w": 84,
   "h": 81,
   "ax": 0.5,
   "ay": 1.0
  },
  "bookshelf": {
   "src": "assets/furniture/bookshelf.png",
   "w": 81,
   "h": 90,
   "ax": 0.5,
   "ay": 1.0
  },
  "chair_blue": {
   "src": "assets/furniture/chair_blue.png",
   "w": 60,
   "h": 109,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.6422
  },
  "chair_office": {
   "src": "assets/furniture/chair_office.png",
   "w": 62,
   "h": 100,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.7
  },
  "chair_purple": {
   "src": "assets/furniture/chair_purple.png",
   "w": 72,
   "h": 111,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.6306
  },
  "chair_red": {
   "src": "assets/furniture/chair_red.png",
   "w": 66,
   "h": 110,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.6364
  },
  "coffee_machine": {
   "src": "assets/furniture/coffee_machine.png",
   "w": 51,
   "h": 80,
   "ax": 0.5,
   "ay": 1.0
  },
  "coffee_table": {
   "src": "assets/furniture/coffee_table.png",
   "w": 165,
   "h": 70,
   "ax": 0.5,
   "ay": 1.0
  },
  "desk_wood": {
   "src": "assets/furniture/desk_wood.png",
   "w": 169,
   "h": 95,
   "ax": 0.5,
   "ay": 1.0
  },
  "door_wood": {
   "src": "assets/furniture/door_wood.png",
   "w": 66,
   "h": 117,
   "ax": 0.5,
   "ay": 1.0
  },
  "gaming_desk_a": {
   "src": "assets/furniture/gaming_desk_a.png",
   "w": 104,
   "h": 93,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 1.0108
  },
  "gaming_desk_b": {
   "src": "assets/furniture/gaming_desk_b.png",
   "w": 106,
   "h": 95,
   "ax": 0.5,
   "ay": 1.0,
   "sc": 0.9895
  },
  "plant_large": {
   "src": "assets/furniture/plant_large.png",
   "w": 76,
   "h": 130,
   "ax": 0.5,
   "ay": 1.0
  },
  "plant_small": {
   "src": "assets/furniture/plant_small.png",
   "w": 46,
   "h": 85,
   "ax": 0.5,
   "ay": 1.0
  },
  "plant_tall": {
   "src": "assets/furniture/plant_tall.png",
   "w": 62,
   "h": 125,
   "ax": 0.5,
   "ay": 1.0
  },
  "reception_desk": {
   "src": "assets/furniture/reception_desk.png",
   "w": 148,
   "h": 100,
   "ax": 0.5,
   "ay": 1.0
  },
  "round_table": {
   "src": "assets/furniture/round_table.png",
   "w": 82,
   "h": 76,
   "ax": 0.5,
   "ay": 1.0
  },
  "snack_cabinet": {
   "src": "assets/furniture/snack_cabinet.png",
   "w": 39,
   "h": 68,
   "ax": 0.5,
   "ay": 1.0
  },
  "sofa_black": {
   "src": "assets/furniture/sofa_black.png",
   "w": 175,
   "h": 81,
   "ax": 0.5,
   "ay": 1.0
  },
  "stool": {
   "src": "assets/furniture/stool.png",
   "w": 36,
   "h": 56,
   "ax": 0.5,
   "ay": 1.0
  },
  "vending_fridge": {
   "src": "assets/furniture/vending_fridge.png",
   "w": 66,
   "h": 89,
   "ax": 0.5,
   "ay": 1.0
  },
  "water_cooler": {
   "src": "assets/furniture/water_cooler.png",
   "w": 48,
   "h": 98,
   "ax": 0.5,
   "ay": 1.0
  },
  "window_blinds": {
   "src": "assets/furniture/window_blinds.png",
   "w": 142,
   "h": 122,
   "ax": 0.5,
   "ay": 1.0
  }
 },
 "signs": {
  "cafenet_logo": {
   "src": "assets/signs/cafenet_logo.png",
   "w": 125,
   "h": 99,
   "ax": 0.5,
   "ay": 0.0,
   "sc": 1.0101
  },
  "crown": {
   "src": "assets/signs/crown.png",
   "w": 61,
   "h": 99,
   "ax": 0.5,
   "ay": 0.0,
   "sc": 1.0101
  },
  "game_on": {
   "src": "assets/signs/game_on.png",
   "w": 78,
   "h": 99,
   "ax": 0.5,
   "ay": 0.0,
   "sc": 1.0101
  },
  "headphones": {
   "src": "assets/signs/headphones.png",
   "w": 73,
   "h": 99,
   "ax": 0.5,
   "ay": 0.0,
   "sc": 1.0101
  }
 },
 "ui": {
  "arrows_blue": {
   "src": "assets/ui/arrows_blue.png",
   "w": 54,
   "h": 76,
   "ax": 0.5,
   "ay": 1.0
  },
  "badge_gamepad": {
   "src": "assets/ui/badge_gamepad.png",
   "w": 45,
   "h": 51,
   "ax": 0.5,
   "ay": 1.0
  },
  "banner_crown": {
   "src": "assets/ui/banner_crown.png",
   "w": 49,
   "h": 93,
   "ax": 0.5,
   "ay": 1.0
  },
  "burst_green": {
   "src": "assets/ui/burst_green.png",
   "w": 58,
   "h": 57,
   "ax": 0.5,
   "ay": 1.0
  },
  "calendar": {
   "src": "assets/ui/calendar.png",
   "w": 63,
   "h": 63,
   "ax": 0.5,
   "ay": 1.0
  },
  "cart": {
   "src": "assets/ui/cart.png",
   "w": 62,
   "h": 63,
   "ax": 0.5,
   "ay": 1.0
  },
  "chart": {
   "src": "assets/ui/chart.png",
   "w": 63,
   "h": 63,
   "ax": 0.5,
   "ay": 1.0
  },
  "chevron_gold": {
   "src": "assets/ui/chevron_gold.png",
   "w": 46,
   "h": 43,
   "ax": 0.5,
   "ay": 1.0
  },
  "clipboard": {
   "src": "assets/ui/clipboard.png",
   "w": 63,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "coin": {
   "src": "assets/ui/coin.png",
   "w": 63,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "crown": {
   "src": "assets/ui/crown.png",
   "w": 62,
   "h": 65,
   "ax": 0.5,
   "ay": 1.0
  },
  "diamond": {
   "src": "assets/ui/diamond.png",
   "w": 64,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "emblem_diamond": {
   "src": "assets/ui/emblem_diamond.png",
   "w": 75,
   "h": 49,
   "ax": 0.5,
   "ay": 1.0
  },
  "frame_purple": {
   "src": "assets/ui/frame_purple.png",
   "w": 58,
   "h": 68,
   "ax": 0.5,
   "ay": 1.0
  },
  "gear": {
   "src": "assets/ui/gear.png",
   "w": 63,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "gift": {
   "src": "assets/ui/gift.png",
   "w": 63,
   "h": 64,
   "ax": 0.5,
   "ay": 1.0
  },
  "megaphone": {
   "src": "assets/ui/megaphone.png",
   "w": 63,
   "h": 63,
   "ax": 0.5,
   "ay": 1.0
  },
  "plant_small": {
   "src": "assets/ui/plant_small.png",
   "w": 57,
   "h": 79,
   "ax": 0.5,
   "ay": 1.0
  },
  "star": {
   "src": "assets/ui/star.png",
   "w": 63,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  },
  "trophy": {
   "src": "assets/ui/trophy.png",
   "w": 63,
   "h": 59,
   "ax": 0.5,
   "ay": 1.0
  }
 }
};

// جدول نرمال‌سازی مقیاس — مقدار پیش‌فرض ۱؛ هر کلید = ضریب ارتفاع در واحد جهان
window.SPRITE_SCALE = {
 "default": 1.0,
 "characters/kid1_big": 0.9892,
 "characters/kid2_big": 1.0222,
 "characters/kid3_big": 1.0337,
 "characters/kid4_big": 0.9892,
 "characters/kid5_big": 1.011,
 "characters/kid7_big": 1.011,
 "characters/staff_f1_big": 1.0105,
 "characters/staff_f2_big": 1.0213,
 "furniture/chair_blue": 0.6422,
 "furniture/chair_office": 0.7,
 "furniture/chair_purple": 0.6306,
 "furniture/chair_red": 0.6364,
 "furniture/gaming_desk_a": 1.0108,
 "furniture/gaming_desk_b": 0.9895,
 "signs/cafenet_logo": 1.0101,
 "signs/crown": 1.0101,
 "signs/game_on": 1.0101,
 "signs/headphones": 1.0101
};
