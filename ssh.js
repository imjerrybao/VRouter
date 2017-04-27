const Client = require("ssh2").Client

var conn = new Client()

conn.on("ready", () => {
  conn.exec("kcptun --version; kcptun --version", (err, stream) => {
    stream.on("close", (code, signal) => {
      conn.end()
    }).on("data", (data) => {
      console.log(data.toString("utf8"))
    }).stderr.on("data", (data) => {
      console.log(data)
    })
  })
}).connect({
  host: "192.168.64.1",
  port: 22,
  username: "root",
  privateKey: require("fs").readFileSync("/Users/simon/.ssh/id_rsa")
})
