// parser.js - Module de parsing corrigé
window.DataParser = (function() {
    
    // Convertir 2 octets hexadécimaux en entier 16 bits (big-endian)
    function hexPairToInt16(highHex, lowHex) {
        return (parseInt(highHex, 16) << 8) | parseInt(lowHex, 16);
    }
    
    // Convertir 1 octet hexadécimal en entier
    function hexToInt(hex) {
        return parseInt(hex, 16);
    }
    
    // Parser les données pour Crédit (B2/B3) ou Energie (A2/A3)
    function parseCreditEnergie(hexTokens, startIdx) {
        let records = []; // { date, time, values: [{ high, low }] dans l'ordre des points}
        let i = startIdx;
        
        while (i < hexTokens.length) {
            // Chercher un marqueur d'horodatage (B2 ou A2)
            if (hexTokens[i] === 'B2' || hexTokens[i] === 'A2') {
                // Horodatage: B2 JJ MM AA HH MM
                if (i + 6 > hexTokens.length) break;
                let day = hexToInt(hexTokens[i+1]);
                let month = hexToInt(hexTokens[i+2]);
                let year = 2000 + hexToInt(hexTokens[i+3]);
                let hour = hexToInt(hexTokens[i+4]);
                let min = hexToInt(hexTokens[i+5]);
                let dateStr = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                // Collecter les données qui suivent jusqu'au prochain B2/A2 ou fin
                let valueRecords = [];
                while (i < hexTokens.length && hexTokens[i] !== 'B2' && hexTokens[i] !== 'A2') {
                    if (hexTokens[i] === 'B3' || hexTokens[i] === 'A3') {
                        // B3/A3: jour mois an haute basse
                        if (i + 5 > hexTokens.length) break;
                        let dataDay = hexToInt(hexTokens[i+1]);
                        let dataMonth = hexToInt(hexTokens[i+2]);
                        let dataYear = 2000 + hexToInt(hexTokens[i+3]);
                        let high = hexToInt(hexTokens[i+4]);
                        let low = hexToInt(hexTokens[i+5]);
                        let dataDateStr = `${dataDay.toString().padStart(2,'0')}/${dataMonth.toString().padStart(2,'0')}/${dataYear}`;
                        valueRecords.push({
                            date: dataDateStr,
                            high: high,
                            low: low
                        });
                        i += 6;
                    } else if (hexTokens[i] === 'FF') {
                        // FF est un remplissage, on ignore
                        i++;
                    } else {
                        // Si ce n'est ni B3/A3 ni FF, on avance (cas improbable)
                        i++;
                    }
                }
                
                if (valueRecords.length > 0) {
                    records.push({
                        date: dateStr,
                        time: timeStr,
                        values: valueRecords
                    });
                }
            } else {
                i++;
            }
        }
        return records;
    }
    
    // Parser Tension (C2/C3) - valeurs sur 2 octets en mV
    function parseTension(hexTokens) {
        let records = [];
        let i = 0;
        
        while (i < hexTokens.length) {
            if (hexTokens[i] === 'C2') {
                // Horodatage: C2 JJ MM AA HH MM
                if (i + 6 > hexTokens.length) break;
                let day = hexToInt(hexTokens[i+1]);
                let month = hexToInt(hexTokens[i+2]);
                let year = 2000 + hexToInt(hexTokens[i+3]);
                let hour = hexToInt(hexTokens[i+4]);
                let min = hexToInt(hexTokens[i+5]);
                let dateStr = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                let tensionRecords = [];
                while (i < hexTokens.length && hexTokens[i] !== 'C2') {
                    if (hexTokens[i] === 'C3') {
                        // C3: jour mois an high low (16 bits)
                        if (i + 5 > hexTokens.length) break;
                        let dataDay = hexToInt(hexTokens[i+1]);
                        let dataMonth = hexToInt(hexTokens[i+2]);
                        let dataYear = 2000 + hexToInt(hexTokens[i+3]);
                        let highByte = hexTokens[i+4];
                        let lowByte = hexTokens[i+5];
                        let mV = hexPairToInt16(highByte, lowByte);
                        let dataDateStr = `${dataDay.toString().padStart(2,'0')}/${dataMonth.toString().padStart(2,'0')}/${dataYear}`;
                        tensionRecords.push({
                            date: dataDateStr,
                            mV: mV,
                            volts: (mV / 1000).toFixed(2)
                        });
                        i += 6;
                    } else if (hexTokens[i] === 'FF') {
                        i++;
                    } else {
                        i++;
                    }
                }
                
                if (tensionRecords.length > 0) {
                    records.push({
                        date: dateStr,
                        time: timeStr,
                        values: tensionRecords
                    });
                }
            } else {
                i++;
            }
        }
        return records;
    }
    
    // Parser Evenement Client (EC)
    function parseEvenementClient(content) {
        let hexTokens = extractHexTokens(content);
        let events = [];
        let i = 0;
        
        while (i < hexTokens.length) {
            // Priorité à E2 et E3 - on ignore E5 comme bloqueur
            if (hexTokens[i] === 'E2') {
                // Horodatage
                if (i + 6 > hexTokens.length) break;
                let day = hexToInt(hexTokens[i+1]);
                let month = hexToInt(hexTokens[i+2]);
                let year = 2000 + hexToInt(hexTokens[i+3]);
                let hour = hexToInt(hexTokens[i+4]);
                let min = hexToInt(hexTokens[i+5]);
                let dateStr = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                // Attendre E3
                while (i < hexTokens.length && hexTokens[i] !== 'E3') i++;
                if (i + 9 >= hexTokens.length) break;
                
                if (hexTokens[i] === 'E3') {
                    let client = hexToInt(hexTokens[i+1]);
                    let etatByte = hexToInt(hexTokens[i+2]);
                    let pFort = hexToInt(hexTokens[i+3]);
                    let pFaible = hexToInt(hexTokens[i+4]);
                    
                    let etatBits = {
                        actif: (etatByte & 1) ? 'Actif' : 'Inactif',
                        creditNul: (etatByte & 2) ? '✓' : '✗',
                        energieEpuisee: (etatByte & 4) ? '✓' : '✗',
                        surcharge: (etatByte & 8) ? '✓' : '✗',
                        puissanceDepassee: (etatByte & 16) ? '✓' : '✗'
                    };
                    
                    events.push({
                        date: dateStr,
                        time: timeStr,
                        client: client,
                        etat: etatBits,
                        pFort: pFort,
                        pFaible: pFaible
                    });
                    i += 5;
                }
            } else {
                i++;
            }
        }
        
        // hasData = true s'il y a au moins un événement, false sinon
        return { hasData: events.length > 0, events };
    }
    
    // Parser Evenement NanoReseau (EvNR)
    function parseEvNR(content) {
        let hexTokens = extractHexTokens(content);
        let events = [];
        let i = 0;
        
        while (i < hexTokens.length) {
            if (hexTokens[i] === 'D2') {
                if (i + 6 > hexTokens.length) break;
                let day = hexToInt(hexTokens[i+1]);
                let month = hexToInt(hexTokens[i+2]);
                let year = 2000 + hexToInt(hexTokens[i+3]);
                let hour = hexToInt(hexTokens[i+4]);
                let min = hexToInt(hexTokens[i+5]);
                let dateStr = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                while (i < hexTokens.length && hexTokens[i] !== 'D3') i++;
                if (i + 3 >= hexTokens.length) break;
                
                if (hexTokens[i] === 'D3') {
                    let etatByte = hexToInt(hexTokens[i+1]);
                    let pFort = hexToInt(hexTokens[i+2]);
                    let pFaible = hexToInt(hexTokens[i+3]);
                    
                    let etat = {
                        modeEco: (etatByte & 1) ? 'ON' : 'OFF',
                        delestageTotal: (etatByte & 2) ? '✓' : '✗',
                        delestagePartiel: (etatByte & 4) ? '✓' : '✗'
                    };
                    
                    events.push({
                        date: dateStr,
                        time: timeStr,
                        etat: etat,
                        pFort: pFort,
                        pFaible: pFaible
                    });
                    i += 4;
                }
            } else {
                i++;
            }
        }
        return { hasData: events.length > 0, events };
    }
    
    // Parser Recharge
    function parseRecharge(content) {
        let hexTokens = extractHexTokens(content);
        let events = [];
        let i = 0;
        
        while (i < hexTokens.length) {
            if (hexTokens[i] === 'F2') {
                if (i + 6 > hexTokens.length) break;
                let day = hexToInt(hexTokens[i+1]);
                let month = hexToInt(hexTokens[i+2]);
                let year = 2000 + hexToInt(hexTokens[i+3]);
                let hour = hexToInt(hexTokens[i+4]);
                let min = hexToInt(hexTokens[i+5]);
                let dateStr = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                while (i < hexTokens.length && hexTokens[i] !== 'F3') i++;
                if (i + 7 >= hexTokens.length) break;
                
                if (hexTokens[i] === 'F3') {
                    let typeCode = hexToInt(hexTokens[i+1]);
                    let pFort = hexToInt(hexTokens[i+2]);
                    let pFaible = hexToInt(hexTokens[i+3]);
                    let data1 = hexToInt(hexTokens[i+4]);
                    let data2 = hexToInt(hexTokens[i+5]);
                    let data3 = hexToInt(hexTokens[i+6]);
                    let data4 = hexToInt(hexTokens[i+7]);
                    
                    let typeBits = {
                        codeRecharge: (typeCode & 1) ? '✓' : '✗',
                        codeEco: (typeCode & 2) ? '✓' : '✗',
                        codeEP: (typeCode & 4) ? '✓' : '✗',
                        codeTolerance: (typeCode & 8) ? '✓' : '✗',
                        codeForfait: (typeCode & 16) ? '✓' : '✗'
                    };
                    
                    events.push({
                        date: dateStr,
                        time: timeStr,
                        typeCode: typeBits,
                        pFort: pFort,
                        pFaible: pFaible,
                        data1, data2, data3, data4
                    });
                    i += 8;
                }
            } else {
                i++;
            }
        }
        return { hasData: events.length > 0, events };
    }
    
    // Extraire les tokens hexadécimaux d'un contenu texte
    function extractHexTokens(content) {
        let tokens = [];
        let lines = content.split(/\r?\n/);
        for (let line of lines) {
            let parts = line.trim().split(/\s+/);
            for (let part of parts) {
                if (part.match(/^[0-9A-Fa-f]{2}$/)) {
                    tokens.push(part.toUpperCase());
                }
            }
        }
        return tokens;
    }
    
    // Lire un fichier et extraire ses données
    async function readFile(file) {
        return await file.text();
    }
    
    // Parser principal
    async function parseDirectory(files) {
        let nrInfo = { nrNumber: null, startDate: null, endDate: null };
        let folderName = null;
        
        // Extraire le nom du dossier
        for (let file of files) {
            if (file.webkitRelativePath) {
                let parts = file.webkitRelativePath.split('/');
                if (parts.length >= 2 && !folderName) folderName = parts[0];
            }
        }
        
        // Parser le nom du dossier
        if (folderName) {
            let matchNr = folderName.match(/^NR(\d+)_(\d{6})_(\d{6})$/);
            if (matchNr) {
                nrInfo.nrNumber = parseInt(matchNr[1]);
                let start = matchNr[2];
                let end = matchNr[3];
                nrInfo.startDate = `${start.slice(0,2)}/${start.slice(2,4)}/${start.slice(4,6)}`;
                nrInfo.endDate = `${end.slice(0,2)}/${end.slice(2,4)}/${end.slice(4,6)}`;
            }
        }
        
        // Stockage des données par client
        let creditData = new Map(); // clientId -> records
        let energieData = new Map(); // clientId -> records
        let tensionData = [];
        let ecData = { hasData: false, events: [] };
        let evnrData = { hasData: false, events: [] };
        let rechargeData = { hasData: false, events: [] };
        
        // Parcourir tous les fichiers
        for (let file of files) {
            if (!file.name.match(/\.txt$/i)) continue;
            
            let content = await readFile(file);
            let hexTokens = extractHexTokens(content);
            let name = file.name;
            
            // Crédit: CXX_...
            if (name.match(/^C\d+_/)) {
                let clientMatch = name.match(/^C(\d+)_/);
                if (clientMatch) {
                    let clientId = parseInt(clientMatch[1]);
                    let records = parseCreditEnergie(hexTokens, 0);
                    creditData.set(clientId, records);
                }
            }
            // Energie: EXX_...
            else if (name.match(/^E\d+_/)) {
                let clientMatch = name.match(/^E(\d+)_/);
                if (clientMatch) {
                    let clientId = parseInt(clientMatch[1]);
                    let records = parseCreditEnergie(hexTokens, 0);
                    energieData.set(clientId, records);
                }
            }
            // Tension
            else if (name.match(/^T_/)) {
                tensionData = parseTension(hexTokens);
            }
            // Evenement Client
            else if (name.match(/^EC_/)) {
                ecData = parseEvenementClient(content);
            }
            // Evenement NanoReseau
            else if (name.match(/^EvNR_/)) {
                evnrData = parseEvNR(content);
            }
            // Recharge
            else if (name.match(/^R_/)) {
                rechargeData = parseRecharge(content);
            }
        }
        
        return {
            nrInfo,
            creditData,
            energieData,
            tensionData,
            ecData,
            evnrData,
            rechargeData
        };
    }
    
    return { parseDirectory };
})();