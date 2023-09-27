// Copyright (c) 2023 Sampleprovider(sp)

let assets = {};
let currentPage = '';

let loading = false;
Array.from(document.getElementById('viewSelect').children).forEach(e => {
    e.onclick = function () {
        if (loading) return;
        loading = true;
        currentPage = e.getAttribute('selectpane');
        document.getElementById('mainView').style.filter = 'blur(4px)';
        document.getElementById('mainView').style.transform = 'translate(-8px, -8px)';
        Array.from(document.getElementById('editPanes').children).forEach(n => n.style.display = 'none');
        document.getElementById(currentPage + 'Pane').style.display = '';
        Array.from(document.getElementById('viewSelect').children).forEach(n => {
            n.style.borderTopColor = '';
        });
        e.style.borderTopColor = 'black';
        let filename = currentPage.substring(0, currentPage.length - 1);
        let createTiles = () => {
            document.getElementById('assetList').innerHTML = '';
            let loaded = 0;
            for (let i in assets[currentPage]) {
                const tile = document.createElement('div');
                tile.classList.add('tile')
                const img = new Image();
                img.classList.add('tileImg');
                img.src = `/img/${filename}/${i}.png`;
                img.onload = () => {
                    loaded++;
                    if (assets[currentPage][i].client.rawWidth) {
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            ctx.imageSmoothingEnabled = false;
                            canvas.width = assets[currentPage][i].client.rawWidth;
                            canvas.height = assets[currentPage][i].client.rawHeight;
                            ctx.drawImage(img, 0, 0, assets[currentPage][i].client.rawWidth, assets[currentPage][i].client.rawHeight, 0, 0, assets[currentPage][i].client.rawWidth, assets[currentPage][i].client.rawHeight);
                            img.src = canvas.toDataURL('image/png');
                            img.onload = () => { };
                        } catch (err) {
                            console.error(err);
                        }
                    }
                };
                let ratio = Math.min(32 / (assets[currentPage][i].client.height ?? 32), 64 / (assets[currentPage][i].client.width ?? 32));
                img.style.width = (assets[currentPage][i].client.width ?? 32) * ratio + 'px';
                img.style.height = (assets[currentPage][i].client.height ?? 32) * ratio + 'px';
                tile.appendChild(img);
                const label = document.createElement('div');
                label.classList.add('tileLabel');
                label.innerText = assets[currentPage][i].client.name ?? i.charAt(0).toUpperCase() + i.substring(1);
                tile.appendChild(label);
                document.getElementById('assetList').appendChild(tile);
            }
            let length = 0;
            for (let i in assets[currentPage]) length++;
            let wait = setInterval(() => {
                if (loaded >= length) {
                    clearInterval(wait);
                    document.getElementById('mainView').style.filter = '';
                    document.getElementById('mainView').style.transform = '';
                    loading = false;
                }
            }, 10);
        };
        if (assets[currentPage] == null) {
            let request = new XMLHttpRequest();
            request.open('GET', `/${filename}.json`);
            request.onload = function () {
                if (this.status >= 200 && this.status < 400) {
                    const json = JSON.parse(this.response);
                    assets[currentPage] = {};
                    for (let i in json) {
                        assets[currentPage][i] = {
                            client: json[i],
                            server: null
                        };
                    }
                    let request2 = new XMLHttpRequest();
                    request2.open('GET', `/../server/${filename}.json`);
                    request2.onload = function () {
                        if (this.status >= 200 && this.status < 400) {
                            const json = JSON.parse(this.response);
                            for (let i in json) {
                                assets[currentPage][i].server = json[i];
                            }
                            createTiles();
                        } else {
                            console.error(`Server returned status ${this.status}. (${filename}.json)`);
                        }
                    }
                    request2.send();
                } else {
                    console.error(`Server returned status ${this.status}. (${filename}.json)`);
                }
            };
            request.send();
        } else {
            createTiles();
        }
    };
});
document.getElementById('viewSelect').children[0].onclick();

document.getElementById('uploadAssets').onclick = (e) => {
    loading = true;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.click();
    input.oninput = () => {
        const files = input.files;
        if (files.length == 0) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const json = JSON.parse(e.target.result);
            for (let i in json) {
                assets[currentPage][i] = {
                    client: json[i],
                    server: null
                };
            }
        };
        reader.readAsText(files[0]);
    };
}
document.getElementById('downloadAssets').onclick = (e) => {
    loading = true;
    const serverFile = document.createElement('a');
    const clientFile = document.createElement('a');
    const serverData = {};
    const clientData = {};
    for (let i in assets[currentPage]) {
        serverData[i] = assets[currentPage][i].server;
        clientData[i] = assets[currentPage][i].client;
    }
    serverFile.href = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(serverData, null, 4));
    clientFile.href = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(clientData, null, 4));
    serverFile.target = '_parent';
    clientFile.target = '_parent';
    let filename = currentPage.substring(0, currentPage.length - 1);
    serverFile.download = `${filename}-server${Math.round(Math.random() * 1000)}.json`;
    clientFile.download = `${filename}-client${Math.round(Math.random() * 1000)}.json`;
    serverFile.click();
    clientFile.click();
    loading = false;
};

// const logoCanvas = document.createElement('canvas');
// const lctx = logoCanvas.getContext('2d');
// logoCanvas.width = 500;
// logoCanvas.height = 500;
// let backGradient = lctx.createLinearGradient(167, 0, 333, 500);
// backGradient.addColorStop(0, '#3C70FF');
// backGradient.addColorStop(1, '#102F80');
// lctx.fillStyle = backGradient;
// lctx.fillRect(0, 0, 500, 500);
// lctx.textBaseline = 'top';
// lctx.textAlign = 'left';
// lctx.rotate(-0.15);
// lctx.fillStyle = '#FFFFFF7F';
// lctx.font = 'bold 260px Lucida Console';
// lctx.fillText('SP', -20, 190);
// lctx.rotate(0.02);
// lctx.font = 'bold 160px Lucida Console';
// lctx.fillText('2', 310, 150);
// lctx.rotate(-0.02);
// lctx.shadowBlur = 10;
// lctx.shadowColor = '#FFFFFFC0';
// lctx.fillStyle = '#FFFFFF';
// lctx.font = 'bold 260px Lucida Console';
// lctx.fillText('SP', -10, 180);
// lctx.rotate(0.02);
// lctx.font = 'bold 160px Lucida Console';
// lctx.fillText('2', 320, 140);
// logoCanvas.style.position = 'absolute';
// logoCanvas.style.top = '0px';
// logoCanvas.style.left = '0px';
// logoCanvas.style.zIndex = 10000;
// document.body.appendChild(logoCanvas);