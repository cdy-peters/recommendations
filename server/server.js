const express = require("express");
const bodyparser = require("body-parser");
const request = require("request");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4200;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use("/", express.static("../client/dist/recommendations"));

app.get("/getAccessToken", (req, res) => {
  var code = req.query.code;
  var grant_type = "authorization_code";

  var url = "https://accounts.spotify.com/api/token";
  var body =
    "grant_type=" +
    grant_type +
    "&code=" +
    code +
    "&redirect_uri=" +
    redirect_uri;
  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(client_id + ":" + client_secret).toString("base64"),
  };

  request.post(
    {
      url: url,
      body: body,
      headers: headers,
    },
    (error, response, body) => {
      return res.send(body);
    }
  );
});

app.get("/refreshToken", (req, res) => {
  var refresh_token = req.query.refresh_token;
  var grant_type = "refresh_token";

  var url = "https://accounts.spotify.com/api/token";
  var body = "grant_type=" + grant_type + "&refresh_token=" + refresh_token;
  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(client_id + ":" + client_secret).toString("base64"),
  };

  request.post(
    {
      url: url,
      body: body,
      headers: headers,
    },
    (error, response, body) => {
      return res.send(body);
    }
  );
});

app.get("/*", (req, res) => {
  res.sendFile("index.html", { root: "../client/dist/recommendations" });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
