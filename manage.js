/* eslint global:"$" */
"use strict"

const { exec } = require("child_process")
const sshExec = require("ssh-exec")
const fs = require("fs")
const config = require("./config/config.js")
const vrouterIP = "192.168.64.1"
let wifiIP = ""
let intervals = []

const options = {
  user: "root",
  host: "192.168.64.1",
  key: fs.readFileSync("/Users/simon/.ssh/id_rsa"),
}

//TODO: mem leak

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
      const toggle = document.getElementById("toggle-gateway")
      const icon = document.getElementById("toggle-gateway-icon")
      const demoDiv = document.getElementById("demo")
      if (routerip === currentGateway) {
        toggle.dataset.content = "开始接管网络流量."
        icon.classList.remove("pause")
        icon.classList.add("play")
        demoDiv.classList.remove("positive")
        demoDiv.classList.add("negative")
        toggleBlink(false)
      } else {
        toggle.dataset.content = "停止接管网络流量, 但不关闭虚拟机."
        icon.classList.remove("play")
        icon.classList.add("pause")
        // intervals = [...blinkIcon()]
        demoDiv.classList.add("positive")
        demoDiv.classList.remove("negative")
        toggleBlink(true)
      }
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
  const icon = document.getElementById("toggle-gateway-icon")
  if (icon.classList.contains("play")) {
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

function toggleBlink(arg) {
  const exchangeIcons = document.getElementsByClassName("ui exchange icon")
  if (arg) {
    ;[...exchangeIcons].forEach((icon) => {
      let interval = setInterval(() => {
        setTimeout(() => {
          $(icon).transition("pulse")
          icon.classList.toggle("green")
        }, Math.random() * 2000)
      }, 2000)
      intervals.push(interval)
    })
  } else {
    intervals.forEach(interval => clearInterval(interval))
    intervals = []
    setTimeout(() => {
      ;[...exchangeIcons].forEach((icon) => {
        if (icon.classList.contains("green")) {
          icon.classList.remove("green")
        }
      })
    }, 2000)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkCurrentTraffic()
  // blinkIcon()

  document.getElementById("toggle-gateway").addEventListener("click", () => {
    toggleTraffic()
  })

  checkBrlan().then(message => document.getElementById("br-ip").innerHTML = message)

  getEth().then(message => document.getElementById("eth-ip").innerHTML = message)

  getKcptun().then(message => document.getElementById("kt-version").innerHTML = message)

  getShadowsocks().then(message => document.getElementById("ss-version").innerHTML = message)

  getOpenwrt().then(message => document.getElementById("openwrt-version").innerHTML = message)

  $(".tabular.menu .item").tab()
  $("select.dropdown").dropdown()
  $(".ui.button").popup()
})
