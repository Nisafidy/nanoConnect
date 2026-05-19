// parser.js - Version finale
window.DataParser = (function() {
    
    // Pour les valeurs hexadécimales (high, low, etc.)
    function hexToInt(hex) {
        return parseInt(hex, 16);
    }
    
    // Pour les dates (jour, mois, année, heure, minute) - c'est du décimal
    function decToInt(dec) {
        return parseInt(dec, 10);
    }
    
    function extractTokens(content) {
        let tokens = [];
        let lines = content.split(/\r?\n/);
        for (let line of lines) {
            let parts = line.trim().split(/\s+/);
            for (let part of parts) {
                if (part.match(/^[0-9A-Fa-f]{2}$/i)) {
                    tokens.push(part.toUpperCase());
                }
            }
        }
        return tokens;
    }
    
    function parseGeneric(hexTokens, markerSession, markerData, is16Bits) {
        let results = [];
        let i = 0;
        
        while (i < hexTokens.length) {
            if (hexTokens[i] === markerSession) {
                if (i + 6 > hexTokens.length) break;
                
                // DATES : conversion décimale
                let sessionDay = decToInt(hexTokens[i+1]);
                let sessionMonth = decToInt(hexTokens[i+2]);
                let sessionYear = 2000 + decToInt(hexTokens[i+3]);
                let sessionHour = decToInt(hexTokens[i+4]);
                let sessionMin = decToInt(hexTokens[i+5]);
                let sessionDate = `${sessionDay.toString().padStart(2,'0')}/${sessionMonth.toString().padStart(2,'0')}/${sessionYear}`;
                let sessionTime = `${sessionHour.toString().padStart(2,'0')}:${sessionMin.toString().padStart(2,'0')}`;
                i += 6;
                
                while (i < hexTokens.length && hexTokens[i] !== markerSession) {
                    if (hexTokens[i] === markerData) {
                        if (i + 5 > hexTokens.length) break;
                        
                        // DATES : conversion décimale
                        let dataDay = decToInt(hexTokens[i+1]);
                        let dataMonth = decToInt(hexTokens[i+2]);
                        let dataYear = 2000 + decToInt(hexTokens[i+3]);
                        let dataDate = `${dataDay.toString().padStart(2,'0')}/${dataMonth.toString().padStart(2,'0')}/${dataYear}`;
                        
                        // VALEURS : conversion hexadécimale
                        let highByte = hexTokens[i+4];
                        let lowByte = hexTokens[i+5];
                        
                        if (is16Bits) {
                            let value16 = (hexToInt(highByte) << 8) | hexToInt(lowByte);
                            results.push({
                                sessionDate: sessionDate,
                                sessionTime: sessionTime,
                                measureDate: dataDate,
                                value: value16,
                                volts: (value16 / 1000).toFixed(2)
                            });
                        } else {
                            results.push({
                                sessionDate: sessionDate,
                                sessionTime: sessionTime,
                                measureDate: dataDate,
                                high: hexToInt(highByte),
                                low: hexToInt(lowByte)
                            });
                        }
                        i += 6;
                    } else {
                        i++;
                    }
                }
            } else {
                i++;
            }
        }
        return results;
    }
    
    function parseCredit(content) {
        let tokens = extractTokens(content);
        return parseGeneric(tokens, 'B2', 'B3', false);
    }
    
    function parseEnergie(content) {
        let tokens = extractTokens(content);
        return parseGeneric(tokens, 'A2', 'A3', false);
    }
    
    function parseTension(content) {
        let tokens = extractTokens(content);
        return parseGeneric(tokens, 'C2', 'C3', true);
    }
    
    function parseEvenementClient(content) {
        let tokens = extractTokens(content);
        let events = [];
        let i = 0;
        
        while (i < tokens.length) {
            if (tokens[i] === 'E2') {
                if (i + 6 > tokens.length) break;
                let day = decToInt(tokens[i+1]);
                let month = decToInt(tokens[i+2]);
                let year = 2000 + decToInt(tokens[i+3]);
                let hour = decToInt(tokens[i+4]);
                let min = decToInt(tokens[i+5]);
                let date = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let time = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                while (i < tokens.length && tokens[i] !== 'E3') i++;
                if (i + 5 > tokens.length) break;
                
                if (tokens[i] === 'E3') {
                    let client = decToInt(tokens[i+1]);
                    let etatByte = hexToInt(tokens[i+2]);
                    let pFort = hexToInt(tokens[i+3]);
                    let pFaible = hexToInt(tokens[i+4]);
                    
                    events.push({
                        date: date, time: time, client: client,
                        etat: {
                            actif: (etatByte & 1) ? 'Actif' : 'Inactif',
                            creditNul: (etatByte & 2) ? 'Oui' : 'Non',
                            energieEpuisee: (etatByte & 4) ? 'Oui' : 'Non',
                            surcharge: (etatByte & 8) ? 'Oui' : 'Non',
                            puissanceDepassee: (etatByte & 16) ? 'Oui' : 'Non'
                        },
                        pFort: pFort, pFaible: pFaible
                    });
                    i += 5;
                }
            } else { i++; }
        }
        return { hasData: events.length > 0, events };
    }
    
    function parseEvNR(content) {
        let tokens = extractTokens(content);
        let events = [];
        let i = 0;
        
        while (i < tokens.length) {
            if (tokens[i] === 'D2') {
                if (i + 6 > tokens.length) break;
                let day = decToInt(tokens[i+1]);
                let month = decToInt(tokens[i+2]);
                let year = 2000 + decToInt(tokens[i+3]);
                let hour = decToInt(tokens[i+4]);
                let min = decToInt(tokens[i+5]);
                let date = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let time = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                while (i < tokens.length && tokens[i] !== 'D3') i++;
                if (i + 4 > tokens.length) break;
                
                if (tokens[i] === 'D3') {
                    let etatByte = hexToInt(tokens[i+1]);
                    let pFort = hexToInt(tokens[i+2]);
                    let pFaible = hexToInt(tokens[i+3]);
                    
                    events.push({
                        date: date, time: time,
                        etat: {
                            modeEco: (etatByte & 1) ? 'ON' : 'OFF',
                            delestageTotal: (etatByte & 2) ? 'Oui' : 'Non',
                            delestagePartiel: (etatByte & 4) ? 'Oui' : 'Non'
                        },
                        pFort: pFort, pFaible: pFaible
                    });
                    i += 4;
                }
            } else { i++; }
        }
        return { hasData: events.length > 0, events };
    }
    
    function parseRecharge(content) {
        let tokens = extractTokens(content);
        let events = [];
        let i = 0;
        
        while (i < tokens.length) {
            if (tokens[i] === 'F2') {
                if (i + 6 > tokens.length) break;
                let day = decToInt(tokens[i+1]);
                let month = decToInt(tokens[i+2]);
                let year = 2000 + decToInt(tokens[i+3]);
                let hour = decToInt(tokens[i+4]);
                let min = decToInt(tokens[i+5]);
                let date = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
                let time = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
                i += 6;
                
                while (i < tokens.length && tokens[i] !== 'F3') i++;
                if (i + 8 > tokens.length) break;
                
                if (tokens[i] === 'F3') {
                    let typeCode = hexToInt(tokens[i+1]);
                    let pFort = hexToInt(tokens[i+2]);
                    let pFaible = hexToInt(tokens[i+3]);
                    
                    events.push({
                        date: date, time: time,
                        typeCode: {
                            recharge: (typeCode & 1) ? '✓' : '✗',
                            eco: (typeCode & 2) ? '✓' : '✗',
                            ep: (typeCode & 4) ? '✓' : '✗',
                            tolerance: (typeCode & 8) ? '✓' : '✗',
                            forfait: (typeCode & 16) ? '✓' : '✗'
                        },
                        pFort: pFort, pFaible: pFaible,
                        data1: hexToInt(tokens[i+4]), data2: hexToInt(tokens[i+5]),
                        data3: hexToInt(tokens[i+6]), data4: hexToInt(tokens[i+7])
                    });
                    i += 8;
                }
            } else { i++; }
        }
        return { hasData: events.length > 0, events };
    }
    
    async function parseDirectory(files) {
        let folderName = null;
        let nrInfo = { nrNumber: null, startDate: null, endDate: null };
        
        for (let file of files) {
            if (file.webkitRelativePath) {
                let parts = file.webkitRelativePath.split('/');
                if (parts.length >= 2 && !folderName) folderName = parts[0];
            }
        }
        
        if (folderName) {
            let match = folderName.match(/^NR(\d+)_(\d{6})_(\d{6})$/);
            if (match) {
                nrInfo.nrNumber = parseInt(match[1]);
                let start = match[2];
                let end = match[3];
                nrInfo.startDate = `${start.slice(0,2)}/${start.slice(2,4)}/${start.slice(4,6)}`;
                nrInfo.endDate = `${end.slice(0,2)}/${end.slice(2,4)}/${end.slice(4,6)}`;
            }
        }
        
        let creditData = new Map();
        let energieData = new Map();
        let tensionData = [];
        let ecData = { hasData: false, events: [] };
        let evnrData = { hasData: false, events: [] };
        let rechargeData = { hasData: false, events: [] };
        
        for (let file of files) {
            if (!file.name.endsWith('.txt')) continue;
            let content = await file.text();
            let name = file.name;
            
            if (name.match(/^C\d+_/)) {
                let match = name.match(/^C(\d+)_/);
                if (match) creditData.set(parseInt(match[1]), parseCredit(content));
            }
            else if (name.match(/^E\d+_/)) {
                let match = name.match(/^E(\d+)_/);
                if (match) energieData.set(parseInt(match[1]), parseEnergie(content));
            }
            else if (name.startsWith('T_')) tensionData = parseTension(content);
            else if (name.startsWith('EC_')) ecData = parseEvenementClient(content);
            else if (name.startsWith('EvNR_')) evnrData = parseEvNR(content);
            else if (name.startsWith('R_')) rechargeData = parseRecharge(content);
        }
        
        return { nrInfo, creditData, energieData, tensionData, ecData, evnrData, rechargeData };
    }
    
    return { parseDirectory };
})();