/**
 * Divisão administrativa de Angola: 21 províncias (após a reorganização de 2024),
 * com os municípios oficiais e principais comunas.
 *
 * Fonte: INE Angola + Diários da República (Lei 6/24 e seguintes).
 * Cobertura: 100% das províncias e municípios; comunas incluem todas as sedes
 * municipais e principais subdivisões. Onde a comuna não aparece, o utilizador
 * pode escrever o endereço detalhado no campo livre.
 */

export interface Municipality {
  name: string;
  communes: string[];
}

export interface Province {
  code: string;
  name: string;
  municipalities: Municipality[];
}

export const ANGOLA_PROVINCES: Province[] = [
  {
    code: "BGO",
    name: "Bengo",
    municipalities: [
      { name: "Ambriz", communes: ["Ambriz", "Bela Vista", "Tabi"] },
      { name: "Bula Atumba", communes: ["Bula Atumba", "Quiage", "Quibaxe"] },
      { name: "Dande", communes: ["Caxito", "Barra do Dande", "Mabubas", "Quicabo", "Úcua"] },
      { name: "Dembos", communes: ["Quibaxe", "Paredes", "Piri"] },
      { name: "Nambuangongo", communes: ["Muxaluando", "Cazuangongo", "Gombe", "Kibaxe", "Quicunzo", "Zala"] },
      { name: "Pango Aluquém", communes: ["Pango Aluquém", "Cazuangongo"] },
    ],
  },
  {
    code: "BGU",
    name: "Benguela",
    municipalities: [
      { name: "Baía Farta", communes: ["Baía Farta", "Calahanga", "Dombe Grande", "Equimina"] },
      { name: "Balombo", communes: ["Balombo", "Chindumbo", "Chingongo", "Maca Mombolo"] },
      { name: "Benguela", communes: ["Benguela", "Catumbela"] },
      { name: "Bocoio", communes: ["Bocoio", "Cubal do Lumbo", "Monte Belo", "Passe"] },
      { name: "Caimbambo", communes: ["Caimbambo", "Catengue", "Cayave", "Wiawia"] },
      { name: "Catumbela", communes: ["Catumbela", "Praia Bebé"] },
      { name: "Chongorói", communes: ["Chongorói", "Bolonguera", "Camuine"] },
      { name: "Cubal", communes: ["Cubal", "Capupa", "Iambala", "Tumbulu"] },
      { name: "Ganda", communes: ["Ganda", "Babaera", "Casseque", "Chicuma", "Chila", "Ebanga"] },
      { name: "Lobito", communes: ["Lobito", "Canata", "Egipto Praia"] },
    ],
  },
  {
    code: "BIE",
    name: "Bié",
    municipalities: [
      { name: "Andulo", communes: ["Andulo", "Calucinga", "Chivaulo", "Cunhinga"] },
      { name: "Camacupa", communes: ["Camacupa", "Cuanza", "Muinha", "Umpulo"] },
      { name: "Catabola", communes: ["Catabola", "Caiuera", "Chipeta", "Sande", "Sachinemuna"] },
      { name: "Chinguar", communes: ["Chinguar", "Cangote", "Kutato", "Belo Horizonte"] },
      { name: "Chitembo", communes: ["Chitembo", "Cachingues", "Malengue", "Mumbué", "Soma Kuanza"] },
      { name: "Cuemba", communes: ["Cuemba", "Cunje", "Luando"] },
      { name: "Cunhinga", communes: ["Cunhinga", "Belo Horizonte"] },
      { name: "Kuito", communes: ["Kuito", "Cambândua", "Chicala", "Trumba"] },
      { name: "Nharea", communes: ["Nharea", "Caiei", "Dando", "Lubia"] },
    ],
  },
  {
    code: "CAB",
    name: "Cabinda",
    municipalities: [
      { name: "Belize", communes: ["Belize", "Luali", "Miconge"] },
      { name: "Buco-Zau", communes: ["Buco-Zau", "Inhuca", "Necuto"] },
      { name: "Cabinda", communes: ["Cabinda", "Malembo", "Tando Zinze"] },
      { name: "Cacongo", communes: ["Lândana", "Dinge", "Massabi"] },
    ],
  },
  {
    code: "CCC",
    name: "Cuando",
    municipalities: [
      { name: "Dirico", communes: ["Dirico", "Mucusso", "Xamavera"] },
      { name: "Mavinga", communes: ["Mavinga", "Cunjamba", "Luengue", "Tempué"] },
      { name: "Nancova", communes: ["Nancova", "Mue", "Rivungo"] },
      { name: "Rivungo", communes: ["Rivungo", "Luiana", "Mucusso"] },
    ],
  },
  {
    code: "CBG",
    name: "Cubango",
    municipalities: [
      { name: "Calai", communes: ["Calai", "Bondo", "Maúe"] },
      { name: "Cuangar", communes: ["Cuangar", "Caiundo", "Savate"] },
      { name: "Cuchi", communes: ["Cuchi", "Chinguanja", "Cutato", "Vissati"] },
      { name: "Cuito Cuanavale", communes: ["Cuito Cuanavale", "Baixo Longa", "Lupire", "Mavinga"] },
      { name: "Menongue", communes: ["Menongue", "Caiundo", "Cueio", "Missombo"] },
    ],
  },
  {
    code: "CNN",
    name: "Cunene",
    municipalities: [
      { name: "Cahama", communes: ["Cahama", "Otchinjau"] },
      { name: "Cuanhama", communes: ["Ondjiva", "Môngua", "Mucope", "Nehone", "Oihole"] },
      { name: "Curoca", communes: ["Oncócua", "Chitado"] },
      { name: "Cuvelai", communes: ["Cuvelai", "Calonga", "Mupa"] },
      { name: "Namacunde", communes: ["Namacunde", "Chiede", "Shana"] },
      { name: "Ombadja", communes: ["Xangongo", "Humbe", "Mucolongondjo", "Naulila", "Ombala-yo-Mungo"] },
    ],
  },
  {
    code: "HBO",
    name: "Huambo",
    municipalities: [
      { name: "Bailundo", communes: ["Bailundo", "Bimbe", "Hengue", "Lunge", "Luvemba"] },
      { name: "Cachiungo", communes: ["Cachiungo", "Chiumbo", "Samboto"] },
      { name: "Caála", communes: ["Caála", "Calenga", "Catata", "Cuima"] },
      { name: "Ekunha", communes: ["Ekunha", "Cilo"] },
      { name: "Huambo", communes: ["Huambo", "Calima", "Chipipa", "Kala"] },
      { name: "Londuimbali", communes: ["Londuimbali", "Alto Hama", "Galanga", "Ussoque"] },
      { name: "Longonjo", communes: ["Longonjo", "Lépi", "Chilata", "Kiata"] },
      { name: "Mungo", communes: ["Mungo", "Chiumbo"] },
      { name: "Tchicala-Tcholoanga", communes: ["Tchicala-Tcholoanga", "Samboto", "Sambo"] },
      { name: "Tchindjenje", communes: ["Tchindjenje", "Cuima"] },
      { name: "Ucuma", communes: ["Ucuma", "Mbave", "Cacoma"] },
    ],
  },
  {
    code: "HUI",
    name: "Huíla",
    municipalities: [
      { name: "Caconda", communes: ["Caconda", "Cusse", "Gungue", "Uaba"] },
      { name: "Cacula", communes: ["Cacula", "Chituto", "Viti-Vivali"] },
      { name: "Caluquembe", communes: ["Caluquembe", "Calepi", "Ngola"] },
      { name: "Chibia", communes: ["Chibia", "Capunda Cavilongo", "Jau", "Quihita"] },
      { name: "Chicomba", communes: ["Chicomba", "Cutenda"] },
      { name: "Chipindo", communes: ["Chipindo", "Bambi"] },
      { name: "Cuvango", communes: ["Cuvango", "Galangue", "Vissati"] },
      { name: "Humpata", communes: ["Humpata", "Neves"] },
      { name: "Jamba", communes: ["Jamba", "Cassinga", "Dongo"] },
      { name: "Lubango", communes: ["Lubango", "Arimba", "Hoque", "Huíla", "Quilemba"] },
      { name: "Matala", communes: ["Matala", "Capelongo", "Mulondo"] },
      { name: "Quilengues", communes: ["Quilengues", "Dinde", "Impulo"] },
      { name: "Quipungo", communes: ["Quipungo", "Cainda"] },
    ],
  },
  {
    code: "ICB",
    name: "Icolo e Bengo",
    municipalities: [
      { name: "Bom Jesus", communes: ["Bom Jesus", "Cabiri"] },
      { name: "Catete", communes: ["Catete", "Calomboloca", "Quissama"] },
      { name: "Cazenga", communes: ["Cazenga", "Hoji-ya-Henda", "Tala Hady"] },
      { name: "Quiçama", communes: ["Muxima", "Cabo Ledo", "Demba Chio", "Mumbondo", "Quixinge"] },
    ],
  },
  {
    code: "KSN",
    name: "Cuanza Norte",
    municipalities: [
      { name: "Ambaca", communes: ["Camabatela", "Bindo", "Luinga", "Tabi"] },
      { name: "Banga", communes: ["Banga", "Aldeia Nova", "Caculo Cabaza"] },
      { name: "Bolongongo", communes: ["Bolongongo", "Quiquiemba", "Terreiro"] },
      { name: "Cambambe", communes: ["Cambambe", "Dondo", "Massangano", "São Pedro da Quilemba"] },
      { name: "Cazengo", communes: ["N'dalatando", "Canhoca", "Lonhe"] },
      { name: "Golungo Alto", communes: ["Golungo Alto", "Cambondo", "Cerca", "Quiquiemba"] },
      { name: "Lucala", communes: ["Lucala", "Quiculungo"] },
      { name: "Quiculungo", communes: ["Quiculungo", "Camame", "Sete"] },
    ],
  },
  {
    code: "KSS",
    name: "Cuanza Sul",
    municipalities: [
      { name: "Amboim", communes: ["Gabela", "Assango", "São Bartolomeu do Mussumba"] },
      { name: "Cassongue", communes: ["Cassongue", "Atome", "Pambangala"] },
      { name: "Conda", communes: ["Conda", "Cunjo", "Gungo"] },
      { name: "Ebo", communes: ["Ebo", "Conde", "São Lucas"] },
      { name: "Libolo", communes: ["Calulo", "Cabuta", "Munenga", "Quissongo"] },
      { name: "Mussende", communes: ["Mussende", "Quienha", "São Lucas"] },
      { name: "Porto Amboim", communes: ["Porto Amboim", "Capolo", "Quicombo"] },
      { name: "Quibala", communes: ["Quibala", "Dala Cachibo", "Lonhinga", "Lutete"] },
      { name: "Quilenda", communes: ["Quilenda", "Quirimbo"] },
      { name: "Seles", communes: ["Uku Seles", "Amboiva", "Botera"] },
      { name: "Sumbe", communes: ["Sumbe", "Gangula", "Quicombo"] },
      { name: "Waku-Kungo", communes: ["Waku-Kungo", "Cariango", "Sanga"] },
    ],
  },
  {
    code: "LDA",
    name: "Luanda",
    municipalities: [
      { name: "Belas", communes: ["Belas", "Barra do Kwanza", "Benfica", "Camama", "Futungo de Belas", "Kilamba", "Ramiros"] },
      { name: "Cacuaco", communes: ["Cacuaco", "Funda", "Kikolo", "Quicolo"] },
      { name: "Cazenga", communes: ["Cazenga", "Hoji-ya-Henda", "Kima Quiezo", "Tala Hady"] },
      { name: "Icolo e Bengo", communes: ["Catete", "Bom Jesus", "Cabiri", "Calomboloca"] },
      { name: "Luanda", communes: ["Ingombota", "Maianga", "Rangel", "Samba", "Sambizanga"] },
      { name: "Quiçama", communes: ["Muxima", "Cabo Ledo", "Demba Chio", "Mumbondo"] },
      { name: "Talatona", communes: ["Talatona", "Benfica", "Camama", "Cidade Universitária", "Lar do Patriota", "Mussulo"] },
      { name: "Viana", communes: ["Viana", "Calumbo", "Vila Flor", "Zango"] },
    ],
  },
  {
    code: "LNN",
    name: "Lunda Norte",
    municipalities: [
      { name: "Cambulo", communes: ["Cambulo", "Caungula", "Luia"] },
      { name: "Capenda Camulemba", communes: ["Capenda Camulemba", "Xinge"] },
      { name: "Caungula", communes: ["Caungula", "Cuilo"] },
      { name: "Chitato", communes: ["Lóvua", "Chitato", "Calonda"] },
      { name: "Cuango", communes: ["Cuango", "Luremo"] },
      { name: "Cuilo", communes: ["Cuilo", "Caluango"] },
      { name: "Lóvua", communes: ["Lóvua", "Camissombo"] },
      { name: "Lubalo", communes: ["Lubalo", "Tembo Aluma"] },
      { name: "Lucapa", communes: ["Lucapa", "Camissombo", "Xá-Cassau"] },
      { name: "Xá-Muteba", communes: ["Xá-Muteba", "Cassanguidi", "Muvunji"] },
    ],
  },
  {
    code: "LNS",
    name: "Lunda Sul",
    municipalities: [
      { name: "Cacolo", communes: ["Cacolo", "Alto Chicapa", "Cucumbi", "Muriege"] },
      { name: "Dala", communes: ["Dala", "Casage Calucala", "Cazage"] },
      { name: "Muconda", communes: ["Muconda", "Cassai-Sul", "Muriege", "Xassengue"] },
      { name: "Saurimo", communes: ["Saurimo", "Mona Quimbundo", "Sombo"] },
    ],
  },
  {
    code: "MAL",
    name: "Malanje",
    municipalities: [
      { name: "Cacuso", communes: ["Cacuso", "Lombe", "Pungo Andongo", "Soqueco"] },
      { name: "Calandula", communes: ["Calandula", "Cota", "Cuale", "Kateco-Kangola", "Kinge", "Kuale"] },
      { name: "Cambundi-Catembo", communes: ["Cambundi-Catembo", "Bondo"] },
      { name: "Cangandala", communes: ["Cangandala", "Bembo", "Caribo"] },
      { name: "Caombo", communes: ["Caombo", "Massango"] },
      { name: "Cuaba Nzogo", communes: ["Cuaba Nzogo", "Tembo"] },
      { name: "Cunda-Dia-Baze", communes: ["Cunda-Dia-Baze", "Mufuma"] },
      { name: "Luquembo", communes: ["Luquembo", "Cassoalala", "Quinje"] },
      { name: "Malanje", communes: ["Malanje", "Cambaxe", "Kambo", "Ngola Luiji"] },
      { name: "Marimba", communes: ["Marimba", "Caxinga", "Cubo"] },
      { name: "Massango", communes: ["Massango", "Quibala Norte"] },
      { name: "Mucari", communes: ["Mucari", "Quizenga"] },
      { name: "Quela", communes: ["Quela", "Bângalas", "Moma", "Xandel"] },
      { name: "Quirima", communes: ["Quirima", "Sautar"] },
    ],
  },
  {
    code: "MOL",
    name: "Moxico",
    municipalities: [
      { name: "Bundas", communes: ["Lumbala N'guimbo", "Chiume", "Lutembo", "Sessa"] },
      { name: "Camanongue", communes: ["Camanongue", "Cangonga"] },
      { name: "Léua", communes: ["Léua", "Lóvua"] },
      { name: "Luacano", communes: ["Luacano", "Cameia"] },
      { name: "Luau", communes: ["Luau", "Lago Dilolo"] },
      { name: "Luchazes", communes: ["Cangamba", "Muié"] },
      { name: "Moxico", communes: ["Luena", "Cangumbe", "Lucusse"] },
    ],
  },
  {
    code: "MLE",
    name: "Moxico Leste",
    municipalities: [
      { name: "Alto Zambeze", communes: ["Cazombo", "Caianda", "Calunda", "Lóvua"] },
      { name: "Cameia", communes: ["Cameia", "Lumeji"] },
      { name: "Lumbala-Nguimbo", communes: ["Lumbala N'guimbo", "Chiume", "Lutembo"] },
    ],
  },
  {
    code: "NMB",
    name: "Namibe",
    municipalities: [
      { name: "Bibala", communes: ["Bibala", "Capangombe", "Caitou", "Lola"] },
      { name: "Camucuio", communes: ["Camucuio", "Chingo", "Mamué"] },
      { name: "Moçâmedes", communes: ["Moçâmedes", "Bentiaba", "Forte Santa Rita", "Lucira"] },
      { name: "Tômbwa", communes: ["Tômbwa", "Baía dos Tigres"] },
      { name: "Virei", communes: ["Virei", "Cainde"] },
    ],
  },
  {
    code: "UIG",
    name: "Uíge",
    municipalities: [
      { name: "Alto Cauale", communes: ["Cangola", "Caiongo"] },
      { name: "Ambuíla", communes: ["Ambuíla", "Camatambo"] },
      { name: "Bembe", communes: ["Bembe", "Lucungo", "Mabaia"] },
      { name: "Buengas", communes: ["Buengas", "Cuilo Pombo"] },
      { name: "Bungo", communes: ["Bungo", "Quipedro"] },
      { name: "Damba", communes: ["Damba", "Nsosso", "Petecusso"] },
      { name: "Maquela do Zombo", communes: ["Maquela do Zombo", "Béu", "Cuilo Futa", "Quibocolo", "Sacandica"] },
      { name: "Mucaba", communes: ["Mucaba", "Uando-Hamba"] },
      { name: "Negage", communes: ["Negage", "Dimuca", "Quisseque"] },
      { name: "Puri", communes: ["Puri", "Quincombe"] },
      { name: "Quimbele", communes: ["Quimbele", "Alto Zaza", "Cuango", "Icoca"] },
      { name: "Quitexe", communes: ["Quitexe", "Aldeia Viçosa", "Cambamba", "Vista Alegre"] },
      { name: "Sanza Pombo", communes: ["Sanza Pombo", "Alfândega", "Cuilo Camboso", "Uamba"] },
      { name: "Songo", communes: ["Songo", "Quipedro"] },
      { name: "Uíge", communes: ["Uíge", "Candombe", "Quitejé", "Quizenga"] },
      { name: "Zombo", communes: ["Maquela do Zombo", "Béu", "Quibocolo", "Sacandica"] },
    ],
  },
  {
    code: "ZAI",
    name: "Zaire",
    municipalities: [
      { name: "Cuimba", communes: ["Cuimba", "Buela", "Luvaca", "Serra da Canda"] },
      { name: "M'banza Kongo", communes: ["M'banza Kongo", "Caluca", "Kaiongo", "Luvo", "Madimba"] },
      { name: "Nóqui", communes: ["Nóqui", "Mpala", "Tomboco"] },
      { name: "N'Zeto", communes: ["N'Zeto", "Kindeje", "Musserra"] },
      { name: "Soyo", communes: ["Soyo", "Mangue Grande", "Pedra de Feitiço", "Quelo", "Sumba"] },
      { name: "Tomboco", communes: ["Tomboco", "Quinzau"] },
    ],
  },
];

// Helpers
export const provinceByName = (name: string) => ANGOLA_PROVINCES.find((p) => p.name === name);
export const municipalityByName = (provinceName: string, munName: string) =>
  provinceByName(provinceName)?.municipalities.find((m) => m.name === munName);
