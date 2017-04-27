const exec = require("child_process").exec
const sshExec = require("ssh-exec")
const fs = require("fs")

const options = {
  user: "root",
  host: "192.168.64.1",
  key: fs.readFileSync("/Users/simon/.ssh/id_rsa")
}

document.addEventListener("DOMContentLoaded", () => {

  exec("VBoxManage --version", (err, stdout, stderr) => {
    if (stderr) { console.log(stderr) }
    document.getElementById("vbox-version").innerHTML = stdout
  })

  sshExec("kcptun --version | cut -d' ' -f3", options, (err, stdout, stderr) => {
    if (stderr) { console.log(stderr) }
    document.getElementById("kt-version").innerHTML = stdout
  })

  sshExec("ss-redir -h | grep 'shadowsocks-libev' | cut -d' ' -f2", options, (err, stdout, stderr) => {
    if (stderr) { console.log(stderr) }
    document.getElementById("ss-version").innerHTML = stdout
  })

  sshExec("cat /etc/banner | grep '(.*)'", options, (err, stdout, stderr) => {
    if (stderr) { console.log(stderr) }
    document.getElementById("openwrt-version").innerHTML = stdout.trim()
  })
})
