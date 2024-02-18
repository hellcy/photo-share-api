var users = [
  { githubLogin: "ycheng", name: "Yuan Cheng" },
  { githubLogin: "nyang", name: "Nan Yang" },
  { githubLogin: "azhang", name: "Anyu Zhang" },
];

var photos = [
  {
    id: "1",
    name: "Dropping the Heart Chute",
    description: "The heart chute is one of my favorite chutes",
    category: "ACTION",
    githubUser: "ycheng",
  },
  {
    id: "2",
    name: "Enjoying the sunshine",
    category: "SELFIE",
    githubUser: "nyang",
  },
  {
    id: "3",
    name: "Gunbarrel 25",
    description: "25 laps on gunbarrel today",
    category: "LANDSCAPE",
    githubUser: "azhang",
  },
];

var tags = [
  { photoID: "1", userID: "ycheng" },
  { photoID: "2", userID: "ycheng" },
  { photoID: "2", userID: "nyang" },
  { photoID: "2", userID: "azhang" },
];

module.exports.users = users;
module.exports.photos = photos;
module.exports.tags = tags;
