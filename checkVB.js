const exec = require("child_process").exec
const url = require("url")
const path = require("path")

function checkVB() {
  exec("VBoxManage --version", (err, stdout, stderr) => {
    if (stderr) {
      return
    } else {
      window.location.replace(url.format({
        pathname: path.join(__dirname, "status.html"),
        protocol: "file",
        slashes: true
      }))
    }
  })
}

document.getElementById("btn-installed").addEventListener("click", checkVB)
