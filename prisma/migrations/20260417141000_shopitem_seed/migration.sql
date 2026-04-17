-- Seed initial shop items (idempotent via INSERT OR IGNORE)
INSERT OR IGNORE INTO "ShopItem" ("id", "name", "description", "type", "slot", "category", "rarity", "price", "active")
VALUES
  ('shopitem_frame_basic',   'Moldura Básica',                  'Moldura simples para seu avatar',                  'AVATAR_FRAME', 'frame', 'AVATAR',    'COMUM',    30,  true),
  ('shopitem_title_stud',    'Título: Estudioso',               'Para quem nunca para de aprender',                 'TITLE',        'title', 'CONQUISTA', 'COMUM',    20,  true),
  ('shopitem_badge_psico',   'Badge: Psicólogo',                'Símbolo da psicologia',                            'BADGE',        'badge', 'CONQUISTA', 'INCOMUM',  50,  true),
  ('shopitem_bg_lilas',      'Fundo Lilás',                     'Fundo em tom lilás suave para seu perfil',         'BACKGROUND',   'bg',    'TEMA',      'COMUM',    40,  true),
  ('shopitem_frame_gold',    'Moldura Dourada',                 'Moldura dourada para os mais dedicados',           'AVATAR_FRAME', 'frame', 'AVATAR',    'RARO',    100,  true),
  ('shopitem_title_mestre',  'Título: Mestre do Inconsciente',  'Conquistado por grandes estudiosos de Freud',      'TITLE',        'title', 'CONQUISTA', 'ÉPICO',   200,  true),
  ('shopitem_frame_plat',    'Moldura Platina',                 'Para os que atingiram o topo do conhecimento',     'AVATAR_FRAME', 'frame', 'AVATAR',    'ÉPICO',   300,  true),
  ('shopitem_badge_freud',   'Badge: Freud',                    'O pai da psicanálise em forma de insígnia rara',   'BADGE',        'badge', 'ESPECIAL',  'LENDÁRIO', 500,  true);
