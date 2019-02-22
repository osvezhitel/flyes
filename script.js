function getJsonAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url);

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject("Не получилось загрузить");
            }
        }

        xhr.onerror = () => {
            reject("Не получилось загрузить");
        };

        xhr.send();
    });
}

function selfRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseFly(json) {

    let flyesJson = JSON.parse(json);
    delete flyesJson.full_count;
    delete flyesJson.version;

    let allVoyage = [];

    for (key in flyesJson) {

        let flyItem = flyesJson[key];
        /*https://www.fundamental-research.ru/ru/article/view?id=38773* Обозначения. На самом деле json совсем непонятный. Например высота в футах, а скорость в узлах. Без описания мог бы очень долго гадать*/
        let [planeId, latitude, longitude, degree, height, speed, squawkCode, radarId, planeModel, baseId, transponderUtc, from, to, ...something] = flyItem;

        speedKm = Math.round(speed * 1.852);
        heightMeters = Math.round(height * 0.3);

        /* Функцию вычисления расстояния нашел в интернете*/
        let lat2 = 55.410307
        let lon2 = 37.902451
        
        function distance(latitude, longitude, lat2, lon2) {
            let p = 0.017453292519943295; // Math.PI / 180
            let c = Math.cos;
            let a = 0.5 - c((lat2 - latitude) * p) / 2 +
                c(latitude * p) * c(lat2 * p) *
                (1 - c((lon2 - longitude) * p)) / 2;
            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km  Радиус Земли           
        }

        planeDistance = distance(latitude, longitude, lat2, lon2);
        planeDistance = Math.round(planeDistance);

        /*Добавим параметр близости к точке и выкинем всё лишнее */
        allVoyage.push({
            planeDistance: planeDistance,
            position: latitude + ' - ' + longitude,
            speed: speedKm,
            degree: degree,
            height: heightMeters,
            fromTo: from + ' - ' + to,
            baseId: baseId,
        });
    }

    let sortDistance = allVoyage.slice(0);
    sortDistance.sort(function (a, b) {
        return b.planeDistance - a.planeDistance;
    });
    return sortDistance;    
}

function createBlocks(sortDistance) {
    let displayDiv = document.getElementById("displayDiv");
    displayDiv.innerHTML = "";

    for (key in sortDistance) {
        let divitem = document.createElement('div');
        divitem.className = 'plane';
        divitem.innerHTML =
            '<div class="plane__inner"><div>Координаты самолета: </div><div>' + sortDistance[key].position + '</div></div>' +
            '<div class="plane__inner"><div>Скорость в км/ч: </div><div>' + sortDistance[key].speed + '</div></div>' +
            '<div class="plane__inner"><div>Курс в градусах: </div><div>' + sortDistance[key].degree + '</div></div>' +
            '<div class="plane__inner"><div>Высота полета самолета в метрах: </div><div>' + sortDistance[key].height + '</div></div>' +
            '<div class="plane__inner"><div>коды аэропортов вылета и назначения: </div><div>' + sortDistance[key].fromTo + '</div></div>' +
            '<div class="plane__inner"><div>Номер рейса: </div><div>' + sortDistance[key].baseId + '</div></div>';
        displayDiv.appendChild(divitem);
    };
}

function getDataRender(urlString) {
    getJsonAsync(urlString).then(json => {

        createBlocks(parseFly(json));
        //console.log("is work");
        //console.log(parseFly(json));

    }).catch(error => {
        displayDiv.innerHTML = error;
    });
}

let urlApi = 'https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48';

getDataRender(urlApi);

setInterval(function () {
    getDataRender(urlApi);
}, selfRandom(3000, 5000));
