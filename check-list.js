"use strict"

const { exec } = require("child_process")

const vmName = "openwrt64"
const userName = "root"
const hostonlyip = "192.168.64.2"
const openwrtip = "192.168.64.1"
const errors = {
  "VBoxManage --version": "vbox",
  "VBoxManage list vms": "vms",
  "VBoxManage list runningvms": "runingvms",
}
const rsa = "/Users/simon/.ssh/id_rsa"

function updateCheckList(headerText, descriptionText) {
  const item = document.createElement("div")
  item.classList.add("item")
  const icon = document.createElement("i")
  icon.classList.add("right", "triangle", "icon")
  const content = document.createElement("div")
  content.classList.add("content")
  const header = document.createElement("div")
  header.classList.add("header")
  header.innerHTML = headerText
  const description = document.createElement("div")
  description.classList.add("description")
  description.innerHTML = descriptionText

  content.appendChild(header)
  content.appendChild(description)
  item.appendChild(icon)
  item.appendChild(content)

  const checkList = document.getElementById("check-list")
  checkList.appendChild(item)
}

function checkLogin() {
  return new Promise((resolve, reject) => {
    exec(`ssh -o ConnectTimeout=1 -i ${rsa} ${userName}@${openwrtip}  "echo login"`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("login")
      } else {
        resolve(true)
      }
    })
  })
}

function checkVbox() {
  return new Promise((resolve, reject) => {
    exec("VBoxManage --version", (err, stdout, stderr) => {
      if (err || stderr) {
        reject("vbox")
      } else {
        resolve(stdout)
      }
    })
  })
}

function checkVmStatus() {
  return new Promise((resolve, reject) => {
    exec(`VBoxManage showvminfo ${vmName} | grep State`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("vm")
      } else if (stdout.indexOf("running") < 0) {
        reject("vmstatus")
      } else {
        resolve(stdout)
      }
    })
  })
}

function checkInterface() {
  return new Promise((resolve, reject) => {
    exec("ifconfig | grep vboxnet", (err, stdout, stderr) => {
      if (err || stderr) {
        reject("vboxnet")
      } else {
        resolve(stdout)
      }
    })
  })
}

function checkIp(hostonlyIfs) {
  for (let i = 0, len = hostonlyIfs.length; i < len; i += 1) {
    const [interf, config] = hostonlyIfs[i].split(":")
    if (config.indexOf(hostonlyip)) {
      return interf
    }
  }
  throw Error("vboxnetip")
}

async function checkRequirement() {
  const vboxVersion = await checkVbox()
  updateCheckList("VirtualBox installed", vboxVersion)

  const vmStatus = await checkVmStatus()
  updateCheckList("Virtual openwrt status", `${vmStatus.match(/State:\s+(.*)/)[1]}`)

  const hostonlyIfs = (await checkInterface()).trim().split("\n")
  updateCheckList("Check Hostonly interface", `${hostonlyIfs.map(item => item.split(":")[0])}`)

  const inf = checkIp(hostonlyIfs)
  updateCheckList("Check Hostonly interface's IP Address", `${inf}: ${hostonlyip}`)

  await checkLogin()
  updateCheckList("Test logining to virtual openwrt.", "Sucess")

  setTimeout(() => window.location.replace("manage.html"), 1500)
}

function check() {
  checkRequirement()
    .then(() => {
      console.log("check finish")
    })
    .catch((err) => {
      console.log("catch error when running checkRequirement")
      document.getElementById("btn-recheck").style.visibility = "visible"
      switch (err) {
      case "vbox":
        updateCheckList("No VBoxManage command detected.", "Please check your VirtualBox's installation.")
        break
      case "vm":
        updateCheckList("No virtual openwrt detected.", "maybe you should re-importe again")
        break
      case "vmstatus":
        updateCheckList("Virtual openwrt didn't running.", "restart it")
        break
      case "vboxnet":
        updateCheckList("No Hostonly Interface detected.", "TODO: new one")
        break
      case "vboxnetip":
        updateCheckList(`No Hostonly Interface with ${hostonlyip} detected.`, "TODO: config one")
        break
      case "login":
        updateCheckList("Test login to virtual openwrt", "fail")
        break
      default:
        updateCheckList("Unknow error", err)
      }
    })
}
check()

document.getElementById("btn-recheck").addEventListener("click", () => {
  const checkList = document.getElementById("check-list")
  while (checkList.firstChild) {
    checkList.removeChild(checkList.firstChild)
  }
  check()
})
