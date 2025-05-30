// ==UserScript==
// @name         ATCAddon for GEOFS
// @namespace    http://tampermonkey.net/
// @version      2024-02-13
// @description  try to take over the world!
// @author       ThePlaneGuy45
// @match        https://www.geo-fs.com/pages/map.php
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license MIT
// ==/UserScript==

// initialize some global variables
window.ATCADDON = {chat:[]};

// hacky sleep function
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

// hacky element creation function
function toElement(string) {
    var div = document.createElement('div');
    div.innerHTML = string.trim();
    return div.firstChild;
}

async function updateATC() {


    // date packet was sent
    multiplayer.lastRequestTime = Date.now();

    // generic packet sent to geofs update (basically creates a "player" out in the middle of nowhere)
    var player_packet = {
        acid: geofs.userRecord.id,
        sid: geofs.userRecord.sessionId,
        id: multiplayer.myId,
        ac: 1,
        co: [33.936952715460784,-118.38498159830658,45.20037842951751,141.2313037411972,-15,0], // random coordinates
        ve: [0,0,0,0,0,0],
        st: {gr: true, as: 0},
        ti: multiplayer.getServerTime(),
        m: multiplayer.chatMessage,
        ci: multiplayer.chatMessageId
    };
    multiplayer.chatMessage && (multiplayer.chatMessage = "");

    // send packet to geofs's server
    multiplayer.lastRequest = await geofs.ajax.post(geofs.multiplayerHost + "/update", player_packet, multiplayer.updateCallback, multiplayer.errorCallback)

    // add it to internal chat
    window.ATCADDON.chat = [...ATCADDON.chat, ...multiplayer.lastRequest.chatMessages];

    // add it to visible chat (raw DOM is best DOM)
    multiplayer.lastRequest.chatMessages.forEach(e => {
        const box = document.getElementById("atc-box");
        var checkmsg = decodeURIComponent(e.msg).match(/(?<=\[)(?:1[1-3]\d\.\d{1,3})(?=\])/);
        if(e.acid == geofs.userRecord.id){
            box.insertAdjacentElement("afterbegin", toElement('<div class="chat-msg-self" style="color: #06F;">'+`<b>${
                decodeURIComponent(e.cs)
            }:</b> ${
                decodeURIComponent(e.msg).replace(/(?:\[1[1-3]\d\.\d{1,3}\])/g, "")
            }`+'<br></div>'));
        } else if(checkmsg && checkmsg[0]==window.ATCADDON.frequency) {
            box.insertAdjacentElement("afterbegin", toElement('<div class="chat-msg-self" style="color: #F70;">'+`<b>${
                decodeURIComponent(e.cs)
            }:</b> ${
                decodeURIComponent(e.msg).replace(/(?:\[1[1-3]\d\.\d{1,3}\])/g, "")
            }`+'<br></div>'));
        } else if(e.acid !=898455 /*&& (document.querySelector("#atc-only").checked)==false*/) { // unused feature here
            box.insertAdjacentElement("afterbegin", toElement('<div class="chat-msg-other">'+`<b>${
                decodeURIComponent(e.cs)
            }:</b> ${
                decodeURIComponent(e.msg).replace(/(?:\[1[1-3]\d\.\d{1,3}\])/g, "")
            }`+'<br></div>'));
        }
    });
}

// run query function once per second (slowest I could go and still get it to work sorry geofs)
async function runUpdates() {
    while(true) {
        await updateATC();
        await sleep(1000);
    }
}

// initialize all added page elements
// again raw DOM best DOM
function initATCADDON() {
    geofs.map.toggleATCMode();
    const ATCBox = document.createElement("div");
    const ATCForm = document.createElement("form");
    const ATCInput = document.createElement("input");
    const ATCFreq = document.createElement("input");
    const ATCOnly = document.createElement("div");
    ATCBox.setAttribute("id","atc-box");
    ATCBox.setAttribute("style", `
        position: absolute;
        top: 170px;
        left: 10px;
        z-index: 1000;
        font-weight: normal;
        overflow: hidden;
        text-align: left;
        color: #DDD;
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 0px 0px;
        padding-left: 5px;
        line-height: 29px;
        background-color: #0000007F;
        border: 1px solid rgb(169, 187, 223);
        width: 40%;
        height: 75%;
        box-shadow: 4px 4px 4px ##2e2d2d;
    `);
    ATCForm.setAttribute("id","atc-form");
    ATCInput.setAttribute("id","atc-input");
    ATCInput.setAttribute("style", `
        position: absolute;
        top: 130px;
        left: 10px;
        z-index: 1000;
        font-weight: bold;
        overflow: hidden;
        text-align: left;
        color: #DDD;
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 0px 0px;
        padding-left: 5px;
        line-height: 29px;
        background-color: #0000007F;
        border: 1px solid rgb(169, 187, 223);
        width: 40%;
        height: 30px;
        box-shadow: 0px 5px 30px #666;
    `);
    ATCInput.setAttribute("placeholder", "Send Message...");
    ATCFreq.setAttribute("id","atc-frequency");
    ATCFreq.setAttribute("style", `
        position: absolute;
        top: 90px;
        left: 10px; 
        z-index: 1000;
        font-weight: bold;
        overflow: hidden;
        text-align: left;
        color: #DDD;
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 0px 0px;
        padding-left: 5px;
        line-height: 29px;
        background-color: #0000007F;
        border: 1px solid rgb(169, 187, 223);
        width: 15%;
        height: 30px;
        box-shadow: 0px 5px 30px #666;
    `);
    ATCFreq.setAttribute("placeholder", "Frequency");
    ATCFreq.setAttribute("type", "number");
    ATCFreq.setAttribute("min", "118");
    ATCFreq.setAttribute("max", "137");
    ATCFreq.setAttribute("step", "0.001");
    ATCOnly.setAttribute("style", `
        position: absolute;
        top: 90px;
        left: 10px;
        z-index: 1000;
        font-weight: bold;
        overflow: hidden;
        text-align: left;
        color: #DDD;
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 0px 0px;
        line-height: 29px;
        background-color: #0000007F;
        border: 1px solid rgb(169, 187, 223);
        width: 30px;
        height: 30px;
        box-shadow: 0px 5px 30px #666;
    `);
    ATCOnly.innerHTML = `<input id="atc-only" type="checkbox" style="width:75%;height:75%;position:relative;">`;
    ATCForm.appendChild(ATCInput);
    document.body.appendChild(ATCBox);
    document.body.appendChild(ATCForm);
    document.body.appendChild(ATCFreq);
    // document.body.appendChild(ATCOnly);
    // this is a beta feature that allows you to only see people that include a frequency in their message
    // but nobody uses it right now so I won't add it
    // frequency messages are still highlighted tho
    ATCForm.addEventListener("submit", (e)=>{
        e.preventDefault();
        const input = document.getElementById("atc-input");
        const frequency = document.getElementById("atc-frequency");
        window.ATCADDON.frequency = frequency.value;
        if(window.ATCADDON.frequency && /(?:1[1-3]\d\.\d{1,3})/.test(window.ATCADDON.frequency)) {
            multiplayer.setChatMessage(input.value + ` [${window.ATCADDON.frequency}]`);
        } else {
            multiplayer.setChatMessage(input.value);
        }
        input.value = "";
    });
    runUpdates();
}
initATCADDON();
