const vb = require("virtualbox")

const options = {
  name: "openwrt64",
  cmd: "/bin/touch",
  params: "/root/test.txt"
}

vb.exec(options, (error) => {
  console.log("testing")
})
