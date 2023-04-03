const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const ip = require("ip");
const ngrok = require("ngrok");

const { v4: uuidv4 } = require("uuid");

const axios = require("axios").default;
const path = require("path");

// server css as static
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.send("Hello!");
});

// สร้างหน้า Social App Line Login
app.get("/linelogin", (req, res) => {
  const authorization = {
    response_type: "code",
    client_id: "1660757820",
    channels_userid: "Ua93c06085294c85333274ee5ac5248cd",
    redirect_uri: "http://localhost:8080/linecallback",
    state: uuidv4(),
    scope: "profile%20openid%20email",
  };
  let url = `https://access.line.me/oauth2/v2.1/authorize?response_type=${authorization.response_type}&client_id=${authorization.client_id}&redirect_uri=${authorization.redirect_uri}&state=${authorization.state}abcde&scope=${authorization.scope}}`;
  console.log(`line login with url: ${url}`);
  res.redirect(url);
});

// รับค่าจาก Social App Line
app.get("/linecallback", async (req, res) => {
  console.log(`line callback with query: ${JSON.stringify(req.query)}`);
  const accessToken = {
    code: req.query.code,
    error: req.query.error,
    error_description: req.query.error_description,
    state: req.query.state,
    redirect_uri: "http://localhost:8080/linecallback",
    client_id: "1660757820",
    channel_secret: "01eadd9e2c176e86cdc6cb35a7f5e3ef",
  };
  if (accessToken.error !== undefined) {
    console.error(
      `access token: error response ${accessToken.error_description}`
    );
    res.send(`access token: error response ${accessToken.error_description}`);
  } else {
    const data = new URLSearchParams();
    data.append("grant_type", "authorization_code");
    data.append("code", `${accessToken.code}`);
    data.append("redirect_uri", `${accessToken.redirect_uri}`);
    data.append("client_id", `${accessToken.client_id}`);
    data.append("client_secret", `${accessToken.channel_secret}`);
    let result = await axios
      .post("https://api.line.me/oauth2/v2.1/token", data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then((response) => {
        console.log(response.data);
        return response;
      })
      .catch((error) => {
        console.error(error);
        return error;
      });
    let url = `http://localhost:8080/lineprofile?at=${result.data.access_token}&tt=${result.data.token_type}`;
    res.redirect(url);
  }
});

// แสดง Line Profile จากค่าที่ได้รับ
app.get("/lineprofile", async (req, res) => {
  let result = await axios
    .get("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `${req.query.tt} ${req.query.at}`,
      },
    })
    .then((response) => {
      console.log(response.data);
      return response;
    })
    .catch((error) => {
      console.error(error);
      return error;
    });
  const profile = {
    access_token: req.query.at,
    display_name: result.data.displayName,
    picture_url: result.data.pictureUrl,
    status_message: result.data.statusMessage,
    user_id: result.data.userId,
  };
  console.log(JSON.stringify(profile));
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
      <title>Profile ${profile.display_name}</title>
      <link rel="stylesheet" href="line_profile/assets/bootstrap/css/bootstrap.min.css">
      <link rel="stylesheet" href="line_profile/assets/css/Team-Boxed.css">
  </head>
  <body>
      <section class="team-boxed">
          <div class="container">
              <div class="intro">
                  <h2 class="text-center"><strong>${profile.display_name}</strong></h2>
                  <p class="text-center">LINE Profile</p>
              </div>
              <div class="row people">
                  <div class="col-md-4 col-sm-6 item"></div>
                  <div class="col-md-4 col-sm-6 item">
                      <div class="box" style="background-color: #eef4f7;">
                          <img class="img-circle" src="${profile.picture_url}" />
                          <h3 class="name">${profile.status_message}</h3>
                          <p class="title">${profile.user_id}</p>
                          <p class="description">${profile.access_token}</p>
                      </div>
                  </div>
                  <div class="col-md-4 col-sm-6 item"></div>
              </div>
          </div>
      </section>
      <script src="line_profile/assets/js/jquery.min.js"></script>
      <script src="line_profile/assets/bootstrap/js/bootstrap.min.js"></script>
  </body>
  </html>`);
});

// สร้างหน้า Social App Facebook Login
app.get("/facebooklogin", (req, res) => {
  const authorization = {
    response_type: "code",
    client_id: "1660757820",
    channels_userid: "Ua93c06085294c85333274ee5ac5248cd",
    redirect_uri: "http://localhost:8080/linecallback",
    state: uuidv4(),
    scope: "profile%20openid%20email",
  };
  let url = `https://access.line.me/oauth2/v2.1/authorize?response_type=${authorization.response_type}&client_id=${authorization.client_id}&redirect_uri=${authorization.redirect_uri}&state=${authorization.state}abcde&scope=${authorization.scope}}`;
  console.log(`line login with url: ${url}`);
  res.redirect(url);
});

app.listen(port, async () => {
  let url;
  // url = await ngrok.connect({
  //   authtoken: "21F753R442FDgH5Dio8V6p8Ltvv_6sCYvkoSmDiNfMMJgiMzM",
  //   addr: port,
  // });
  const ipAddress = ip.address();
  console.log(`Starting at ip:${ipAddress} port:${port} ngrok:${url}`);
});
