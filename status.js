"use strict"

const { exec } = require("child_process")
const sshExec = require("ssh-exec")
const fs = require("fs")
const vrouterIP = "192.168.64.1"
let wifiIP = ""

const options = {
  user: "root",
  host: "192.168.64.1",
  key: fs.readFileSync("/Users/simon/.ssh/id_rsa"),
}

function getDns() {
  return new Promise((resolve, reject) => {
    exec("networksetup -getdnsservers wi-fi", (err, stdout, stderr) => {
      if (err || stderr) {
        reject("can not get current dns")
      } else {
        resolve(stdout)
      }
    })
  })
}

function getDefaultRoute() {
  return new Promise((resolve, reject) => {
    exec("netstat -nr | grep default", (err, stdout, stderr) => {
      if (err || stderr) {
        reject("can not get current gateway")
      } else {
        resolve(stdout.trim().split(/\s+/)[1])
      }
    })
  })
}

function getRouter() {
  return new Promise((resolve, reject) => {
    exec("networksetup -getinfo Wi-Fi | grep Router", (err, stdout, stderr) => {
      if (err || stderr) {
        reject("can not get wifi router info")
      } else {
        wifiIP = stdout.trim().split(/:\s+/)[1]
        resolve(wifiIP)
      }
    })
  })
}

function checkCurrentTraffic() {

  let currentGateway = ""
  getDns()
    .then(message => document.getElementById("dns").innerHTML = message)
  getDefaultRoute()
    .then((message) => {
      currentGateway = message
      document.getElementById("gateway").innerHTML = message
    })
    .then(getRouter)
    .then((routerip) => {
      const wifiInfo = "all network traffic route to wifi router derectly."
      const route2vrouter = "route all traffic to vrouter"
      const vrouterInfo = "VRouter is taking over all network traffic."
      const route2wifi = "route all traffic to wifi"
      let info = "err when detecting Wifi Router's IP"
      let btn = "error"
      const btnElement = document.getElementById("btn-route")
      if (routerip === currentGateway) {
        info = wifiInfo
        btn = route2vrouter
        btnElement.classList.remove("red")
        btnElement.classList.add("wifi", "blue")
      } else {
        info = vrouterInfo
        btn = route2wifi
        btnElement.classList.remove("wifi", "blue")
        btnElement.classList.add("red")

      }
      // TODO: add a pictrue
      document.getElementById("current-traffic").innerHTML = info
      btnElement.innerHTML = btn
    })
}

function changeGateway(ip) {
  return new Promise((resolve, reject) => {
    exec(`sudo route change default ${ip}`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("error when change default route")
      } else {
        resolve(ip)
      }
    })
  })
}

function changeDns(ip) {
  return new Promise((resolve, reject) => {
    exec(`sudo networksetup -setdnsservers Wi-Fi ${ip}`, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("error when change dns")
      } else {
        resolve(ip)
      }
    })
  })
}

function toggleTraffic() {
  let ip = ""
  const btnRoute = document.getElementById("btn-route")
  if (btnRoute.classList.contains("wifi")) {
    ip = vrouterIP
  } else {
    ip = wifiIP
  }
  changeGateway(ip).then(changeDns).then(checkCurrentTraffic)
}

function checkBrlan() {
  return new Promise((resolve, reject) => {
    sshExec("ifconfig br-lan | grep 'inet addr' | cut -d: -f2 | cut -d' ' -f1", options, (err, stdout, stderr) => {
      if (stderr) {
        console.log(stderr)
        reject("error when get br-lan info")
      }
      resolve(stdout)
    })
  })
}

function getEth() {
  return new Promise((resolve, reject) => {
    sshExec("ifconfig eth1 | grep 'inet addr' | cut -d: -f2 | cut -d' ' -f1", options, (err, stdout, stderr) => {
      if (stderr) {
        reject("can not get eth info")
      } else {
        resolve(stdout)
      }
    })
  })
}

function getKcptun() {
  return new Promise((resolve, reject) => {
    sshExec("kcptun --version | cut -d' ' -f3", options, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("error when get kcptun version")
      } else {
        resolve(stdout)
      }
    })
  })
}

function getShadowsocks() {
  return new Promise((resolve, reject) => {
    sshExec("ss-redir -h | grep 'shadowsocks-libev' | cut -d' ' -f2", options, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("error when get shadowsocks version")
      } else {
        resolve(stdout)
      }
    })
  })
}

function getOpenwrt() {
  return new Promise((resolve, reject) => {
    sshExec("cat /etc/banner | grep '(.*)'", options, (err, stdout, stderr) => {
      if (err || stderr) {
        reject("error then get openwrt version")
      } else {
        resolve(stdout)
      }
    })
  })
}

document.addEventListener("DOMContentLoaded", () => {
  checkCurrentTraffic()

  document.getElementById("btn-route").addEventListener("click", () => {
    toggleTraffic()
  })

  checkBrlan().then(message => document.getElementById("br-ip").innerHTML = message)

  getEth().then(message => document.getElementById("eth-ip").innerHTML = message)

  getKcptun().then(message => document.getElementById("kt-version").innerHTML = message)

  getShadowsocks().then(message => document.getElementById("ss-version").innerHTML = message)

  getOpenwrt().then(message => document.getElementById("openwrt-version").innerHTML = message)

})
