const exec = require("ssh-exec")
const fs = require("fs")

const option = {
  user: "root",
  host: "192.168.64.1",
  key: fs.readFileSync("/Users/simon/.ssh/id_rsa")
}

// let ov = exec("cat /etc/banner| grep '(.*)'", option).pipe(process.stdout)
let ov = exec("cat /etc/bannerx| grep '(.*)'", option, (err, stdout, stderr) => {
  if (stderr) { console.log("stderr") }
  console.log(stdout.trim())
})
let kv = exec("kcptun --version | cut -d ' ' -f 3", option).pipe(process.stdout)
let sv = exec("ss-redir -h | grep 'shadowsocks-libev' | cut -d ' ' -f 2", option).pipe(process.stdout)

// console.log(sv)
//
exec("pgrep kcptun", option, (err, stdout, stderr) => {
  if (stderr) { 
    console.log("kcptun stopped.") 
  } else {
    console.log("kcptun is running.")
  }
})
