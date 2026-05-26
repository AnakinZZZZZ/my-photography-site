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

// 相册按时间从老到新排序
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
    id: "indonesia",
    title: "印尼",
    subtitle: "Indonesia",
    date: "2023.05",
    location: "印尼 / 东爪哇",
    cover: "images/covers/indonesia.jpg",
    coords: { lat: -7.9, lng: 112.9 },
    photoCount: 5,
    photos: [
      { src: "images/photos/indonesia/布罗莫村庄.jpg", caption: "布罗莫村庄" },
      { src: "images/photos/indonesia/布罗莫火山.jpg", caption: "布罗莫火山" },
      { src: "images/photos/indonesia/布罗莫火山口.jpg", caption: "布罗莫火山口" },
      { src: "images/photos/indonesia/精灵坠崖.jpg", caption: "精灵坠崖" },
      { src: "images/photos/indonesia/赛武瀑布.jpg", caption: "赛武瀑布" },
    ]
  },
  {
    id: "tibet",
    title: "西藏",
    subtitle: "Tibet",
    date: "2023.10",
    location: "西藏 / 拉萨",
    cover: "images/photos/tibet/阿玛直米雪山.jpg",
    coords: { lat: 29.6, lng: 91.1 },
    photoCount: 5,
    photos: [
      { src: "images/photos/tibet/布达拉宫-日落.JPG", caption: "布达拉宫日落" },
      { src: "images/photos/tibet/布达拉宫.jpg", caption: "布达拉宫" },
      { src: "images/photos/tibet/日托寺.jpg", caption: "日托寺" },
      { src: "images/photos/tibet/羊卓雍措.jpg", caption: "羊卓雍措" },
      { src: "images/photos/tibet/阿玛直米雪山.jpg", caption: "阿玛直米雪山" },
    ]
  },
  {
    id: "new-zealand",
    title: "新西兰",
    subtitle: "New Zealand",
    date: "2024.02",
    location: "新西兰 / 南岛",
    cover: "images/photos/new-zealand/孤独的树.jpg",
    coords: { lat: -44.0, lng: 170.5 },
    photoCount: 5,
    photos: [
      { src: "images/photos/new-zealand/好牧羊人银河.jpg", caption: "好牧羊人银河" },
      { src: "images/photos/new-zealand/孤独的树.jpg", caption: "孤独的树" },
      { src: "images/photos/new-zealand/特卡波湖.jpg", caption: "特卡波湖" },
      { src: "images/photos/new-zealand/皇后镇.jpg", caption: "皇后镇" },
      { src: "images/photos/new-zealand/皇后镇蒸汽船.jpg", caption: "皇后镇蒸汽船" },
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
