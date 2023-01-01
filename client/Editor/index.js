// Copyright (c) 2023 Sampleprovider(sp)

let assets = {};
let currentPage = '';

Array.from(document.getElementById('viewSelect').children).forEach(e => {
    e.onclick = function() {
        document.getElementById('mainView').style.filter = 'blur(4px)';
        document.getElementById('mainView').style.transform = 'translate(-8px, -8px)';
        Array.from(document.getElementById('editPanes').children).forEach(n => n.style.display = 'none');
        document.getElementById(e.getAttribute('selectpane') + 'Pane').style.display = '';
        Array.from(document.getElementById('viewSelect').children).forEach(e2 => {
            e2.style.borderTopColor = '';
        });
        e.style.borderTopColor = 'black';
        currentPage = e.getAttribute('selectpane');
        let filename = currentPage;
        if (currentPage[currentPage.length-1] == 's') filename = currentPage.substring(0, currentPage.length-1);
        let request = new XMLHttpRequest();
        request.open('GET', `/${filename}.json`);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                const json = JSON.parse(this.response);
                assets = {};
                for (let i in json) {
                    assets[i] = {
                        client: json[i],
                        server: null
                    };
                }
                let request2 = new XMLHttpRequest();
                request2.open('GET', `/../server/${filename}.json`);
                request2.onload = function() {
                    if (this.status >= 200 && this.status < 400) {
                        const json = JSON.parse(this.response);
                        for (let i in json) {
                            assets[i].server = json[i];
                        }
                        document.getElementById('assetList').innerHTML = '';
                        let loaded = 0;
                        for (let i in assets) {
                            const tile = document.createElement('div');
                            tile.classList.add('tile')
                            const img = new Image();
                            img.classList.add('tileImg');
                            img.src = `/img/${filename}/${i}.png`;
                            img.onload = () => {
                                loaded++;
                                if (assets[i].client.rawWidth) {
                                    try {
                                        const canvas = document.createElement('canvas');
                                        const ctx = canvas.getContext('2d');
                                        ctx.imageSmoothingEnabled = false;
                                        canvas.width = assets[i].client.rawWidth;
                                        canvas.height = assets[i].client.rawHeight;
                                        ctx.drawImage(img, 0, 0, assets[i].client.rawWidth, assets[i].client.rawHeight, 0, 0, assets[i].client.rawWidth, assets[i].client.rawHeight);
                                        img.src = canvas.toDataURL('image/png');
                                        img.onload = () => {};
                                    } catch (err) {
                                        // nothing
                                    }
                                }
                            };
                            let ratio = Math.min(32/(assets[i].client.height ?? 32), 64/(assets[i].client.width ?? 32));
                            img.style.width = (assets[i].client.width ?? 32)*ratio + 'px';
                            img.style.height = (assets[i].client.height ?? 32)*ratio + 'px';
                            tile.appendChild(img);
                            const label = document.createElement('div');
                            label.classList.add('tileLabel');
                            label.innerText = assets[i].client.name ?? i.charAt(0).toUpperCase() + i.substring(1);
                            tile.appendChild(label);
                            document.getElementById('assetList').appendChild(tile);
                        }
                        let length = 0;
                        for (let i in assets) length++;
                        let wait = setInterval(() => {
                            if (loaded >= length) {
                                clearInterval(wait);
                                document.getElementById('mainView').style.filter = '';
                                document.getElementById('mainView').style.transform = '';
                            }
                        }, 10);
                    } else {
                        console.error(`Status ${this.status}`);
                    }
                }
                request2.send();
            } else {
                console.error(`Status ${this.status}`);
            }
        };
        request.send();
    };
});
document.getElementById('viewSelect').children[0].onclick();