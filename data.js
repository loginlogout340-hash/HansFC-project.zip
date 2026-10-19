/* HANS FC - game data. Every player, club and legend in this game is made up. Any resemblance to a real person is a coincidence. */
var HFC = (typeof window !== 'undefined') ? (window.HFC = window.HFC || {}) : (global.HFC = global.HFC || {});

HFC.rand = Math.random; // replaced by a seeded generator in tests

/* names by region: [first names], [last names] */
HFC.REGIONS = {
  wa: { first: ['Kwame', 'Kofi', 'Yaw', 'Kwesi', 'Nii', 'Ebo', 'Selorm', 'Fiifi', 'Emeka', 'Chidi', 'Tunde', 'Segun', 'Ibrahim', 'Musa', 'Seydou', 'Moussa'], last: ['Mensah', 'Boateng', 'Owusu', 'Asante', 'Quaye', 'Annan', 'Lamptey', 'Tetteh', 'Okoye', 'Adeyemi', 'Balogun', 'Nwosu', 'Diarra', 'Traore', 'Keita', 'Sow'] },
  na: { first: ['Youssef', 'Amine', 'Karim', 'Hakim', 'Nabil', 'Samir', 'Rayan', 'Walid', 'Bilal', 'Omar', 'Idriss', 'Tarek'], last: ['Benali', 'Haddad', 'Mansouri', 'Zerrouki', 'Saidi', 'Bouazza', 'Khelifi', 'Amrani', 'Cherif', 'Brahimi', 'Ziani', 'Fassi'] },
  la: { first: ['Mateo', 'Joaquin', 'Thiago', 'Rafael', 'Diego', 'Bruno', 'Gabriel', 'Lucas', 'Santiago', 'Nicolas', 'Andres', 'Felipe', 'Caio', 'Renan', 'Tomas', 'Emilio'], last: ['Duarte', 'Ferreira', 'Salvatierra', 'Cardoso', 'Montalvo', 'Rezende', 'Barros', 'Ibarra', 'Quintero', 'Lacerda', 'Pereyra', 'Valdez', 'Menezes', 'Arriaga', 'Camargo', 'Sandoval'] },
  eu: { first: ['Lucien', 'Hugo', 'Matteo', 'Luca', 'Stefan', 'Jonas', 'Anders', 'Milan', 'Pieter', 'Marek', 'Elias', 'Antoine', 'Finn', 'Dario', 'Viktor', 'Leon'], last: ['Duclos', 'Marchetti', 'Brandvold', 'Kessler', 'Lindqvist', 'Novak', 'Vermeer', 'Rossetti', 'Baumann', 'Lefevre', 'Halvorsen', 'Petrov', 'Moretti', 'Aubert', 'Kovac', 'Strand'] },
  uk: { first: ['Callum', 'Jamie', 'Ryan', 'Connor', 'Owen', 'Harvey', 'Liam', 'Ellis', 'Declan', 'Marcus', 'Reece', 'Jordan'], last: ['Whitlock', 'Harrow', 'Pemberton', 'Ashworth', 'Garside', 'Thorne', 'Radcliffe', 'Hollis', 'Fenwick', 'Tolliver', 'Brannigan', 'Calloway'] },
  as: { first: ['Haruto', 'Kenji', 'Daiki', 'Min-jun', 'Joon', 'Seung', 'Takumi', 'Ren', 'Hyun', 'Sota', 'Tae', 'Yuto'], last: ['Takeshiro', 'Hayashida', 'Morikawa', 'Kang', 'Baek', 'Shinoda', 'Yoon', 'Katsuragi', 'Han', 'Okazaki', 'Seo', 'Fujimoto'] },
};
HFC.NATIONS = [
  ['Ghana', '🇬🇭', 'wa'], ['Nigeria', '🇳🇬', 'wa'], ['Senegal', '🇸🇳', 'wa'], ['Ivory Coast', '🇨🇮', 'wa'], ['Mali', '🇲🇱', 'wa'],
  ['Morocco', '🇲🇦', 'na'], ['Algeria', '🇩🇿', 'na'], ['Egypt', '🇪🇬', 'na'], ['Tunisia', '🇹🇳', 'na'],
  ['Brazil', '🇧🇷', 'la'], ['Argentina', '🇦🇷', 'la'], ['Colombia', '🇨🇴', 'la'], ['Uruguay', '🇺🇾', 'la'], ['Spain', '🇪🇸', 'la'], ['Portugal', '🇵🇹', 'la'], ['Mexico', '🇲🇽', 'la'],
  ['France', '🇫🇷', 'eu'], ['Germany', '🇩🇪', 'eu'], ['Italy', '🇮🇹', 'eu'], ['Netherlands', '🇳🇱', 'eu'], ['Norway', '🇳🇴', 'eu'], ['Croatia', '🇭🇷', 'eu'], ['Poland', '🇵🇱', 'eu'],
  ['England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'uk'], ['Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'uk'], ['Japan', '🇯🇵', 'as'], ['South Korea', '🇰🇷', 'as'],
];
HFC.CLUBS = [
  ['Harbor Rovers', '#1d6fb8'], ['Northgate United', '#c0392b'], ['Atlas City', '#7fb2e5'], ['Sunport FC', '#f2a900'], ['Riverside Athletic', '#2e8b57'],
  ['Ironvale', '#5d6d7e'], ['Crown Albion', '#7d3c98'], ['Kestrel Town', '#d35400'], ['Saltmarsh', '#16a085'], ['Dockside Wanderers', '#273746'],
  ['Highfield Royals', '#b03a2e'], ['Blue Orchard', '#2874a6'], ['Redcliff Argyle', '#cb4335'], ['Stonebridge', '#839192'], ['Mapleton Dynamo', '#c0762b'],
  ['Coral Bay SC', '#e67e73'], ['Vanguard Park', '#1f618d'], ['Thornwood', '#196f3d'], ['Silverlake', '#a6acaf'], ['Golden Mile', '#d4ac0d'],
];
HFC.LEGENDS = [
  ['Idris Okonkwo-Vale', 'ST', 94, 'Nigeria'], ['Matteo Salvatierra', 'CAM', 93, 'Italy'], ['Kwabena Asare-Quist', 'CB', 92, 'Ghana'], ['Luka Brandvold', 'GK', 93, 'Norway'],
  ['Joaquin Ferreiro Dal', 'LW', 94, 'Argentina'], ['Nobu Takeshiro', 'CM', 91, 'Japan'], ['Anselm Duclos', 'CDM', 92, 'France'], ['Rui Carvalhal', 'RW', 93, 'Portugal'],
  ['Ezekiel Maddox', 'LB', 91, 'England'], ['Hamza El-Idrissi', 'RB', 91, 'Morocco'], ['Felix Wendt-Aronsen', 'ST', 95, 'Germany'], ['Dario Quintanilla', 'CM', 92, 'Colombia'],
];

/* positions */
HFC.GROUP = { GK: 'G', LB: 'D', CB: 'D', RB: 'D', CDM: 'M', CM: 'M', CAM: 'M', LM: 'M', RM: 'M', LW: 'A', RW: 'A', ST: 'A' };
HFC.NEAR = {
  LB: { CB: 6, LM: 8 }, RB: { CB: 6, RM: 8 }, CB: { CDM: 6, LB: 6, RB: 6 }, CDM: { CM: 2, CB: 7, CAM: 5 }, CM: { CDM: 2, CAM: 2, LM: 5, RM: 5 },
  CAM: { CM: 2, CDM: 5, LW: 6, RW: 6, ST: 6 }, LM: { LW: 2, CM: 5, LB: 7 }, RM: { RW: 2, CM: 5, RB: 7 }, LW: { LM: 2, ST: 5, RW: 4 }, RW: { RM: 2, ST: 5, LW: 4 }, ST: { LW: 5, RW: 5, CAM: 6 },
};
/* formations: [pos, x, y]  (y = 0 is the opponent's goal, y = 100 is your goal) */
HFC.FORMATIONS = {
  '4-3-3': [['GK', 50, 90], ['LB', 14, 70], ['CB', 36, 75], ['CB', 64, 75], ['RB', 86, 70], ['CM', 28, 52], ['CDM', 50, 58], ['CM', 72, 52], ['LW', 17, 27], ['ST', 50, 20], ['RW', 83, 27]],
  '4-4-2': [['GK', 50, 90], ['LB', 14, 70], ['CB', 36, 75], ['CB', 64, 75], ['RB', 86, 70], ['LM', 14, 48], ['CM', 38, 54], ['CM', 62, 54], ['RM', 86, 48], ['ST', 37, 22], ['ST', 63, 22]],
  '4-2-3-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 36, 75], ['CB', 64, 75], ['RB', 86, 70], ['CDM', 36, 58], ['CDM', 64, 58], ['LM', 16, 38], ['CAM', 50, 38], ['RM', 84, 38], ['ST', 50, 18]],
  '3-5-2': [['GK', 50, 90], ['CB', 25, 76], ['CB', 50, 78], ['CB', 75, 76], ['LM', 10, 50], ['CM', 32, 54], ['CDM', 50, 60], ['CM', 68, 54], ['RM', 90, 50], ['ST', 37, 22], ['ST', 63, 22]],
  '5-3-2': [['GK', 50, 90], ['LB', 10, 68], ['CB', 30, 76], ['CB', 50, 78], ['CB', 70, 76], ['RB', 90, 68], ['CM', 28, 52], ['CM', 50, 50], ['CM', 72, 52], ['ST', 37, 22], ['ST', 63, 22]],
};

HFC.RARITY = {
  bronze: { name: 'Bronze', min: 55, max: 64 }, silver: { name: 'Silver', min: 65, max: 74 }, gold: { name: 'Gold', min: 75, max: 84 },
  elite: { name: 'Elite', min: 85, max: 90 }, legend: { name: 'Legend', min: 91, max: 95 },
};
HFC.rarityOf = (ovr) => (ovr >= 91 ? 'legend' : ovr >= 85 ? 'elite' : ovr >= 75 ? 'gold' : ovr >= 65 ? 'silver' : 'bronze');

/* packs: weights are the chance of each rarity for one card; guarantee = minimum rarity of the best card */
HFC.PACKS = {
  bronze: { name: 'Bronze Pack', price: 500, cards: 5, w: { bronze: 88, silver: 12 }, note: 'Mostly bronze, a little silver' },
  silver: { name: 'Silver Pack', price: 1500, cards: 5, w: { bronze: 14, silver: 70, gold: 16 }, note: 'Silver with a chance of gold' },
  gold: { name: 'Gold Pack', price: 4000, cards: 5, w: { silver: 22, gold: 68, elite: 9.2, legend: 0.8 }, note: 'Gold, elite and rare legends' },
  premium: { name: 'Premium Pack', price: 10000, cards: 6, w: { gold: 70, elite: 26, legend: 4 }, guarantee: 'elite', note: 'One elite or better, guaranteed' },
  daily: { name: 'Daily Free Pack', price: 0, cards: 3, w: { bronze: 45, silver: 47, gold: 8 }, note: 'Free every day' },
};
HFC.MENTALITY = ['defensive', 'balanced', 'attacking'];
HFC.STYLE = ['possession', 'counter', 'direct'];
