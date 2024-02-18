const { users, photos, tags } = require("../data");
const { authorizeWithGithub } = require("../utils");

var _id = 0;

// resolver takes graphql query and returns data
const resolvers = {
  Query: {
    me: (parent, args, { currentUser }) => currentUser,
    totalPhotos: (parent, args, { db }) =>
      db.collection("photos").estimatedDocumentCount(),
    allPhotos: (parent, args, { db }) =>
      db.collection("photos").find().toArray(),
    totalUsers: (parent, args, { db }) =>
      db.collection("users").estimatedDocumentCount(),
    allUsers: (parent, args, { db }) => db.collection("users").find().toArray(),
  },

  Mutation: {
    async postPhoto(parent, args, { db, currentUser }) {
      // 1. if there is not a user in context, throw an error
      if (!currentUser) {
        throw new Error("only an authorized user can post a photo.");
      }

      // 2. save the current user's id with the photo
      const newPhoto = {
        ...args.input,
        userID: currentUser.githubLogin,
        created: new Date(),
      };

      // 3. insert the new photo, capture the id that the database created
      const { insertedId } = await db.collection("photos").insertOne(newPhoto);
      newPhoto.id = insertedId;

      return newPhoto;
    },

    async githubAuth(parent, { code }, { db }) {
      // obtain data from github
      let { message, access_token, avatar_url, login, name } =
        await authorizeWithGithub({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code,
        });

      // if there is a message, something went wrong
      if (message) {
        throw new Error(message);
      }

      // package the results into a single object
      let latestUserInfo = {
        name,
        githubLogin: login,
        githubToken: access_token,
        avatar: avatar_url,
      };

      console.log("latestUserInfo: " + JSON.stringify(latestUserInfo));

      // add or update the record with the new information
      const { acknowledged } = await db
        .collection("users")
        .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

      if (!acknowledged) {
        throw new Error("Update user failed.");
      }

      // return user data and their token
      return { user: latestUserInfo, token: access_token };
    },

    addFakeUsers: async (parent, { count }, { db }) => {
      var randomUserApi = `https://randomuser.me/api/?results=${count}`;

      var { results } = await fetch(randomUserApi).then((res) => res.json());

      var users = results.map((res) => ({
        githubLogin: res.login.username,
        name: `${res.name.first} ${res.name.last}`,
        avatar: res.picture.thumbnail,
        githubToken: res.login.sha1,
      }));

      await db.collection("users").insertMany(users);

      return users;
    },

    fakeUserAuth: async (parent, { githubLogin }, { db }) => {
      var user = await db.collection("users").findOne({ githubLogin });

      if (!user) {
        throw new Error(`Cannot find user with githubLogin ${githubLogin}`);
      }

      return {
        token: user.githubToken,
        user,
      };
    },
  },

  Photo: {
    id: (parent) => parent.id || parent._id,
    // the first argument in a resolver function is always the parent object, in this case, is the Photo object
    url: (parent) => `/img/photos/${parent._id}.jpg`,
    postedBy: (parent, args, { db }) => {
      return db.collection("users").findOne({ githubLogin: parent.userID });
    },
    taggedUsers: (parent) =>
      tags
        // returns an array of tags that only contain the current photo
        .filter((t) => t.photoID === parent.id)

        // converts the array tags into an array of userIDs
        .map((t) => t.userID)

        // converts array of userIDs into an array of users
        .map((userID) => users.find((u) => u.githubLogin === userID)),
  },

  User: {
    postedPhotos: (parent) => {
      return photos.filter((p) => p.githubUser === parent.githubLogin);
    },
    inPhotos: (parent) =>
      tags
        .filter((t) => t.userID === parent.githubLogin)
        .map((t) => t.photoID)
        .map((photoID) => photos.find((p) => p.id === photoID)),
  },
};

module.exports = resolvers;
