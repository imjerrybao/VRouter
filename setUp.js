const exec = require("child_process").exec
const ip = "192.168.123.4"

function setUpIf(ip) {
  exec("VBoxManage hostonlyif create", (err, stdout, stderr) => {
    console.log(stdout)
    const interface = /vboxnet[0-9]+/.exec(stdout)[0]
    console.log(`interface: ${interface}`)
    exec(`VBoxManage hostonlyif ipconfig ${interface} --ip ${ip}`, (err, stdout, stderr) => {
      console.log(stdout)
    })
  })
}
