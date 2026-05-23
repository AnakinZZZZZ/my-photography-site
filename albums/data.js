// ============================================================
// 相册数据配置文件
// 添加新旅行时，只需复制一个对象并修改信息即可
// ============================================================

const SITE_CONFIG = {
  title: "VOYAGER",
  tagline: "A Visual Journey Through Time & Space",
  author: "Your Name",
  social: {
    email: "your@email.com",
    // instagram: "https://instagram.com/yourname",
    // github: "https://github.com/yourname",
  }
};

const ALBUMS = [
  {
    id: "yunnan-meili",
    title: "梅里雪山",
    subtitle: "Meili Snow Mountain",
    date: "2020.10",
    location: "云南 / 梅里雪山",
    cover: "images/covers/yunnan-meili.jpg",
    coords: { lat: 28.4, lng: 98.7 },
    photoCount: 3,
    photos: [
      { src: "images/photos/yunnan-meili/梅里雪山-仙女峰.jpg", caption: "仙女峰" },
      { src: "images/photos/yunnan-meili/梅里雪山-日出.jpg", caption: "日出" },
      { src: "images/photos/yunnan-meili/梅里雪山-雾浓顶.jpg", caption: "雾浓顶" },
    ]
  },
  {
    id: "sri-lanka",
    title: "斯里兰卡",
    subtitle: "Sri Lanka",
    date: "2024.10",
    location: "斯里兰卡",
    cover: "images/covers/sri-lanka.jpg",
    coords: { lat: 7.9, lng: 80.8 },
    photoCount: 5,
    photos: [
      { src: "images/photos/sri-lanka/Wild Coast Tented Lodge.jpg", caption: "Wild Coast Tented Lodge" },
      { src: "images/photos/sri-lanka/印度洋日落.jpg", caption: "印度洋日落" },
      { src: "images/photos/sri-lanka/狮子岩.jpg", caption: "狮子岩" },
      { src: "images/photos/sri-lanka/雅拉-共生.jpg", caption: "雅拉-共生" },
      { src: "images/photos/sri-lanka/雅拉-蜥蜴.jpg", caption: "雅拉-蜥蜴" },
    ]
  },
];
