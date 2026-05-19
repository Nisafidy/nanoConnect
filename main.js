// main.js - UI avec sous-onglets clients
document.addEventListener('DOMContentLoaded', () => {
    const folderInput = document.getElementById('folderInput');
    const uploadArea = document.getElementById('uploadArea');
    const infoSection = document.getElementById('infoSection');
    const mainTabsContainer = document.getElementById('mainTabsContainer');
    const subTabsContainer = document.getElementById('subTabsContainer');
    const tablesContent = document.getElementById('tablesContent');
    
    let currentData = null;
    let currentMainTab = 'credit';
    let currentClientId = null;
    
    uploadArea.addEventListener('click', () => folderInput.click());
    folderInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        tablesContent.innerHTML = '<div style="text-align:center; padding:30px;">⏳ Analyse en cours...</div>';
        
        try {
            currentData = await DataParser.parseDirectory(files);
            displayInfo(currentData.nrInfo);
            displayMainTabs();
            displaySubTabsAndTable();
        } catch(err) {
            tablesContent.innerHTML = `<div class="error-msg">❌ Erreur parsing: ${err.message}</div>`;
            console.error(err);
        }
    });
    
    function displayInfo(nrInfo) {
        if (!nrInfo.nrNumber) {
            infoSection.style.display = 'block';
            infoSection.innerHTML = `<div class="info-panel"><div class="error-msg">⚠️ Dossier non conforme au format NRXXX_JJMMAA1_JJMMAA2</div></div>`;
            return;
        }
        
        let nbJours = '---';
        if (nrInfo.startDate && nrInfo.endDate) {
            let [sDay, sMonth, sYear] = nrInfo.startDate.split('/');
            let [eDay, eMonth, eYear] = nrInfo.endDate.split('/');
            let d1 = new Date(2000 + parseInt(sYear), parseInt(sMonth)-1, parseInt(sDay));
            let d2 = new Date(2000 + parseInt(eYear), parseInt(eMonth)-1, parseInt(eDay));
            let diff = Math.ceil((d2 - d1) / (1000 * 3600 * 24));
            nbJours = diff > 0 ? diff : 0;
        }
        
        infoSection.style.display = 'block';
        infoSection.innerHTML = `
            <div class="info-panel">
                <h2>🔌 NanoRéseau n°${nrInfo.nrNumber}</h2>
                <div class="info-grid">
                    <div class="info-card"><div class="info-label">Période début</div><div class="info-value">${nrInfo.startDate || '---'}</div></div>
                    <div class="info-card"><div class="info-label">Période fin</div><div class="info-value">${nrInfo.endDate || '---'}</div></div>
                    <div class="info-card"><div class="info-label">Nombre de jours comptés</div><div class="info-value">${nbJours}</div></div>
                </div>
            </div>
        `;
    }
    
    function displayMainTabs() {
        mainTabsContainer.style.display = 'flex';
        mainTabsContainer.innerHTML = `
            <button class="main-tab-btn ${currentMainTab === 'credit' ? 'active' : ''}" data-tab="credit">💰 Crédit</button>
            <button class="main-tab-btn ${currentMainTab === 'energie' ? 'active' : ''}" data-tab="energie">⚡ Énergie</button>
            <button class="main-tab-btn ${currentMainTab === 'tension' ? 'active' : ''}" data-tab="tension">📊 Tension</button>
            <button class="main-tab-btn ${currentMainTab === 'ec' ? 'active' : ''}" data-tab="ec">📋 Événements Client</button>
            <button class="main-tab-btn ${currentMainTab === 'evnr' ? 'active' : ''}" data-tab="evnr">🏭 Événements NR</button>
            <button class="main-tab-btn ${currentMainTab === 'recharge' ? 'active' : ''}" data-tab="recharge">🔋 Recharge</button>
        `;
        
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentMainTab = btn.dataset.tab;
                displayMainTabs();
                displaySubTabsAndTable();
            });
        });
    }
    
    function displaySubTabsAndTable() {
        if (currentMainTab === 'credit') {
            displayCreditSubTabs();
        } else if (currentMainTab === 'energie') {
            displayEnergieSubTabs();
        } else {
            subTabsContainer.style.display = 'none';
            displayTable();
        }
    }
    
    function displayCreditSubTabs() {
        if (!currentData || !currentData.creditData || currentData.creditData.size === 0) {
            subTabsContainer.style.display = 'none';
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucune donnée Crédit trouvée</div>';
            return;
        }
        
        let clients = Array.from(currentData.creditData.keys()).sort((a,b) => a-b);
        if (currentClientId === null || !clients.includes(currentClientId)) {
            currentClientId = clients[0];
        }
        
        subTabsContainer.style.display = 'flex';
        let html = '';
        for (let client of clients) {
            html += `<button class="sub-tab-btn ${currentClientId === client ? 'active' : ''}" data-client="${client}">Client ${client}</button>`;
        }
        subTabsContainer.innerHTML = html;
        
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentClientId = parseInt(btn.dataset.client);
                displayCreditSubTabs();
                displayCreditTable();
            });
        });
        
        displayCreditTable();
    }
    
    function displayCreditTable() {
        let records = currentData.creditData.get(currentClientId);
        if (!records || records.length === 0) {
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucune donnée pour ce client</div>';
            return;
        }
        
        let html = '<div class="table-wrapper">';
        html += '<table><thead><tr><th>Date session</th><th>Heure</th><th>Date mesure</th><th>Valeur Haute</th><th>Valeur Basse</th></tr></thead><tbody>';
        
        for (let record of records) {
            for (let val of record.values) {
                html += `<tr>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td>${val.date}</td>
                    <td class="value-cell">${val.high}</td>
                    <td class="value-cell">${val.low}</td>
                </tr>`;
            }
        }
        
        html += '</tbody></table></div>';
        tablesContent.innerHTML = html;
    }
    
    function displayEnergieSubTabs() {
        if (!currentData || !currentData.energieData || currentData.energieData.size === 0) {
            subTabsContainer.style.display = 'none';
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucune donnée Énergie trouvée</div>';
            return;
        }
        
        let clients = Array.from(currentData.energieData.keys()).sort((a,b) => a-b);
        if (currentClientId === null || !clients.includes(currentClientId)) {
            currentClientId = clients[0];
        }
        
        subTabsContainer.style.display = 'flex';
        let html = '';
        for (let client of clients) {
            html += `<button class="sub-tab-btn ${currentClientId === client ? 'active' : ''}" data-client="${client}">Client ${client}</button>`;
        }
        subTabsContainer.innerHTML = html;
        
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentClientId = parseInt(btn.dataset.client);
                displayEnergieSubTabs();
                displayEnergieTable();
            });
        });
        
        displayEnergieTable();
    }
    
    function displayEnergieTable() {
        let records = currentData.energieData.get(currentClientId);
        if (!records || records.length === 0) {
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucune donnée pour ce client</div>';
            return;
        }
        
        let html = '<div class="table-wrapper">';
        html += '<table><thead><tr><th>Date session</th><th>Heure</th><th>Date mesure</th><th>Valeur Haute</th><th>Valeur Basse</th></tr></thead><tbody>';
        
        for (let record of records) {
            for (let val of record.values) {
                html += `<tr>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td>${val.date}</td>
                    <td class="value-cell">${val.high}</td>
                    <td class="value-cell">${val.low}</td>
                </tr>`;
            }
        }
        
        html += '</tbody></table></div>';
        tablesContent.innerHTML = html;
    }
    
    function displayTable() {
        if (currentMainTab === 'tension') {
            displayTensionTable();
        } else if (currentMainTab === 'ec') {
            displayECTable();
        } else if (currentMainTab === 'evnr') {
            displayEvNRTable();
        } else if (currentMainTab === 'recharge') {
            displayRechargeTable();
        }
    }
    
    function displayTensionTable() {
        let records = currentData.tensionData;
        if (!records || records.length === 0) {
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucune donnée Tension trouvée</div>';
            return;
        }
        
        let html = '<div class="table-wrapper">';
        html += '<table><thead><tr><th>Date session</th><th>Heure</th><th>Date mesure</th><th>Tension <span class="voltage-unit">(V)</span></th><th>Tension <span class="voltage-unit">(mV)</span></th></tr></thead><tbody>';
        
        for (let record of records) {
            for (let val of record.values) {
                html += `<tr>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td>${val.date}</td>
                    <td class="value-cell"><strong>${val.volts}</strong> V</td>
                    <td class="value-cell">${val.mV} mV</td>
                </tr>`;
            }
        }
        
        html += '</tbody></table></div>';
        tablesContent.innerHTML = html;
    }
    
    function displayECTable() {
        if (!currentData.ecData.hasData) {
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucun événement client sur cette période</div>';
            return;
        }
        
        let events = currentData.ecData.events;
        let html = '<div class="table-wrapper">';
        html += '<table><thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>État</th><th>P.Fort</th><th>P.Faible</th></tr></thead><tbody>';
        
        for (let e of events) {
            let etatStr = `Actif:${e.etat.actif} CréditNul:${e.etat.creditNul} EnrÉpuisée:${e.etat.energieEpuisee} Surcharge:${e.etat.surcharge} P.Dép:${e.etat.puissanceDepassee}`;
            html += `<tr>
                <td>${e.date}</td>
                <td>${e.time}</td>
                <td>${e.client}</td>
                <td><span class="status-bits">${etatStr}</span></td>
                <td>${e.pFort}</td>
                <td>${e.pFaible}</td>
            </tr>`;
        }
        
        html += '</tbody></table></div>';
        tablesContent.innerHTML = html;
    }
    
    function displayEvNRTable() {
        if (!currentData.evnrData.hasData) {
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucun événement nano-réseau sur cette période</div>';
            return;
        }
        
        let events = currentData.evnrData.events;
        let html = '<div class="table-wrapper">';
        html += '<table><thead><tr><th>Date</th><th>Heure</th><th>Mode ECO</th><th>Délestage Total</th><th>Délestage Partiel</th><th>P.Fort</th><th>P.Faible</th></tr></thead><tbody>';
        
        for (let e of events) {
            html += `<tr>
                <td>${e.date}</td>
                <td>${e.time}</td>
                <td>${e.etat.modeEco}</td>
                <td>${e.etat.delestageTotal}</td>
                <td>${e.etat.delestagePartiel}</td>
                <td>${e.pFort}</td>
                <td>${e.pFaible}</td>
            </tr>`;
        }
        
        html += '</tbody></table></div>';
        tablesContent.innerHTML = html;
    }
    
    function displayRechargeTable() {
        if (!currentData.rechargeData.hasData) {
            tablesContent.innerHTML = '<div class="empty-data">📭 Aucune donnée de recharge sur cette période</div>';
            return;
        }
        
        let events = currentData.rechargeData.events;
        let html = '<div class="table-wrapper">';
        html += '</table><thead><tr><th>Date</th><th>Heure</th><th>Type Code</th><th>P.Fort</th><th>P.Faible</th><th>Data 1-4</th></tr></thead><tbody>';
        
        for (let e of events) {
            let typeStr = Object.entries(e.typeCode).filter(([k,v]) => v === '✓').map(([k]) => k).join(', ') || 'aucun';
            let dataStr = `${e.data1}, ${e.data2}, ${e.data3}, ${e.data4}`;
            html += `<tr>
                <td>${e.date}</td>
                <td>${e.time}</td>
                <td><span class="status-bits">${typeStr}</span></td>
                <td>${e.pFort}</td>
                <td>${e.pFaible}</td>
                <td>${dataStr}</td>
            </tr>`;
        }
        
        html += '</tbody></table></div>';
        tablesContent.innerHTML = html;
    }
});