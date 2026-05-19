// main.js
document.addEventListener('DOMContentLoaded', () => {
    const folderInput = document.getElementById('folderInput');
    const uploadArea = document.getElementById('uploadArea');
    const infoSection = document.getElementById('infoSection');
    const mainTabsContainer = document.getElementById('mainTabsContainer');
    const subTabsContainer = document.getElementById('subTabsContainer');
    const tablesContent = document.getElementById('tablesContent');
    
    let currentData = null;
    let currentMainTab = 'credit';
    let currentClient = null;
    
    // Sauvegarde
    const STORAGE_KEY = 'nanoreseau_data';
    
    function saveData() {
        if (currentData) {
            let toSave = {
                nrInfo: currentData.nrInfo,
                creditData: Array.from(currentData.creditData.entries()),
                energieData: Array.from(currentData.energieData.entries()),
                tensionData: currentData.tensionData,
                ecData: currentData.ecData,
                evnrData: currentData.evnrData,
                rechargeData: currentData.rechargeData
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
    }
    
    function loadData() {
        let saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            let data = JSON.parse(saved);
            data.creditData = new Map(data.creditData);
            data.energieData = new Map(data.energieData);
            currentData = data;
            return true;
        }
        return false;
    }
    
    function clearData() {
        localStorage.removeItem(STORAGE_KEY);
        currentData = null;
        location.reload();
    }
    
    // Affichage
    function display() {
        if (!currentData) return;
        
        // Info
        let nr = currentData.nrInfo;
        let days = '---';
        if (nr.startDate && nr.endDate) {
            let [d1, m1, y1] = nr.startDate.split('/');
            let [d2, m2, y2] = nr.endDate.split('/');
            let date1 = new Date(2000 + parseInt(y1), parseInt(m1)-1, parseInt(d1));
            let date2 = new Date(2000 + parseInt(y2), parseInt(m2)-1, parseInt(d2));
            days = Math.ceil((date2 - date1) / 86400000);
        }
        
        infoSection.innerHTML = `
            <div class="info-panel">
                <h2>NanoRéseau n°${nr.nrNumber || '?'}</h2>
                <div class="info-grid">
                    <div class="info-card">Début: ${nr.startDate || '---'}</div>
                    <div class="info-card">Fin: ${nr.endDate || '---'}</div>
                    <div class="info-card">Jours: ${days}</div>
                </div>
            </div>
        `;
        
        // Onglets principaux
        mainTabsContainer.innerHTML = `
            <button class="main-tab-btn ${currentMainTab === 'credit' ? 'active' : ''}" data-tab="credit">💰 Crédit</button>
            <button class="main-tab-btn ${currentMainTab === 'energie' ? 'active' : ''}" data-tab="energie">⚡ Énergie</button>
            <button class="main-tab-btn ${currentMainTab === 'tension' ? 'active' : ''}" data-tab="tension">📊 Tension</button>
            <button class="main-tab-btn ${currentMainTab === 'ec' ? 'active' : ''}" data-tab="ec">📋 Événements Client</button>
            <button class="main-tab-btn ${currentMainTab === 'evnr' ? 'active' : ''}" data-tab="evnr">🏭 Événements NR</button>
            <button class="main-tab-btn ${currentMainTab === 'recharge' ? 'active' : ''}" data-tab="recharge">🔋 Recharge</button>
            <button class="main-tab-btn" id="clearBtn">🗑️ Effacer</button>
        `;
        
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'clearBtn') {
                    clearData();
                } else {
                    currentMainTab = btn.dataset.tab;
                    display();
                }
            });
        });
        
        // Sous-onglets et tableau
        if (currentMainTab === 'credit') {
            let clients = Array.from(currentData.creditData.keys()).sort();
            if (clients.length === 0) {
                tablesContent.innerHTML = '<div class="empty-data">Aucune donnée Crédit</div>';
                subTabsContainer.innerHTML = '';
                return;
            }
            if (!currentClient || !clients.includes(currentClient)) currentClient = clients[0];
            
            subTabsContainer.innerHTML = clients.map(c => 
                `<button class="sub-tab-btn ${currentClient === c ? 'active' : ''}" data-client="${c}">Client ${c}</button>`
            ).join('');
            
            document.querySelectorAll('.sub-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentClient = parseInt(btn.dataset.client);
                    display();
                });
            });
            
            let records = currentData.creditData.get(currentClient);
            if (!records || records.length === 0) {
                tablesContent.innerHTML = '<div class="empty-data">Aucune donnée</div>';
            } else {
                tablesContent.innerHTML = `
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Date session</th><th>Heure</th><th>Date mesure</th><th>Haute</th><th>Basse</th></tr></thead>
                            <tbody>
                                ${records.map(r => `<tr><td>${r.sessionDate}</td><td>${r.sessionTime}</td><td>${r.measureDate}</td><td>${r.high}</td><td>${r.low}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        else if (currentMainTab === 'energie') {
            let clients = Array.from(currentData.energieData.keys()).sort();
            if (clients.length === 0) {
                tablesContent.innerHTML = '<div class="empty-data">Aucune donnée Énergie</div>';
                subTabsContainer.innerHTML = '';
                return;
            }
            if (!currentClient || !clients.includes(currentClient)) currentClient = clients[0];
            
            subTabsContainer.innerHTML = clients.map(c => 
                `<button class="sub-tab-btn ${currentClient === c ? 'active' : ''}" data-client="${c}">Client ${c}</button>`
            ).join('');
            
            document.querySelectorAll('.sub-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentClient = parseInt(btn.dataset.client);
                    display();
                });
            });
            
            let records = currentData.energieData.get(currentClient);
            if (!records || records.length === 0) {
                tablesContent.innerHTML = '<div class="empty-data">Aucune donnée</div>';
            } else {
                tablesContent.innerHTML = `
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Date session</th><th>Heure</th><th>Date mesure</th><th>Haute</th><th>Basse</th></tr></thead>
                            <tbody>
                                ${records.map(r => `<tr><td>${r.sessionDate}</td><td>${r.sessionTime}</td><td>${r.measureDate}</td><td>${r.high}</td><td>${r.low}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        else if (currentMainTab === 'tension') {
            subTabsContainer.innerHTML = '';
            let records = currentData.tensionData;
            if (!records || records.length === 0) {
                tablesContent.innerHTML = '<div class="empty-data">Aucune donnée Tension</div>';
            } else {
                tablesContent.innerHTML = `
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Date session</th><th>Heure</th><th>Date mesure</th><th>Tension (V)</th><th>Tension (mV)</th></tr></thead>
                            <tbody>
                                ${records.map(r => `<tr><td>${r.sessionDate}</td><td>${r.sessionTime}</td><td>${r.measureDate}</td><td>${r.volts}</td><td>${r.value}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        else if (currentMainTab === 'ec') {
            subTabsContainer.innerHTML = '';
            if (!currentData.ecData.hasData) {
                tablesContent.innerHTML = '<div class="empty-data">Aucun événement client</div>';
            } else {
                tablesContent.innerHTML = `
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>État</th><th>P.Fort</th><th>P.Faible</th></tr></thead>
                            <tbody>
                                ${currentData.ecData.events.map(e => `<tr>
                                    <td>${e.date}</td>
                                    <td>${e.time}</td>
                                    <td>${e.client}</td>
                                    <td>Actif:${e.etat.actif} CréditNul:${e.etat.creditNul} EnergieEpuisée:${e.etat.energieEpuisee} Surcharge:${e.etat.surcharge} P.Dépassée:${e.etat.puissanceDepassee}</td>
                                    <td>${e.pFort}</td>
                                    <td>${e.pFaible}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        else if (currentMainTab === 'evnr') {
            subTabsContainer.innerHTML = '';
            if (!currentData.evnrData.hasData) {
                tablesContent.innerHTML = '<div class="empty-data">Aucun événement NR</div>';
            } else {
                tablesContent.innerHTML = `
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Date</th><th>Heure</th><th>Mode ECO</th><th>Délestage Total</th><th>Délestage Partiel</th><th>P.Fort</th><th>P.Faible</th></tr></thead>
                            <tbody>
                                ${currentData.evnrData.events.map(e => `<tr>
                                    <td>${e.date}</td>
                                    <td>${e.time}</td>
                                    <td>${e.etat.modeEco}</td>
                                    <td>${e.etat.delestageTotal}</td>
                                    <td>${e.etat.delestagePartiel}</td>
                                    <td>${e.pFort}</td>
                                    <td>${e.pFaible}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        else if (currentMainTab === 'recharge') {
            subTabsContainer.innerHTML = '';
            if (!currentData.rechargeData.hasData) {
                tablesContent.innerHTML = '<div class="empty-data">Aucune donnée recharge</div>';
            } else {
                tablesContent.innerHTML = `
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Date</th><th>Heure</th><th>Type</th><th>P.Fort</th><th>P.Faible</th><th>Data</th></tr></thead>
                            <tbody>
                                ${currentData.rechargeData.events.map(e => `<tr>
                                    <td>${e.date}</td>
                                    <td>${e.time}</td>
                                    <td>${Object.entries(e.typeCode).filter(([k,v]) => v === '✓').map(([k]) => k).join(', ')}</td>
                                    <td>${e.pFort}</td>
                                    <td>${e.pFaible}</td>
                                    <td>${e.data1}, ${e.data2}, ${e.data3}, ${e.data4}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    }
    
    async function loadFromFiles(files) {
        tablesContent.innerHTML = '<div class="empty-data">⏳ Analyse en cours...</div>';
        try {
            currentData = await window.DataParser.parseDirectory(files);
            saveData();
            display();
        } catch(e) {
            tablesContent.innerHTML = `<div class="empty-data">❌ Erreur: ${e.message}</div>`;
        }
    }
    
    uploadArea.addEventListener('click', () => folderInput.click());
    folderInput.addEventListener('change', async (e) => {
        if (e.target.files.length) await loadFromFiles(Array.from(e.target.files));
    });
    
    if (loadData()) display();
});