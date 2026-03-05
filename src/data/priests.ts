export interface Priest {
  name: string;
  nameEn: string;
  baptismalName?: string;
  baptismalNameEn?: string;
  generation: number;
  tenureStart: string;
  tenureEnd?: string;
  image?: string;
}

export const priests: Priest[] = [
  { name: '이상선', nameEn: 'Sang-Sun Lee', baptismalName: '요셉', baptismalNameEn: 'Joseph', generation: 11, tenureStart: '2022.04', image: '11_p.png' },
  { name: '이계천', nameEn: 'Gye-Cheon Lee', baptismalName: '세례자 요한', baptismalNameEn: 'John the Baptist', generation: 10, tenureStart: '2017.11', tenureEnd: '2022.02', image: '10_p.jpg' },
  { name: '이철', nameEn: 'Chul Lee', baptismalName: '니콜라오', baptismalNameEn: 'Nicholas', generation: 9, tenureStart: '2013.02', tenureEnd: '2017.10', image: '09_p.jpg' },
  { name: '김훈겸', nameEn: 'Hoon-Gyeom Kim', baptismalName: '세례자 요한', baptismalNameEn: 'John the Baptist', generation: 8, tenureStart: '2008.03', tenureEnd: '2013.02', image: '08_p.png' },
  { name: '전영준', nameEn: 'Young-Jun Jeon', generation: 7, tenureStart: '2005', tenureEnd: '2008.03', image: '07_p.jpeg' },
  { name: '박명근', nameEn: 'Myung-Geun Park', generation: 6, tenureStart: '2002.08', tenureEnd: '2004.03', image: '06_p.jpeg' },
  { name: '이상일', nameEn: 'Sang-Il Lee', generation: 5, tenureStart: '1999.08', tenureEnd: '2002.08' },
  { name: '김성호', nameEn: 'Sung-Ho Kim', generation: 4, tenureStart: '1997', tenureEnd: '1999.08' },
  { name: '안승길', nameEn: 'Seung-Gil Ahn', generation: 3, tenureStart: '1994.04', tenureEnd: '1996.04' },
  { name: '조규덕', nameEn: 'Gyu-Deok Jo', generation: 2, tenureStart: '1994', tenureEnd: '1994' },
  { name: '변희섭', nameEn: 'Hee-Sub Byun', generation: 1, tenureStart: '1992.08', tenureEnd: '1994' },
];
