const mysql = require("mysql2/promise");
(async () => {
  try {
    const c = await mysql.createConnection({
      host: "172.17.0.63",
      user: "root",
      password: "1234",
      database: "react_ud",
    });
    await c.execute("DELETE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE LIKE ?", [
      "UT15_%",
    ]);
    await c.execute(
      `INSERT INTO HDOC_SEND_DATA_VIN_PLATE 
       (SERIE, CHNR, TYPE, STATUS, MSG, REGISTER_DATETIME, DOC_READY, DOC_SENT,
        REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, '1', '2', '', NOW(), NOW(), NOW(), ?, ?, NOW(), ?, ?)`,
      ["UT15_JPC", "T013945", "PW", "PW", "PW", "PW"],
    );
    console.log("Insert OK");
    const [rows] = await c.execute(
      "SELECT SERIE, CHNR FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE LIKE ?",
      ["UT15_%"],
    );
    if (rows.length > 0) {
      console.log("Found:", rows.length, JSON.stringify(rows));
    } else {
      console.log("Found: 0 records - checking column details...");
      const [cols] = await c.query({
        sql: "SHOW COLUMNS FROM HDOC_SEND_DATA_VIN_PLATE",
      });
      cols.forEach(function (col) {
        if (["SERIE", "CHNR", "TYPE", "STATUS"].includes(col.Field)) {
          console.log(col.Field, col.Type);
        }
      });
    }
    await c.end();
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
