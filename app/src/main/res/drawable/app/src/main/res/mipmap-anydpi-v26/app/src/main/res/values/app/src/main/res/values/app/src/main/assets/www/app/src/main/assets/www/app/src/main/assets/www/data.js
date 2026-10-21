/* HANS FC 2.0 - game data.
   Real club and player NAMES are used as plain facts for a personal fan game. There are no badges, logos or photos,
   and every rating is my own rough estimate (not an official or licensed rating). Squads are from around the 2025/26 season,
   so some players will be at the wrong club or out of date: use Rename in the game to fix anything you like.
   Squad spots not covered by a real player are filled with invented players. */
var HFC = (typeof window !== 'undefined') ? (window.HFC = window.HFC || {}) : (global.HFC = global.HFC || {});
HFC.rand = Math.random; // replaced by a seeded generator in tests

/* ---- invented-name pools for filler players, by region ---- */
HFC.REGIONS = {
  wa: { first: ['Kwame', 'Kofi', 'Yaw', 'Kwesi', 'Nii', 'Ebo', 'Selorm', 'Fiifi', 'Kojo', 'Nana', 'Prince', 'Samuel', 'Emmanuel', 'Isaac', 'Abdul', 'Mohammed', 'Richmond', 'Joseph', 'Daniel', 'Felix'], last: ['Mensah', 'Boateng', 'Owusu', 'Asante', 'Quaye', 'Annan', 'Lamptey', 'Tetteh', 'Appiah', 'Addo', 'Amoah', 'Agyemang', 'Darko', 'Ofori', 'Acheampong', 'Sarpong', 'Yeboah', 'Baidoo', 'Essien', 'Nartey', 'Kumi', 'Adjei', 'Frimpong', 'Opoku'] },
  af: { first: ['Emeka', 'Chidi', 'Tunde', 'Segun', 'Ibrahim', 'Musa', 'Seydou', 'Moussa', 'Amadou', 'Cheikh', 'Idrissa', 'Yacine'], last: ['Okoye', 'Adeyemi', 'Balogun', 'Nwosu', 'Diarra', 'Traore', 'Keita', 'Sow', 'Diallo', 'Camara', 'Kone', 'Toure'] },
  na: { first: ['Youssef', 'Amine', 'Karim', 'Hakim', 'Nabil', 'Samir', 'Rayan', 'Walid', 'Bilal', 'Omar', 'Idriss', 'Tarek'], last: ['Benali', 'Haddad', 'Mansouri', 'Zerrouki', 'Saidi', 'Bouazza', 'Khelifi', 'Amrani', 'Cherif', 'Brahimi', 'Ziani', 'Fassi'] },
  la: { first: ['Mateo', 'Joaquin', 'Thiago', 'Rafael', 'Diego', 'Bruno', 'Gabriel', 'Lucas', 'Santiago', 'Nicolas', 'Andres', 'Felipe', 'Caio', 'Renan', 'Tomas', 'Emilio', 'Pablo', 'Alvaro', 'Sergio', 'Ivan'], last: ['Duarte', 'Ferreira', 'Salvatierra', 'Cardoso', 'Montalvo', 'Rezende', 'Barros', 'Ibarra', 'Quintero', 'Lacerda', 'Pereyra', 'Valdez', 'Menezes', 'Arriaga', 'Camargo', 'Sandoval', 'Morales', 'Herrera', 'Castillo', 'Navarro'] },
  eu: { first: ['Lucien', 'Hugo', 'Matteo', 'Luca', 'Stefan', 'Jonas', 'Anders', 'Milan', 'Pieter', 'Marek', 'Elias', 'Antoine', 'Finn', 'Dario', 'Viktor', 'Leon', 'Marco', 'Paul', 'Felix', 'Julien'], last: ['Duclos', 'Marchetti', 'Brandvold', 'Kessler', 'Lindqvist', 'Novak', 'Vermeer', 'Rossetti', 'Baumann', 'Lefevre', 'Halvorsen', 'Petrov', 'Moretti', 'Aubert', 'Kovac', 'Strand', 'Wagner', 'Moreau', 'Bianchi', 'Hartmann'] },
  uk: { first: ['Callum', 'Jamie', 'Ryan', 'Connor', 'Owen', 'Harvey', 'Liam', 'Ellis', 'Declan', 'Marcus', 'Reece', 'Jordan', 'Tom', 'Josh', 'Harry'], last: ['Whitlock', 'Harrow', 'Pemberton', 'Ashworth', 'Garside', 'Thorne', 'Radcliffe', 'Hollis', 'Fenwick', 'Tolliver', 'Brannigan', 'Calloway', 'Marsh', 'Doyle', 'Barker'] },
  as: { first: ['Haruto', 'Kenji', 'Daiki', 'Min-jun', 'Joon', 'Seung', 'Takumi', 'Ren', 'Hyun', 'Sota', 'Tae', 'Yuto'], last: ['Takeshiro', 'Hayashida', 'Morikawa', 'Kang', 'Baek', 'Shinoda', 'Yoon', 'Katsuragi', 'Han', 'Okazaki', 'Seo', 'Fujimoto'] },
};
/* nation -> [flag, name region] */
HFC.NAT = {
  'Ghana': ['🇬🇭', 'wa'], 'Nigeria': ['🇳🇬', 'af'], 'Senegal': ['🇸🇳', 'af'], 'Ivory Coast': ['🇨🇮', 'af'], 'Mali': ['🇲🇱', 'af'], 'Cameroon': ['🇨🇲', 'af'], 'DR Congo': ['🇨🇩', 'af'], 'Guinea': ['🇬🇳', 'af'], 'Gambia': ['🇬🇲', 'af'], 'Gabon': ['🇬🇦', 'af'], 'Burundi': ['🇧🇮', 'af'], 'Zambia': ['🇿🇲', 'af'], 'South Africa': ['🇿🇦', 'af'], 'Guinea-Bissau': ['🇬🇼', 'af'], 'Congo': ['🇨🇬', 'af'],
  'Morocco': ['🇲🇦', 'na'], 'Algeria': ['🇩🇿', 'na'], 'Egypt': ['🇪🇬', 'na'], 'Tunisia': ['🇹🇳', 'na'],
  'Brazil': ['🇧🇷', 'la'], 'Argentina': ['🇦🇷', 'la'], 'Colombia': ['🇨🇴', 'la'], 'Uruguay': ['🇺🇾', 'la'], 'Ecuador': ['🇪🇨', 'la'], 'Chile': ['🇨🇱', 'la'], 'Spain': ['🇪🇸', 'la'], 'Portugal': ['🇵🇹', 'la'], 'Mexico': ['🇲🇽', 'la'], 'Jamaica': ['🇯🇲', 'la'],
  'France': ['🇫🇷', 'eu'], 'Germany': ['🇩🇪', 'eu'], 'Italy': ['🇮🇹', 'eu'], 'Netherlands': ['🇳🇱', 'eu'], 'Norway': ['🇳🇴', 'eu'], 'Sweden': ['🇸🇪', 'eu'], 'Denmark': ['🇩🇰', 'eu'], 'Croatia': ['🇭🇷', 'eu'], 'Poland': ['🇵🇱', 'eu'], 'Belgium': ['🇧🇪', 'eu'], 'Switzerland': ['🇨🇭', 'eu'], 'Austria': ['🇦🇹', 'eu'], 'Hungary': ['🇭🇺', 'eu'], 'Czechia': ['🇨🇿', 'eu'], 'Slovenia': ['🇸🇮', 'eu'], 'Slovakia': ['🇸🇰', 'eu'], 'Serbia': ['🇷🇸', 'eu'], 'Kosovo': ['🇽🇰', 'eu'], 'Albania': ['🇦🇱', 'eu'], 'Bosnia': ['🇧🇦', 'eu'], 'Greece': ['🇬🇷', 'eu'], 'Turkey': ['🇹🇷', 'eu'], 'Ukraine': ['🇺🇦', 'eu'], 'Georgia': ['🇬🇪', 'eu'], 'Armenia': ['🇦🇲', 'eu'], 'Iceland': ['🇮🇸', 'eu'], 'Russia': ['🇷🇺', 'eu'], 'Montenegro': ['🇲🇪', 'eu'], 'Luxembourg': ['🇱🇺', 'eu'], 'Ireland': ['🇮🇪', 'uk'],
  'England': ['🇬🇧', 'uk'], 'Scotland': ['🇬🇧', 'uk'], 'Wales': ['🇬🇧', 'uk'], 'Northern Ireland': ['🇬🇧', 'uk'],
  'Japan': ['🇯🇵', 'as'], 'South Korea': ['🇰🇷', 'as'], 'USA': ['🇺🇸', 'uk'], 'Canada': ['🇨🇦', 'uk'], 'Australia': ['🇦🇺', 'uk'], 'New Zealand': ['🇳🇿', 'uk'],
};
HFC.flagOf = function (nat) { return (HFC.NAT[nat] || ['🏳️'])[0]; };

/* ---- leagues ---- */
/* id, name, flag, home nation (for invented players), TV money index, domestic mix */
HFC.LEAGUES = [
  { id: 'epl', name: 'Premier League', flag: '🏴', nat: 'England', tv: 1.5, fillQ: 0 },
  { id: 'lal', name: 'La Liga', flag: '🇪🇸', nat: 'Spain', tv: 1.0, fillQ: -1 },
  { id: 'sa', name: 'Serie A', flag: '🇮🇹', nat: 'Italy', tv: 0.9, fillQ: -1 },
  { id: 'bun', name: 'Bundesliga', flag: '🇩🇪', nat: 'Germany', tv: 0.9, fillQ: -1 },
  { id: 'l1', name: 'Ligue 1', flag: '🇫🇷', nat: 'France', tv: 0.6, fillQ: -2 },
];

/* ---- clubs: name | league | colour | reputation 1-100 | stadium capacity (thousands) ---- */
HFC.CLUB_ROWS = [
  /* Premier League */
  'Manchester City|epl|#6cabdd|96|53', 'Arsenal|epl|#d62828|94|60', 'Liverpool|epl|#c8102e|94|61', 'Chelsea|epl|#1b4fb5|90|40', 'Manchester United|epl|#da291c|90|74',
  'Tottenham Hotspur|epl|#1c2a4a|86|62', 'Newcastle United|epl|#2b2b2b|84|52', 'Aston Villa|epl|#7a2a4f|82|42', 'Brighton|epl|#0057b8|75|31', 'West Ham United|epl|#7a263a|76|62',
  'Crystal Palace|epl|#1b458f|74|25', 'Everton|epl|#003399|74|52', 'Nottingham Forest|epl|#dd0000|73|30', 'Fulham|epl|#d9d9d9|71|29', 'Wolverhampton Wanderers|epl|#fdb913|68|31',
  'Bournemouth|epl|#c8102e|70|11', 'Brentford|epl|#e30613|70|17', 'Leeds United|epl|#f2c800|68|37', 'Burnley|epl|#6c1d45|62|22', 'Sunderland|epl|#eb172b|64|49',
  /* La Liga */
  'Real Madrid|lal|#f2f2f2|98|81', 'Barcelona|lal|#a50044|96|99', 'Atletico Madrid|lal|#c8102e|88|70', 'Athletic Club|lal|#d6001c|78|53', 'Real Sociedad|lal|#0067b1|77|39',
  'Villarreal|lal|#f9d100|76|23', 'Real Betis|lal|#0bb363|75|60', 'Sevilla|lal|#d3203a|73|43', 'Valencia|lal|#f58220|71|49', 'Girona|lal|#e8392d|66|14',
  'Celta Vigo|lal|#8fc7ec|65|29', 'Osasuna|lal|#d91a21|63|23', 'Getafe|lal|#005999|62|17', 'Rayo Vallecano|lal|#e6e6e6|61|15', 'Mallorca|lal|#c8102e|62|24',
  'Alaves|lal|#005baa|58|20', 'Espanyol|lal|#0f6ab4|58|40', 'Elche|lal|#00873e|54|31', 'Levante|lal|#9d1c2c|54|26', 'Real Oviedo|lal|#2c5ba3|52|30',
  /* Serie A */
  'Inter|sa|#0a3d8f|91|75', 'Juventus|sa|#e8e8e8|89|41', 'AC Milan|sa|#c8102e|88|75', 'Napoli|sa|#1e8fd1|87|54', 'Atalanta|sa|#1d4e9e|82|25',
  'Roma|sa|#8e1f2f|80|70', 'Lazio|sa|#87ceeb|77|70', 'Fiorentina|sa|#5b2a86|73|43', 'Bologna|sa|#a32e3a|72|39', 'Torino|sa|#8b1d1d|66|28',
  'Udinese|sa|#5a5a5a|60|25', 'Genoa|sa|#a31f34|60|36', 'Como|sa|#1c5fb4|60|13', 'Parma|sa|#f0c800|57|27', 'Cagliari|sa|#a2161a|54|16',
  'Lecce|sa|#e8a400|52|31', 'Hellas Verona|sa|#1f3b73|52|39', 'Cremonese|sa|#a8202a|48|16', 'Pisa|sa|#1a1a1a|47|10', 'Sassuolo|sa|#1b8a3b|56|21',
  /* Bundesliga */
  'Bayern Munich|bun|#dc052d|97|75', 'Bayer Leverkusen|bun|#e32219|87|30', 'Borussia Dortmund|bun|#fde100|86|81', 'RB Leipzig|bun|#d6142c|83|47', 'Stuttgart|bun|#e32219|76|60',
  'Eintracht Frankfurt|bun|#d3202a|75|51', 'Freiburg|bun|#d10a11|68|34', 'Hoffenheim|bun|#1961b5|67|30', 'Werder Bremen|bun|#1d9053|64|42', 'Wolfsburg|bun|#65b32e|65|30',
  'Mainz|bun|#c3141e|61|33', 'Borussia Monchengladbach|bun|#2a2a2a|64|54', 'Augsburg|bun|#ba3733|58|30', 'Union Berlin|bun|#eb1923|62|22', 'St Pauli|bun|#6b3a24|55|30',
  'Hamburg|bun|#005ca9|58|57', 'Heidenheim|bun|#e2001a|52|15', 'FC Koln|bun|#ed1c24|57|50',
  /* Ligue 1 */
  'Paris Saint-Germain|l1|#004170|95|48', 'Marseille|l1|#2faee0|80|67', 'Monaco|l1|#e8112d|78|18', 'Lille|l1|#d9202a|74|50', 'Lyon|l1|#1b3f94|76|59',
  'Lens|l1|#e8c000|68|38', 'Rennes|l1|#c8102e|68|29', 'Nice|l1|#c8102e|66|36', 'Strasbourg|l1|#009fe3|62|26', 'Toulouse|l1|#6d2c91|56|33',
  'Brest|l1|#d9202a|54|15', 'Nantes|l1|#f7d10a|56|35', 'Le Havre|l1|#5aa0d8|46|25', 'Auxerre|l1|#1a62b0|47|18', 'Angers|l1|#222222|46|18',
  'Lorient|l1|#f58220|47|18', 'Metz|l1|#7a1f3d|46|30', 'Paris FC|l1|#1e3a8a|48|20',
];

/* ---- real players: name|POS|OVR|AGE|NATION[|POTENTIAL] ---- */
HFC.REAL = {
  'Arsenal': 'David Raya|GK|87|29|Spain;William Saliba|CB|89|24|France|91;Gabriel Magalhaes|CB|87|27|Brazil;Ben White|RB|82|28|England;Jurrien Timber|RB|83|24|Netherlands|86;Riccardo Calafiori|LB|82|23|Italy|88;Declan Rice|CM|89|26|England;Martin Odegaard|CAM|88|26|Norway;Martin Zubimendi|CDM|85|26|Spain;Bukayo Saka|RW|89|24|England|93;Gabriel Martinelli|LW|83|24|Brazil;Viktor Gyokeres|ST|86|27|Sweden;Kai Havertz|ST|83|26|Germany;Eberechi Eze|CAM|84|27|England;Noni Madueke|RW|80|23|England|85;Myles Lewis-Skelly|LB|77|19|England|89',
  'Manchester City': 'Gianluigi Donnarumma|GK|89|26|Italy;Josko Gvardiol|CB|86|23|Croatia|89;Ruben Dias|CB|87|28|Portugal;Rayan Ait-Nouri|LB|82|24|Algeria;Matheus Nunes|RB|80|27|Portugal;Rodri|CDM|91|29|Spain;Tijjani Reijnders|CM|83|27|Netherlands;Bernardo Silva|CM|87|31|Portugal;Phil Foden|CAM|86|25|England|90;Rayan Cherki|CAM|83|22|France|89;Erling Haaland|ST|92|25|Norway|94;Antoine Semenyo|RW|83|26|Ghana;Jeremy Doku|LW|83|23|Belgium|87;Savinho|RW|81|21|Brazil|88;Omar Marmoush|RW|84|26|Egypt;Mateo Kovacic|CM|82|31|Croatia',
  'Liverpool': 'Alisson|GK|89|33|Brazil;Virgil van Dijk|CB|89|34|Netherlands;Ibrahima Konate|CB|85|26|France;Jeremie Frimpong|RB|82|24|Netherlands;Conor Bradley|RB|81|22|Northern Ireland|86;Milos Kerkez|LB|81|22|Hungary|86;Alexis Mac Allister|CM|86|26|Argentina;Ryan Gravenberch|CM|86|23|Netherlands|89;Dominik Szoboszlai|CAM|85|25|Hungary;Florian Wirtz|CAM|86|22|Germany|93;Mohamed Salah|RW|90|33|Egypt;Cody Gakpo|LW|84|26|Netherlands;Hugo Ekitike|ST|83|23|France|89;Alexander Isak|ST|87|26|Sweden',
  'Chelsea': 'Robert Sanchez|GK|80|27|Spain;Levi Colwill|CB|82|22|England|87;Wesley Fofana|CB|80|25|France;Reece James|RB|84|25|England;Malo Gusto|RB|80|22|France|85;Marc Cucurella|LB|82|27|Spain;Moises Caicedo|CDM|86|24|Ecuador|90;Enzo Fernandez|CM|85|24|Argentina|90;Cole Palmer|CAM|88|23|England|93;Pedro Neto|RW|82|25|Portugal;Jamie Gittens|LW|80|21|England|86;Alejandro Garnacho|LW|80|21|Argentina|87;Joao Pedro|ST|83|24|Brazil|87;Liam Delap|ST|79|22|England|86;Estevao|RW|81|18|Brazil|92',
  'Manchester United': 'Senne Lammens|GK|78|23|Belgium|84;Lisandro Martinez|CB|83|27|Argentina;Matthijs de Ligt|CB|83|26|Netherlands;Harry Maguire|CB|80|32|England;Diogo Dalot|RB|81|26|Portugal;Luke Shaw|LB|80|30|England;Casemiro|CDM|82|33|Brazil;Manuel Ugarte|CDM|80|24|Uruguay;Kobbie Mainoo|CM|80|20|England|88;Bruno Fernandes|CAM|88|31|Portugal;Matheus Cunha|CAM|84|26|Brazil;Amad Diallo|RW|82|23|Ivory Coast|86;Bryan Mbeumo|RW|84|26|Cameroon;Benjamin Sesko|ST|83|22|Slovenia|89',
  'Tottenham Hotspur': 'Guglielmo Vicario|GK|83|29|Italy;Cristian Romero|CB|86|27|Argentina;Micky van de Ven|CB|85|24|Netherlands|88;Pedro Porro|RB|83|26|Spain;Destiny Udogie|LB|80|23|Italy|85;Joao Palhinha|CDM|82|30|Portugal;Rodrigo Bentancur|CM|81|28|Uruguay;James Maddison|CAM|83|29|England;Xavi Simons|CAM|83|22|Netherlands|90;Mohammed Kudus|RW|83|25|Ghana|86;Dejan Kulusevski|RM|82|25|Sweden;Dominic Solanke|ST|81|28|England;Mathys Tel|LW|79|20|France|88;Richarlison|ST|78|28|Brazil',
  'Newcastle United': 'Nick Pope|GK|79|33|England;Sven Botman|CB|82|25|Netherlands;Dan Burn|CB|79|33|England;Kieran Trippier|RB|80|35|England;Lewis Hall|LB|79|21|England|85;Bruno Guimaraes|CM|87|28|Brazil;Sandro Tonali|CM|85|25|Italy;Joelinton|CM|83|29|Brazil;Anthony Gordon|LW|84|24|England;Harvey Barnes|LW|80|27|England;Anthony Elanga|RW|79|23|Sweden;Nick Woltemade|ST|82|23|Germany|88;Yoane Wissa|ST|80|28|DR Congo',
  'Aston Villa': 'Emiliano Martinez|GK|86|33|Argentina;Ezri Konsa|CB|82|28|England;Pau Torres|CB|82|28|Spain;Matty Cash|RB|80|28|Poland;Lucas Digne|LB|79|32|France;Youri Tielemans|CM|83|28|Belgium;Boubacar Kamara|CDM|84|26|France;John McGinn|CM|80|31|Scotland;Morgan Rogers|CAM|84|23|England|88;Emi Buendia|CAM|80|28|Argentina;Leon Bailey|RW|78|28|Jamaica;Donyell Malen|RW|81|26|Netherlands;Ollie Watkins|ST|83|29|England',
  'Brighton': 'Bart Verbruggen|GK|80|22|Netherlands|86;Lewis Dunk|CB|79|34|England;Jan Paul van Hecke|CB|80|25|Netherlands;Kaoru Mitoma|LW|80|28|Japan;Yankuba Minteh|RW|79|21|Gambia|85;Georginio Rutter|CAM|79|23|France|85;Carlos Baleba|CM|79|21|Cameroon|86;Brajan Gruda|CAM|77|21|Germany|84;Danny Welbeck|ST|76|34|England',
  'West Ham United': 'Mads Hermansen|GK|78|25|Denmark;Max Kilman|CB|79|28|England;Konstantinos Mavropanos|CB|78|28|Greece;Jarrod Bowen|RW|82|28|England;Lucas Paqueta|CAM|82|28|Brazil;Tomas Soucek|CM|79|30|Czechia;Crysencio Summerville|LW|78|23|Netherlands|83;Callum Wilson|ST|76|33|England',
  'Crystal Palace': 'Dean Henderson|GK|82|28|England;Marc Guehi|CB|84|25|England|87;Maxence Lacroix|CB|81|25|France;Daniel Munoz|RB|80|29|Colombia;Adam Wharton|CM|82|21|England|90;Ismaila Sarr|RW|82|27|Senegal;Yeremy Pino|LW|80|23|Spain|85;Jean-Philippe Mateta|ST|82|28|France',
  'Everton': 'Jordan Pickford|GK|83|31|England;Jarrad Branthwaite|CB|82|23|England|87;James Tarkowski|CB|80|33|England;Idrissa Gueye|CM|77|36|Senegal;Kiernan Dewsbury-Hall|CM|79|26|England;Jack Grealish|RW|80|30|England;Iliman Ndiaye|RW|80|25|Senegal;Dwight McNeil|LW|78|26|England;Beto|ST|77|27|Guinea-Bissau',
  'Nottingham Forest': 'Matz Sels|GK|80|33|Belgium;Murillo|CB|82|23|Brazil|87;Nikola Milenkovic|CB|80|28|Serbia;Ibrahim Sangare|CM|80|27|Ivory Coast;Elliot Anderson|CM|81|23|England|86;Morgan Gibbs-White|CAM|83|26|England;Callum Hudson-Odoi|LW|79|24|England;Chris Wood|ST|79|33|New Zealand',
  'Fulham': 'Bernd Leno|GK|82|33|Germany;Joachim Andersen|CB|80|29|Denmark;Antonee Robinson|LB|80|28|USA;Sander Berge|CDM|77|27|Norway;Andreas Pereira|CM|77|29|Brazil;Emile Smith Rowe|CAM|78|25|England;Alex Iwobi|RW|78|29|Nigeria;Harry Wilson|RW|77|28|Wales;Raul Jimenez|ST|76|34|Mexico',
  'Wolverhampton Wanderers': 'Jose Sa|GK|78|32|Portugal;Joao Gomes|CDM|79|24|Brazil|84;Rodrigo Gomes|RW|76|22|Portugal|82;Hwang Hee-chan|LW|76|29|South Korea;Jorgen Strand Larsen|ST|79|25|Norway',
  'Bournemouth': 'Djordje Petrovic|GK|79|26|Serbia;Marcos Senesi|CB|78|28|Argentina;Alex Scott|CM|77|22|England|84;Ryan Christie|CM|76|30|Scotland;Justin Kluivert|CAM|79|26|Netherlands;Evanilson|ST|78|26|Brazil',
  'Brentford': 'Caoimhin Kelleher|GK|80|27|Ireland;Nathan Collins|CB|78|25|Ireland;Mathias Jensen|CM|77|29|Denmark;Yegor Yarmolyuk|CM|75|21|Ukraine|82;Mikkel Damsgaard|CAM|78|25|Denmark;Kevin Schade|ST|77|24|Germany;Igor Thiago|ST|79|24|Brazil',
  'Leeds United': 'Lucas Perri|GK|76|28|Brazil;Anton Stach|CM|77|27|Germany;Ao Tanaka|CM|76|27|Japan;Brenden Aaronson|CM|74|25|USA;Noah Okafor|LW|77|25|Switzerland;Daniel James|RW|75|28|Wales;Dominic Calvert-Lewin|ST|77|28|England',
  'Burnley': 'Martin Dubravka|GK|76|36|Slovakia;Lesley Ugochukwu|CM|74|21|France|82;Hannibal Mejbri|CAM|72|22|Tunisia|78;Lyle Foster|ST|72|25|South Africa',
  'Sunderland': 'Robin Roefs|GK|76|22|Netherlands|83;Nordi Mukiele|CB|76|28|France;Granit Xhaka|CM|82|33|Switzerland;Habib Diarra|CM|75|21|Senegal|82;Enzo Le Fee|CAM|76|25|France;Chemsdine Talbi|RW|74|20|Morocco|81;Brian Brobbey|ST|77|23|Netherlands|83',

  'Real Madrid': 'Thibaut Courtois|GK|89|33|Belgium;Dean Huijsen|CB|80|20|Spain|90;Antonio Rudiger|CB|85|32|Germany;Eder Militao|CB|84|27|Brazil;Trent Alexander-Arnold|RB|85|27|England;Alvaro Carreras|LB|80|22|Spain|86;Ferland Mendy|LB|80|30|France;Aurelien Tchouameni|CDM|85|26|France|88;Federico Valverde|CM|88|27|Uruguay;Eduardo Camavinga|CM|83|23|France|88;Jude Bellingham|CAM|90|22|England|95;Arda Guler|CAM|83|20|Turkey|92;Franco Mastantuono|RW|79|18|Argentina|93;Vinicius Junior|LW|90|25|Brazil|93;Rodrygo|RW|84|25|Brazil;Kylian Mbappe|ST|92|26|France|94;Endrick|ST|79|19|Brazil|92',
  'Barcelona': 'Joan Garcia|GK|80|24|Spain|86;Marc-Andre ter Stegen|GK|85|33|Germany;Ronald Araujo|CB|85|26|Uruguay;Pau Cubarsi|CB|84|18|Spain|94;Eric Garcia|CB|79|24|Spain;Jules Kounde|RB|85|27|France;Alejandro Balde|LB|82|22|Spain|88;Pedri|CM|88|22|Spain|93;Frenkie de Jong|CM|86|28|Netherlands;Gavi|CM|82|21|Spain|90;Dani Olmo|CAM|84|27|Spain;Raphinha|RW|88|29|Brazil;Lamine Yamal|RW|90|18|Spain|98;Marcus Rashford|LW|82|28|England;Robert Lewandowski|ST|86|37|Poland;Ferran Torres|ST|80|25|Spain',
  'Atletico Madrid': 'Jan Oblak|GK|87|33|Slovenia;Jose Maria Gimenez|CB|83|30|Uruguay;Robin Le Normand|CB|82|29|Spain;Marcos Llorente|RB|82|31|Spain;Koke|CM|80|34|Spain;Pablo Barrios|CM|82|22|Spain|88;Rodrigo De Paul|CM|82|31|Argentina;Johnny Cardoso|CDM|79|24|USA;Conor Gallagher|CM|80|25|England;Antoine Griezmann|CAM|86|34|France;Giuliano Simeone|RW|77|23|Argentina|82;Julian Alvarez|ST|87|25|Argentina|90;Alexander Sorloth|ST|80|30|Norway',
  'Athletic Club': 'Unai Simon|GK|84|28|Spain;Dani Vivian|CB|81|26|Spain;Aymeric Laporte|CB|82|31|Spain;Mikel Jauregizar|CM|79|22|Spain|85;Oihan Sancet|CAM|82|25|Spain;Nico Williams|LW|85|23|Spain|90;Alex Berenguer|RW|79|30|Spain;Inaki Williams|ST|78|31|Ghana',
  'Real Sociedad': 'Alex Remiro|GK|80|30|Spain;Sergio Gomez|LB|77|25|Spain;Luka Sucic|CM|77|23|Croatia|83;Brais Mendez|CAM|80|28|Spain;Takefusa Kubo|RW|83|24|Japan|87;Mikel Oyarzabal|ST|84|28|Spain;Orri Oskarsson|ST|77|21|Iceland|84',
  'Villarreal': 'Luiz Junior|GK|76|25|Brazil;Juan Foyth|CB|78|27|Argentina;Santi Comesana|CM|78|29|Spain;Alberto Moleiro|CAM|80|22|Spain|87;Tajon Buchanan|RW|76|26|Canada;Georges Mikautadze|ST|80|25|Georgia;Gerard Moreno|ST|79|33|Spain',
  'Real Betis': 'Alvaro Valles|GK|77|28|Spain;Marc Bartra|CB|77|34|Spain;Giovani Lo Celso|CM|79|29|Argentina;Pablo Fornals|CM|77|29|Spain;Isco|CAM|80|33|Spain;Antony|RW|80|25|Brazil;Abde Ezzalzouli|LW|79|24|Morocco|84;Cucho Hernandez|ST|78|26|Colombia',
  'Sevilla': 'Odysseas Vlachodimos|GK|76|31|Greece;Jose Angel Carmona|RB|76|23|Spain|80;Lucien Agoume|CM|74|23|France|79;Djibril Sow|CM|76|28|Switzerland;Alexis Sanchez|ST|76|36|Chile;Akor Adams|ST|76|25|Nigeria;Isaac Romero|ST|74|25|Spain',
  'Valencia': 'Javi Guerra|CM|76|22|Spain|83;Diego Lopez|RW|76|23|Spain|82;Hugo Duro|ST|77|25|Spain;Umar Sadiq|ST|75|28|Nigeria',
  'Girona': 'Paulo Gazzaniga|GK|74|33|Argentina;Azzedine Ounahi|CM|76|25|Morocco;Viktor Tsygankov|RW|77|28|Ukraine;Arnaut Danjuma|LW|76|28|Netherlands',
  'Celta Vigo': 'Ivan Villar|GK|76|28|Spain;Iago Aspas|CAM|79|38|Spain;Williot Swedberg|RW|75|21|Sweden|80;Borja Iglesias|ST|77|32|Spain',
  'Osasuna': 'Sergio Herrera|GK|75|32|Spain;Aimar Oroz|CM|76|24|Spain|80;Ante Budimir|ST|77|34|Croatia',
  'Getafe': 'David Soria|GK|76|32|Spain;Mauro Arambarri|CM|77|30|Uruguay;Borja Mayoral|ST|77|28|Spain;Christantus Uche|ST|74|22|Nigeria|79',
  'Rayo Vallecano': 'Augusto Batalla|GK|75|29|Argentina;Isi Palazon|RW|76|31|Spain;Alvaro Garcia|LW|76|33|Spain;Jorge de Frutos|RW|74|28|Spain',
  'Mallorca': 'Dominik Greif|GK|75|28|Slovakia;Samu Costa|CM|77|25|Portugal;Pablo Torre|CAM|75|22|Spain|80;Vedat Muriqi|ST|78|31|Kosovo',
  'Alaves': 'Antonio Sivera|GK|75|29|Spain;Abdel Abqar|CB|74|26|Morocco;Carlos Vicente|RW|74|26|Spain;Toni Martinez|ST|73|28|Spain',
  'Espanyol': 'Marko Dmitrovic|GK|74|34|Serbia;Pol Lozano|CM|72|25|Spain;Javi Puado|ST|76|27|Spain;Roberto Fernandez|ST|73|23|Spain',
  'Elche': 'Matias Dituro|GK|72|38|Argentina;Rafa Mir|ST|74|28|Spain',
  'Levante': 'Karl Hein|GK|73|24|Estonia;Roger Brugue|LW|74|29|Spain;Etta Eyong|ST|73|22|Cameroon|78',
  'Real Oviedo': 'Dani Calvo|CB|72|32|Spain;Federico Vinas|ST|74|27|Uruguay',

  'Inter': 'Yann Sommer|GK|83|37|Switzerland;Alessandro Bastoni|CB|87|26|Italy;Manuel Akanji|CB|83|30|Switzerland;Francesco Acerbi|CB|80|37|Italy;Benjamin Pavard|CB|82|29|France;Denzel Dumfries|RB|82|29|Netherlands;Federico Dimarco|LB|85|28|Italy;Carlos Augusto|LB|79|26|Brazil;Nicolo Barella|CM|87|28|Italy;Hakan Calhanoglu|CDM|86|32|Turkey;Piotr Zielinski|CM|82|31|Poland;Henrikh Mkhitaryan|CM|81|36|Armenia;Petar Sucic|CM|77|22|Croatia|84;Lautaro Martinez|ST|89|28|Argentina;Marcus Thuram|ST|85|28|France;Ange-Yoan Bonny|ST|76|22|France|82',
  'Juventus': 'Michele Di Gregorio|GK|80|28|Italy;Gleison Bremer|CB|85|28|Brazil;Pierre Kalulu|CB|80|25|France;Federico Gatti|CB|78|27|Italy;Andrea Cambiaso|LB|80|25|Italy|84;Manuel Locatelli|CDM|82|28|Italy;Khephren Thuram|CM|82|24|France|86;Teun Koopmeiners|CM|82|27|Netherlands;Weston McKennie|CM|79|27|USA;Kenan Yildiz|LW|85|20|Turkey|95;Francisco Conceicao|RW|81|22|Portugal|87;Dusan Vlahovic|ST|82|26|Serbia;Jonathan David|ST|82|26|Canada;Lois Openda|ST|79|25|Belgium',
  'AC Milan': 'Mike Maignan|GK|87|30|France;Strahinja Pavlovic|CB|81|24|Serbia|85;Fikayo Tomori|CB|82|28|England;Matteo Gabbia|CB|78|26|Italy;Luka Modric|CM|82|40|Croatia;Adrien Rabiot|CM|84|30|France;Youssouf Fofana|CM|80|26|France;Ardon Jashari|CM|78|23|Switzerland|84;Samuele Ricci|CM|77|24|Italy|82;Christian Pulisic|RW|84|27|USA;Rafael Leao|LW|86|26|Portugal;Christopher Nkunku|LW|82|28|France;Alexis Saelemaekers|RW|78|26|Belgium;Santiago Gimenez|ST|80|24|Mexico|85',
  'Napoli': 'Alex Meret|GK|81|28|Italy;Amir Rrahmani|CB|81|31|Kosovo;Alessandro Buongiorno|CB|82|26|Italy|85;Sam Beukema|CB|77|27|Netherlands;Giovanni Di Lorenzo|RB|82|32|Italy;Stanislav Lobotka|CM|83|31|Slovakia;Scott McTominay|CM|85|29|Scotland;Frank Anguissa|CM|82|29|Cameroon;Kevin De Bruyne|CAM|87|34|Belgium;David Neres|RW|81|29|Brazil;Matteo Politano|RW|79|32|Italy;Noa Lang|LW|79|26|Netherlands;Romelu Lukaku|ST|81|32|Belgium;Rasmus Hojlund|ST|78|22|Denmark|85',
  'Atalanta': 'Marco Carnesecchi|GK|80|25|Italy|85;Isak Hien|CB|79|27|Sweden;Berat Djimsiti|CB|79|32|Albania;Raoul Bellanova|RB|78|25|Italy;Ederson|CM|82|26|Brazil;Marten de Roon|CM|78|34|Netherlands;Mario Pasalic|CAM|79|30|Croatia;Lazar Samardzic|CM|77|24|Serbia|83;Charles De Ketelaere|CAM|82|24|Belgium|86;Ademola Lookman|LW|84|28|Nigeria;Gianluca Scamacca|ST|80|26|Italy;Nikola Krstovic|ST|77|25|Montenegro',
  'Roma': 'Mile Svilar|GK|83|26|Serbia;Gianluca Mancini|CB|80|29|Italy;Evan Ndicka|CB|80|26|Ivory Coast;Angelino|LB|78|28|Spain;Bryan Cristante|CM|79|30|Italy;Manu Kone|CM|80|24|France|85;Lorenzo Pellegrini|CAM|80|29|Italy;Paulo Dybala|CAM|83|32|Argentina;Matias Soule|RW|80|22|Argentina|86;Artem Dovbyk|ST|79|28|Ukraine',
  'Lazio': 'Ivan Provedel|GK|79|31|Italy;Mario Gila|CB|79|25|Spain|83;Nuno Tavares|LB|77|25|Portugal;Nicolo Rovella|CM|80|24|Italy|84;Matteo Guendouzi|CM|80|26|France;Mattia Zaccagni|LW|80|30|Italy;Gustav Isaksen|RW|78|24|Denmark;Valentin Castellanos|ST|80|27|Argentina',
  'Fiorentina': 'David de Gea|GK|80|35|Spain;Pietro Comuzzo|CB|75|20|Italy|84;Dodo|RB|77|27|Brazil;Robin Gosens|LB|79|31|Germany;Rolando Mandragora|CM|79|28|Italy;Nicolo Fagioli|CM|76|24|Italy;Albert Gudmundsson|CAM|80|28|Iceland;Moise Kean|ST|82|26|Italy',
  'Bologna': 'Lukasz Skorupski|GK|79|34|Poland;Lewis Ferguson|CM|80|26|Scotland;Remo Freuler|CM|79|33|Switzerland;Riccardo Orsolini|RW|80|28|Italy;Jonathan Rowe|RW|77|22|England|82;Santiago Castro|ST|77|21|Argentina|84',
  'Torino': 'Vanja Milinkovic-Savic|GK|80|28|Serbia;Ardian Ismajli|CB|75|29|Albania;Cesare Casadei|CM|74|22|Italy|80;Che Adams|ST|77|29|Scotland;Duvan Zapata|ST|77|34|Colombia',
  'Udinese': 'Maduka Okoye|GK|76|26|Nigeria;Kingsley Ehizibue|RB|74|30|Nigeria;Jesper Karlstrom|CM|76|30|Sweden;Lorenzo Lucca|ST|76|25|Italy;Keinan Davis|ST|74|27|England',
  'Genoa': 'Nicola Leali|GK|74|32|Italy;Aaron Martin|LB|75|28|Spain;Morten Frendrup|CM|77|24|Denmark;Vitinha|ST|76|25|Portugal;Caleb Ekuban|ST|74|31|Ghana',
  'Como': 'Jean Butez|GK|76|30|France;Lucas Da Cunha|CM|77|24|France;Maxence Caqueret|CM|77|25|France;Nico Paz|CAM|80|21|Argentina|89;Assane Diao|RW|77|20|Spain|84;Jesus Rodriguez|RW|74|20|Spain|82;Anastasios Douvikas|ST|76|26|Greece',
  'Parma': 'Zion Suzuki|GK|76|23|Japan|82;Enrico Delprato|RB|73|26|Italy;Hernani|CM|74|34|Brazil;Adrian Bernabe|CM|75|24|Spain;Mateo Pellegrino|ST|74|24|Argentina',
  'Cagliari': 'Elia Caprile|GK|75|24|Italy|80;Yerry Mina|CB|74|31|Colombia;Gianluca Gaetano|CAM|75|25|Italy;Sebastiano Esposito|ST|74|23|Italy',
  'Lecce': 'Wladimiro Falcone|GK|75|30|Italy;Lassana Coulibaly|CM|74|24|Mali|79;Lameck Banda|RW|73|24|Zambia;Santiago Pierotti|ST|73|24|Argentina',
  'Hellas Verona': 'Lorenzo Montipo|GK|74|29|Italy;Suat Serdar|CM|74|28|Germany;Giovane|ST|73|22|Brazil|79',
  'Cremonese': 'Emil Audero|GK|74|28|Italy;Federico Bonazzoli|ST|73|28|Italy;Jamie Vardy|ST|74|38|England',
  'Pisa': 'Matteo Tramoni|CAM|73|26|France;Stefano Moreo|ST|72|32|Italy',
  'Sassuolo': 'Arijanet Muric|GK|76|27|Kosovo;Kristian Thorstvedt|CM|76|26|Norway;Domenico Berardi|RW|80|31|Italy;Armand Laurente|LW|76|26|France;Andrea Pinamonti|ST|77|26|Italy',

  'Bayern Munich': 'Manuel Neuer|GK|86|39|Germany;Jonas Urbig|GK|76|22|Germany|82;Dayot Upamecano|CB|84|27|France;Jonathan Tah|CB|85|29|Germany;Kim Min-jae|CB|83|29|South Korea;Josip Stanisic|RB|78|25|Croatia;Alphonso Davies|LB|83|25|Canada;Konrad Laimer|RB|80|28|Austria;Joshua Kimmich|CDM|88|30|Germany;Aleksandar Pavlovic|CM|82|21|Germany|90;Leon Goretzka|CM|81|30|Germany;Jamal Musiala|CAM|89|23|Germany|94;Michael Olise|RW|87|24|France|91;Luis Diaz|LW|86|29|Colombia;Serge Gnabry|RW|82|30|Germany;Lennart Karl|CAM|76|18|Germany|91;Harry Kane|ST|91|32|England',
  'Bayer Leverkusen': 'Mark Flekken|GK|79|32|Netherlands;Jarell Quansah|CB|78|22|England|84;Jeanuel Belocian|CB|76|20|France|84;Piero Hincapie|LB|82|23|Ecuador|86;Alejandro Grimaldo|LB|84|30|Spain;Exequiel Palacios|CM|82|27|Argentina;Robert Andrich|CDM|80|31|Germany;Malik Tillman|CAM|80|23|USA|85;Patrik Schick|ST|83|30|Czechia;Christian Kofane|ST|75|19|Cameroon|90',
  'Borussia Dortmund': 'Gregor Kobel|GK|86|28|Switzerland;Nico Schlotterbeck|CB|84|26|Germany;Waldemar Anton|CB|82|29|Germany;Niklas Sule|CB|80|30|Germany;Julian Ryerson|RB|79|28|Norway;Emre Can|CM|80|32|Germany;Pascal Gross|CM|79|34|Germany;Felix Nmecha|CM|80|25|Germany;Jobe Bellingham|CM|77|20|England|90;Julian Brandt|CAM|82|29|Germany;Karim Adeyemi|LW|80|24|Germany;Maximilian Beier|ST|79|23|Germany|84;Serhou Guirassy|ST|85|29|Guinea;Fabio Silva|ST|76|23|Portugal|82',
  'RB Leipzig': 'Peter Gulacsi|GK|79|35|Hungary;Castello Lukeba|CB|82|23|France|87;Willi Orban|CB|80|33|Hungary;Ridle Baku|RB|77|27|Germany;David Raum|LB|80|27|Germany;Xaver Schlager|CM|80|28|Austria;Nicolas Seiwald|CM|79|24|Austria;Assan Ouedraogo|CM|76|19|Germany|87;Christoph Baumgartner|CAM|79|26|Austria;Antonio Nusa|LW|78|20|Norway|88;Yan Diomande|RW|78|19|Ivory Coast|90',
  'Stuttgart': 'Alexander Nubel|GK|81|29|Germany;Jeff Chabot|CB|78|27|Germany;Maximilian Mittelstadt|LB|79|28|Germany;Angelo Stiller|CM|82|24|Germany|86;Chris Fuhrich|LW|77|27|Germany;Jamie Leweling|RW|77|24|Germany;Ermedin Demirovic|ST|79|27|Bosnia;Deniz Undav|ST|82|29|Germany',
  'Eintracht Frankfurt': 'Kaua Santos|GK|72|22|Brazil|79;Robin Koch|CB|79|29|Germany;Rasmus Kristensen|RB|75|28|Denmark;Ellyes Skhiri|CM|78|30|Tunisia;Hugo Larsson|CM|79|21|Sweden|86;Mario Gotze|CAM|77|33|Germany;Can Uzun|CAM|77|20|Turkey|88;Ansgar Knauff|RW|78|23|Germany|82;Jonathan Burkardt|ST|80|25|Germany|84',
  'Freiburg': 'Noah Atubolu|GK|77|23|Germany|83;Matthias Ginter|CB|77|31|Germany;Maximilian Eggestein|CM|77|29|Germany;Vincenzo Grifo|LW|80|32|Italy;Michael Gregoritsch|ST|77|31|Austria',
  'Hoffenheim': 'Oliver Baumann|GK|80|35|Germany;Tom Bischof|CM|78|20|Germany|89;Alexander Prass|CM|76|24|Austria|80;Andrej Kramaric|ST|80|34|Croatia;Fisnik Asllani|ST|74|23|Albania|80',
  'Werder Bremen': 'Mio Backhaus|GK|72|21|Germany|80;Marco Friedl|CB|76|27|Austria;Jens Stage|CM|76|28|Denmark;Romano Schmid|CAM|77|25|Austria;Justin Njinmah|ST|75|25|Germany',
  'Wolfsburg': 'Kamil Grabara|GK|77|26|Poland;Vinicius Souza|CM|75|26|Brazil;Mattias Svanberg|CM|77|26|Sweden;Patrick Wimmer|RW|76|24|Austria;Jonas Wind|ST|77|26|Denmark',
  'Mainz': 'Robin Zentner|GK|76|31|Germany;Nadiem Amiri|CM|76|29|Germany;Kaishu Sano|CM|76|24|Japan;Jae-sung Lee|CM|76|33|South Korea',
  'Borussia Monchengladbach': 'Moritz Nicolas|GK|76|28|Germany;Rocco Reitz|CM|76|23|Germany|81;Kevin Stoger|CM|75|31|Austria;Franck Honorat|RW|76|28|France;Tim Kleindienst|ST|77|30|Germany',
  'Augsburg': 'Finn Dahmen|GK|75|27|Germany;Fabian Rieder|CM|75|23|Switzerland|80;Alexis Claude-Maurice|RW|74|27|France;Phillip Tietz|ST|74|28|Germany;Mert Komur|ST|74|20|Germany|81',
  'Union Berlin': 'Frederik Ronnow|GK|77|33|Denmark;Danilho Doekhi|CB|77|27|Netherlands;Andras Schafer|CM|76|26|Hungary;Rani Khedira|CM|76|31|Germany',
  'St Pauli': 'Nikola Vasilj|GK|76|29|Bosnia;Eric Smith|CM|74|28|Sweden;Jackson Irvine|CM|74|32|Australia;Danel Sinani|CAM|73|28|Luxembourg',
  'Hamburg': 'Daniel Heuer Fernandes|GK|76|33|Germany;Nicolai Remberg|CM|73|25|Germany;Fabio Vieira|CAM|77|25|Portugal;Jean-Luc Dompe|LW|74|29|France;Robert Glatzel|ST|74|31|Germany',
  'Heidenheim': 'Kevin Muller|GK|76|34|Germany;Patrick Mainka|CB|73|30|Germany;Jan-Niklas Beste|CM|74|27|Germany;Eren Dinkci|ST|74|24|Germany|78;Marvin Pieringer|ST|73|28|Germany',
  'FC Koln': 'Marvin Schwabe|GK|74|30|Germany;Florian Kainz|CM|74|33|Austria;Luca Waldschmidt|CAM|74|29|Germany;Said El Mala|LW|73|19|Germany|87',

  'Paris Saint-Germain': 'Lucas Chevalier|GK|80|24|France|86;Matvey Safonov|GK|80|26|Russia;Marquinhos|CB|86|31|Brazil;Willian Pacho|CB|84|24|Ecuador|88;Lucas Beraldo|CB|78|22|Brazil|83;Achraf Hakimi|RB|87|27|Morocco;Nuno Mendes|LB|87|23|Portugal|90;Vitinha|CM|88|25|Portugal;Joao Neves|CM|86|21|Portugal|94;Fabian Ruiz|CM|83|29|Spain;Warren Zaire-Emery|CM|82|19|France|92;Senny Mayulu|CM|77|19|France|88;Ousmane Dembele|RW|91|28|France;Khvicha Kvaratskhelia|LW|87|25|Georgia|90;Bradley Barcola|LW|84|23|France|88;Desire Doue|RW|86|20|France|94;Goncalo Ramos|ST|82|24|Portugal|87',
  'Marseille': 'Geronimo Rulli|GK|80|33|Argentina;Leonardo Balerdi|CB|79|27|Argentina;CJ Egan-Riley|CB|75|22|England|80;Pierre-Emile Hojbjerg|CM|80|30|Denmark;Matt O\'Riley|CM|79|24|Denmark|84;Amine Harit|CAM|78|28|Morocco;Mason Greenwood|RW|82|24|England|87;Igor Paixao|LW|79|25|Brazil;Timothy Weah|RW|77|25|USA;Pierre-Emerick Aubameyang|ST|78|36|Gabon',
  'Monaco': 'Philipp Kohn|GK|76|27|Switzerland;Thilo Kehrer|CB|78|29|Germany;Eric Dier|CB|77|31|England;Wilfried Singo|RB|79|24|Ivory Coast;Denis Zakaria|CM|80|28|Switzerland;Lamine Camara|CM|79|21|Senegal|86;Maghnes Akliouche|CAM|81|23|France|87;Aleksandr Golovin|CAM|80|29|Russia;Takumi Minamino|LW|77|30|Japan;Folarin Balogun|ST|79|24|USA|83',
  'Lille': 'Berke Ozer|GK|77|25|Turkey;Aissa Mandi|CB|77|34|Algeria;Bafode Diakite|CB|78|24|France|83;Angel Gomes|CM|78|25|England;Nabil Bentaleb|CM|74|31|Algeria;Ethan Mbappe|CAM|75|19|France|83;Hamza Igamane|ST|74|23|Morocco;Olivier Giroud|ST|74|39|France',
  'Lyon': 'Remy Descamps|GK|75|29|France;Moussa Niakhate|CB|79|29|Senegal;Clinton Mata|RB|77|33|Belgium;Corentin Tolisso|CM|78|31|France;Tanner Tessmann|CM|77|24|USA|81;Orel Mangala|CM|77|27|Belgium;Pavel Sulc|RW|77|25|Czechia;Ernest Nuamah|RW|76|22|Ghana|82;Afonso Moreira|RW|74|20|Portugal|82;Alexandre Lacazette|ST|79|34|France',
  'Lens': 'Robin Risser|GK|76|22|France|82;Ruben Aguilar|RB|76|32|France;Adrien Thomasson|CM|76|32|France;Angelo Fulgini|CAM|75|29|France;Florian Sotoca|ST|76|35|France;Wesley Said|ST|74|30|France;Elye Wahi|ST|75|22|France|80',
  'Rennes': 'Brice Samba|GK|79|31|Congo;Jeremy Jacquet|CB|76|20|France|85;Mikayil Faye|CB|75|21|Senegal|81;Lorenz Assignon|RB|74|25|France;Albert Gronbaek|CM|75|24|Denmark;Ludovic Blas|CAM|77|28|France;Arnaud Kalimuendo|ST|78|23|France|83;Esteban Lepaul|ST|74|25|France',
  'Nice': 'Marcin Bulka|GK|77|26|Poland;Jonathan Clauss|RB|78|33|France;Youssouf Ndayishimiye|CB|76|27|Burundi;Morgan Sanson|CM|77|31|France;Sofiane Diop|CAM|79|25|France;Jeremie Boga|LW|77|28|Ivory Coast;Evann Guessand|ST|77|25|Ivory Coast;Terem Moffi|ST|75|26|Nigeria',
  'Strasbourg': 'Mike Penders|GK|77|20|Belgium|88;Valentin Barco|LB|76|21|Argentina|82;Andrey Santos|CM|77|21|Brazil|85;Diego Moreira|RW|73|21|Belgium|79;Emanuel Emegha|ST|78|22|Netherlands|84;Joaquin Panichelli|ST|75|23|Argentina|80',
  'Toulouse': 'Guillaume Restes|GK|76|20|France|83;Rasmus Nicolaisen|CB|75|28|Denmark;Zakaria Aboukhlal|RW|75|25|Morocco;Frank Magri|ST|74|26|Cameroon',
  'Brest': 'Marco Bizot|GK|76|34|Netherlands;Mahdi Camara|CM|75|27|France;Pierre Lees-Melou|CM|76|32|France;Ludovic Ajorque|ST|74|31|France',
  'Nantes': 'Anthony Lopes|GK|75|35|Portugal;Fabien Centonze|RB|74|29|France;Matthis Abline|LW|75|22|France|80;Mostafa Mohamed|ST|75|28|Egypt',
  'Le Havre': 'Mathieu Gorgelin|GK|72|33|France;Issa Soumare|ST|72|25|France',
  'Auxerre': 'Donovan Leon|GK|72|33|France;Hamed Traore|CAM|73|25|Ivory Coast;Gauthier Hein|LW|73|29|France;Lassine Sinayoko|ST|74|26|Mali',
  'Angers': 'Paul Bernardoni|GK|73|28|France;Pierrick Capelle|CM|72|34|France;Sidiki Cherif|ST|74|29|Guinea',
  'Lorient': 'Yvon Mvogo|GK|74|31|Switzerland;Laurent Abergel|CM|72|32|France;Bamba Dieng|ST|72|25|Senegal',
  'Metz': 'Giorgi Tsitaishvili|CAM|72|25|Georgia;Cheikh Sabaly|RW|71|31|Senegal',
  'Paris FC': 'Kevin Trapp|GK|76|35|Germany;Moses Simon|LW|74|30|Nigeria;Jonathan Ikone|LW|73|27|France;Willem Geubbels|ST|72|24|France|78',
};

/* real stars with no club in the five big leagues: available as free agents when a career starts */
HFC.FREE_STARS = 'Lionel Messi|RW|86|38|Argentina;Cristiano Ronaldo|ST|83|41|Portugal;Son Heung-min|LW|82|33|South Korea;Karim Benzema|ST|80|38|France;Neymar|LW|79|34|Brazil;N\'Golo Kante|CDM|78|35|France;Thomas Muller|CAM|78|36|Germany;Luis Suarez|ST|74|39|Uruguay;Marco Reus|CAM|72|37|Germany;Angel Di Maria|RW|76|38|Argentina';

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
  '3-4-3': [['GK', 50, 90], ['CB', 25, 76], ['CB', 50, 78], ['CB', 75, 76], ['LM', 12, 52], ['CM', 38, 56], ['CM', 62, 56], ['RM', 88, 52], ['LW', 18, 26], ['ST', 50, 18], ['RW', 82, 26]],
  '4-1-4-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 36, 75], ['CB', 64, 75], ['RB', 86, 70], ['CDM', 50, 62], ['LM', 14, 46], ['CM', 38, 48], ['CM', 62, 48], ['RM', 86, 46], ['ST', 50, 20]],
  '4-3-2-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 36, 75], ['CB', 64, 75], ['RB', 86, 70], ['CM', 28, 55], ['CDM', 50, 60], ['CM', 72, 55], ['CAM', 32, 36], ['CAM', 68, 36], ['ST', 50, 18]],
};

HFC.MENTALITY = ['defensive', 'balanced', 'attacking'];
HFC.STYLE = ['possession', 'counter', 'direct'];
HFC.PRESS = ['low', 'medium', 'high'];

/* made-up sponsor brands (not real companies) */
HFC.SPONSORS = ['Nova Telecom', 'Zenith Energy', 'Apex Motors', 'BlueWave Bank', 'Crown Airlines', 'Falcon Insurance', 'Sunrise Mobile', 'Orbit Sports', 'Prime Foods', 'Atlas Mining', 'Pulse Drinks', 'Vertex Tech', 'Savanna Gold', 'Harbor Logistics', 'Lumen Power'];

/* made-up first names / surnames for the manager's job offers and staff, plus the board */
HFC.BOARD = ['The board', 'The chairman', 'The owners'];
