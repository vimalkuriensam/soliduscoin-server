const cors = require("cors");
const express = require("express");
var sql = require("mssql");

const app = express();
app.use(cors());
const port = process.env.PORT || 8000;

// config for your database
const config = {
  user: "mohit",
  password: "Mcareliv@0",
  server: "103.73.189.179",
  database: "soliduscoin",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// connect to your database
sql.connect(config, function (err) {
  if (err) console.log(err);
  else console.log("connected to sql");
});

var pool;
const queryDb = async (sqlquery) => {
  pool = await sql.connect(config);
  const data = await pool.request().query(sqlquery);
  if (data) {
    pool.close;
    sql.close;
    return data;
  }
};

var obj = {};

app.listen(port, () => {
  console.log(`App server now listening to port ${port}`);
});

app.get("/api/signin/:address", async (req, res) => {
  var address = req.params.address;
  var request = new sql.Request();
  request.query(
    "select Userid as userid FROM myuser where Address ='" + address + "'",
    (err, data) => {
      if (err) {
        obj.userid = err;
      } else {
        obj.userid = data;
      }
      res.send({ obj });
    }
  );
});
app.get("/api/logout", async (req, res) => {
  console.log("hello gays my logout page");

  // logout from all devices...................................................//
  // req.rootUser.tokens = [];
  res.clearCookie("jwtoken", { path: "/" });
  // await req.rootUser.save();
  //////////////////////////////////////////////////////////////////////////////////////////////////

  // res.clearCookie("jwtoken", { path: "/" });
  res.status(200).send("user logout");
});
app.get("/api/profile/:userid", (req, res) => {
  // create Request object
  var userid = req.params.userid;
  var request = new sql.Request();
  var obj = {};

  request.query(
    "select Sponserid as Sponserid,Name as Name,Email as Email,Mobile as Mobile,Eswmobile as Eswmobile,bnbaddress as bnbaddress FROM myuser where Userid='" +
      userid +
      "'",
    async (err, data) => {
      if (err) {
        obj.profile = err;
      } else {
        obj.profile = data;
      }
      console.log(obj);
      res.send(obj);
    }
  );
});

app.get("/api/balance/:userid", (req, res) => {
  // create Request object
  var userid = req.params.userid;
  var request = new sql.Request();
  var bal = {};

  request.query(
    "select isnull(Mainbal,0) as Mainbal FROM myuser where Userid='" +
      userid +
      "'",
    async (err, data) => {
      if (err) {
        bal.balance = err;
      } else {
        bal.balance = data;
      }
      console.log(bal);
      res.send(bal);
    }
  );
});

app.get("/api/users/:userid", async (req, res) => {
  // create Request object
  var userid = req.params.userid;
  try {
    await sql.connect(
      `Server=${config.server};Database=${config.database};User Id=${config.user};Password=${config.password};Encrypt=${config.encrypt}`
    );
    const stmts = [
      `select FORMAT(Dateofjoining, 'dd-MM-yyyy') as Dob FROM myuser where Userid ='${userid}'`,
      `select isnull(sum(coinamount),0) as investment FROM package where Userid='${userid}'`,
      `select isnull(sum(amount),0) as levelincome FROM Statementigc where type='Credit' and Userid='${userid}' and Mode='Level Income'`,
      `select isnull(sum(amount),0) as divedendincome FROM Statementigc where type='Credit' and Userid='${userid}' and Mode='Divedend Income'`,
      `select isnull(sum(amount),0) as roiincome FROM Statementigc where type='Credit' and Userid='${userid}' and Mode='Roi Income'`,
      `select isnull(sum(amount),0) as withdrawal FROM Statementigc where type='Credit' and Userid='${userid}' and Mode='Withdrawal Failed'`,
      `select isnull(sum(amount),0) as withdrawal FROM Statementigc where type='Debit' and Userid='${userid}' and Mode='Withdrawal'`,
    ];
    const resp = await Promise.all(stmts.map((stmt) => sql.query(stmt)));
    res.send({
      regDate: resp[0].recordsets[0][0],
      investment: resp[1].recordsets[0][0],
      levelincome: resp[2].recordsets[0][0],
      divedendincome: resp[3].recordsets[0][0],
      roiincome: resp[4].recordsets[0][0],
      withdrawalfailed: resp[5].recordsets[0][0],
      withdrawal: resp[6].recordsets[0][0],
    });
  } catch (e) {
    console.log(e.message);
  }
});

app.get("/api/todaybussiness/:userid", async (req, res) => {
  var userid = req.params.userid;
  var request = new sql.Request();

  await queryDb("[sp_getbusinesstodayuser]'" + userid + "'")
    .then((result) => {
      obj.todaybussiness = result;
    })
    .catch((err) => {
      pool.close;
      sql.close;
      obj.todaybussiness = err;
    });
  res.send(obj);
});
////total bussiness
app.get("/api/totalbussiness/:userid", async (req, res) => {
  var userid = req.params.userid;
  var request = new sql.Request();

  await queryDb("[sp_getbusinesstotaluser]'" + userid + "'")
    .then((result) => {
      obj.totalbussiness = result;
    })
    .catch((err) => {
      pool.close;
      sql.close;
      obj.totalbussiness = err;
    });
  res.send(obj);
});

////today income
app.get("/api/todayincome/:userid", async (req, res) => {
  var userid = req.params.userid;
  var request = new sql.Request();

  await queryDb("[sp_Today_Income]'" + userid + "'")
    .then((result) => {
      obj.todayincome = result;
    })
    .catch((err) => {
      pool.close;
      sql.close;
      obj.todayincome = err;
    });
  res.send(obj);
});

////Statement
app.get("/api/statement/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_Transaction]'${userid}'`);
    obj.statement = data["recordsets"];
    res.send({ statement: data["recordsets"] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.statement = err;
  }
});

/////Divedend Income Statement
app.get("/api/divedendincome/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_DirectIncome]'${userid}'`);
    obj.Divedendincome = data["recordsets"];
    res.send({ Divedendincome: data["recordsets"] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.Divedendincome = err;
  }
});

/////Level income
app.get("/api/levelincome/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_LevelIncome]'${userid}'`);
    obj.levelincome = data["recordsets"];
    res.send({ levelincome: data["recordsets"] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.levelincome = err;
  }
});

//////Roi Income
app.get("/api/roiincome/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_Get_Team]'${userid}'`);
    obj.roiincome = data["recordsets"];
    res.send({ roiincome: data["recordsets"] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.roiincome = err;
  }
});

////All Team
app.get("/api/Team/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_Get_Team]'${userid}'`);
    res.send({ allTeam: data["recordsets"][0] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.allTeam = err;
  }
});

////Direct Team
app.get("/api/DirectTeam/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_DirectTeam]'${userid}'`);
    obj.directTeam = data["recordsets"];
    res.send({ directTeam: data["recordsets"] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.directTeam = err;
  }
});

////Bussiness Chart
app.get("/api/Bussinesschart/:userid", async (req, res) => {
  try {
    req.setTimeout(25000);
    const userid = req.params.userid;
    const request = new sql.Request();
    const data = await queryDb(`[sp_Get_TeamReport]'${userid}'`);
    obj.Bussinesschart = data["recordsets"];
    res.send({ businessChart: data["recordsets"] });
  } catch (e) {
    console.log(e.message);
    pool.close;
    sql.close;
    obj.businessChart = err;
  }
});
