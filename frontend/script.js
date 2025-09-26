let locais = [];
let userLocation = null;
let map = L.map('map').setView([-22.5645, -47.4012], 13);

// Camada do mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = L.layerGroup().addTo(map);
let routingControl = null;

// Mostrar a localização do usuário
map.locate({setView: true, maxZoom: 16});

function onLocationFound(e) {
    userLocation = e.latlng;
    const radius = e.accuracy / 2;

    L.marker(e.latlng, {icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/487/487021.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    })}).addTo(map)
      .bindPopup("Você está aqui").openPopup();

    L.circle(e.latlng, radius).addTo(map);

    // Atualiza mapa e cards agora que temos a posição
    atualizarMapa();
    atualizarCards();
}

function onLocationError(e) {
    alert("Não foi possível obter a localização: " + e.message);
}

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Buscar locais da API
fetch('http://127.0.0.1:5000/locais')
    .then(res => res.json())
    .then(data => {
        locais = data;
        populaFiltro();
        atualizarMapa();
        atualizarCards();
    })
    .catch(err => console.error(err));

// Popula o filtro com os tipos únicos
function populaFiltro() {
    const select = document.getElementById('filtroTipo');
    const tipos = [...new Set(locais.map(l => l.tipo))];
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        atualizarMapa();
        atualizarCards();
    });
}

// Função para calcular distância entre dois pontos (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371e3; // metros
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // metros
}

// Função para definir cor do marcador baseado na segurança
function corSeguranca(seg) {
    if(seg <= 2) return 'red';
    if(seg === 3) return 'orange';
    return 'green';
}

// Atualiza os marcadores no mapa
function atualizarMapa() {
    markers.clearLayers();
    const tipoSelecionado = document.getElementById('filtroTipo').value;

    locais.filter(l => tipoSelecionado === 'todos' || l.tipo === tipoSelecionado)
        .forEach(local => {
            let popupContent = `
                <b>${local.nome}</b><br>
                Tipo: ${local.tipo}<br>
                Endereço: ${local.endereco || '-'}<br>
                Infraestrutura: ${local.infraestrutura || '-'}<br>
                Acessibilidade: ${local.acessibilidade || '-'}<br>
                Segurança: ${'⭐'.repeat(local.seguranca)}<br>
                Conservação: ${local.conservacao || '-'}
            `;
            if(userLocation){
                const dist = calcularDistancia(userLocation.lat, userLocation.lng, local.latitude, local.longitude);
                popupContent += `<br>Distância: ${dist.toFixed(0)} m`;
            }

            const marker = L.circleMarker([local.latitude, local.longitude], {
                radius: 8,
                fillColor: corSeguranca(local.seguranca),
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(popupContent);

            // Adiciona evento para traçar rota quando clicar no marcador
            marker.on('click', () => {
                if(userLocation){
                    if(routingControl) map.removeControl(routingControl);
                    routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(userLocation.lat, userLocation.lng),
                            L.latLng(local.latitude, local.longitude)
                        ],
                        routeWhileDragging: false
                    }).addTo(map);
                } else {
                    alert("Não foi possível obter sua localização.");
                }
            });

            markers.addLayer(marker);
        });
}

// Atualiza os cards abaixo do mapa
function atualizarCards() {
    const cardsDiv = document.getElementById('cards');
    cardsDiv.innerHTML = '';
    const tipoSelecionado = document.getElementById('filtroTipo').value;

    // Ordenar por distância se a posição do usuário estiver disponível
    let locaisFiltrados = locais.filter(l => tipoSelecionado === 'todos' || l.tipo === tipoSelecionado);
    if(userLocation){
        locaisFiltrados.sort((a,b) => 
            calcularDistancia(userLocation.lat, userLocation.lng, a.latitude, a.longitude) -
            calcularDistancia(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
        );
    }

    locaisFiltrados.forEach(local => {
        let distancia = '';
        if(userLocation){
            const dist = calcularDistancia(userLocation.lat, userLocation.lng, local.latitude, local.longitude);
            distancia = `<b>Distância:</b> ${dist.toFixed(0)} m<br>`;
        }

        const card = document.createElement('div');
        card.className = 'col-md-4';
        card.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${local.nome}</h5>
                    <p class="card-text">
                        <b>Tipo:</b> ${local.tipo}<br>
                        <b>Endereço:</b> ${local.endereco || '-'}<br>
                        <b>Infraestrutura:</b> ${local.infraestrutura || '-'}<br>
                        <b>Acessibilidade:</b> ${local.acessibilidade || '-'}<br>
                        <b>Segurança:</b> ${'⭐'.repeat(local.seguranca)}<br>
                        <b>Conservação:</b> ${local.conservacao || '-'}<br>
                        ${distancia}
                    </p>
                </div>
            </div>
        `;
        cardsDiv.appendChild(card);
    });
}
